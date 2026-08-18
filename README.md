# Mini Harness

A coding agent's runtime, built from scratch in TypeScript to understand what
tools like Claude Code or Cursor's agent mode are actually doing underneath —
no agent framework, no black box. Every piece — the tool-call loop, the
sandboxing, the context summarization — is hand-written and small enough to
read start to finish in one sitting.

> The LLM decides *what* should happen. The harness controls *how* it happens.

---

## What it actually does

You get a terminal chat loop backed by the OpenAI Responses API. The model
can read files, write files, edit files precisely, list directories, search
file contents, and run shell commands — by asking the harness to do it, never
directly. Every mutating action is shown to you and requires a yes/no before
it runs. The conversation persists and self-summarizes as it grows, so long
sessions don't overflow the model's context or your API budget.

```
You: create a fizzbuzz script and run it

[tool] write_file
[confirm] About to run "write_file": { path: "fizzbuzz.ts", content: "..." }
Allow this action? (y/N) y
[tool result] Successfully wrote fizzbuzz.ts

[tool] bash
[confirm] About to run "bash": { command: "bun run fizzbuzz.ts" }
Allow this action? (y/N) y
[tool result] STDOUT: 1 2 Fizz 4 Buzz ...

Assistant: Created fizzbuzz.ts and ran it — output above.
```

---

## Architecture

```
   User
    │
    ▼
  cli.ts ──────────────────────────  askUser() — one inquirer prompt per turn
    │
    ▼
 index.ts ───────────────────────── owns the REPL: history array, /exit
    │                                /clear /help, catches per-turn errors
    ▼
harness.ts ── runHarness(msg, history, summary)
    │
    ├─ buildSystemPrompt()  → injects cwd, OS, top-level file listing
    ├─ summarizeMessages()  → compresses old turns once history grows
    │
    ▼
  llm.ts ── generateResponse(input, instructions)
    │            OpenAI Responses API, tool definitions attached
    ▼
 tool call? ──No──▶ return final text, save to history
    │
   Yes
    ▼
tool-executor.ts ── resolves + sandbox-checks paths, asks for confirmation,
    │                 executes, catches tool errors so one bad call
    │                 can't crash the loop
    ▼
 src/tools/*.ts ── read_file · write_file · edit_file · list_files · grep · bash
    │
    ▼
 result fed back into `input`, loop continues (capped at 25 iterations)
```

The important boundary is `tool-executor.ts`: individual tools stay dumb —
they just declare *which* of their arguments are paths and *whether* they
need confirmation — and the executor is the single place that enforces
sandboxing and asks the user, so every current and future tool gets both for
free instead of reimplementing them.

---

## Project structure

```
harness/
├── src/
│   ├── index.ts                 REPL loop, history array, slash commands
│   ├── cli.ts                   terminal input (inquirer)
│   ├── harness.ts                agent loop, system prompt, summarization
│   ├── llm.ts                    OpenAI Responses API client
│   ├── types.ts                  shared types
│   ├── conversation/
│   │   └── conversation.ts       message-history helper (not currently wired in —
│   │                              harness.ts threads a plain array instead)
│   └── tools/
│       ├── types.ts              Tool contract (parameters, pathArgs, confirm)
│       ├── registry.ts           tool list handed to the model
│       ├── tool-executor.ts      sandboxing + confirmation + dispatch
│       ├── read-file.ts
│       ├── write-file.ts
│       ├── edit-file.ts          exact-match single-occurrence replace
│       ├── list-files.ts
│       ├── grep.ts               recursive text search, skips node_modules/.git
│       └── bash.ts               shell exec, timeout + output cap
├── .env                          OPENAI_API_KEY (gitignored)
├── package.json
├── tsconfig.json
├── FUTURE.md                     honest gap list + roadmap
└── README.md
```

---

## The tool contract

Every tool is a plain object — no inheritance, no plugin machinery:

```ts
type Tool = {
  name: string;
  description: string;
  parameters: JSONSchema;          // sent to the model as the function signature
  pathArgs?: string[];             // which args the executor should sandbox-check
  requiresConfirmation?: boolean;  // whether the executor should ask first
  execute: (args) => Promise<string>;
};
```

Adding a new tool is: write the object, push it into `registry.ts`. Nothing
else in the harness has to change — the executor already knows how to
sandbox and confirm it based on those two flags.

| Tool | Confirmation required | Path-sandboxed |
|---|---|---|
| `read_file` | no | yes |
| `write_file` | **yes** | yes |
| `edit_file` | **yes** | yes |
| `list_files` | no | no *(see [FUTURE.md](FUTURE.md))* |
| `grep` | no | n/a — hardcoded to project root |
| `bash` | **yes** | n/a — arbitrary shell command |

---

## Safety model

The model can suggest anything; the harness decides what's actually allowed
to happen.

- **Confirm before mutating.** `write_file`, `edit_file`, and `bash` all print
  the exact action and arguments and wait for an explicit `y` before running.
- **Path sandboxing, enforced once.** `tool-executor.ts` resolves every
  declared path argument against `process.cwd()` and rejects anything that
  resolves outside it — blocking `../../` escapes — for every tool that
  declares `pathArgs`, without each tool re-implementing the check.
- **Bounded shell execution.** `bash` runs with a 30s timeout and a 200KB
  output cap; both timeouts and oversized output return a clear message
  instead of hanging the terminal or flooding the conversation.
- **Bounded agent loop.** The tool-call loop inside `runHarness` hard-stops
  after 25 iterations, so a confused model can't spin forever burning API
  budget.
- **Tool errors don't crash the loop.** `tool-executor.ts` catches per-tool
  exceptions and returns them to the model as a normal tool result, so a bad
  argument becomes something the model can recover from, not a crash.

---

## Context management

An LLM call is stateless — the harness is what makes it feel like a
conversation. `runHarness` maintains a `history` array and re-sends it (plus
a dynamically-built system prompt) on every turn.

Left unchecked, that history grows without bound. So once it passes 20
messages, the oldest ones are compressed: a dedicated LLM call folds them
into a running `summary` string (goals, decisions, constraints, completed
work), the raw messages are dropped, and the summary is re-injected as
context on every later turn instead. The last 10 messages always stay intact
verbatim — only the older tail gets compressed. This is the actual mechanism
behind "the agent still remembers what we were doing 40 messages ago"
without re-sending 40 messages' worth of tokens forever.

## Environment awareness

The system prompt isn't static — `buildSystemPrompt()` rebuilds it every
turn with the current working directory, detected OS, and a fresh top-level
directory listing, so the model is told where it's operating instead of
having to guess or ask.

---

## Getting started

**Prerequisites:** [Bun](https://bun.sh/) and an OpenAI API key.

```bash
git clone <your-repository-url>
cd harness
bun install
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
```

Run it:

```bash
bun run dev
```

Slash commands available in the REPL: `/help`, `/clear` (wipes history and
summary), `/exit`.

---

## Tech stack

| Piece | Choice |
|---|---|
| Language | TypeScript, run directly via Bun (no build step) |
| Model API | OpenAI Responses API (`openai` SDK) |
| CLI input | `inquirer` |
| Terminal color | `picocolors` |
| Env config | `dotenv` |

---

## What this project is for

This isn't meant to compete with a production agent framework — it's meant
to be small enough that every layer is legible: how tool-calling actually
works over the wire, why sandboxing has to live in one shared place instead
of per-tool, and why "remembering everything" eventually requires
summarization instead of just sending more tokens. Each of those was built
as a deliberate, separable step rather than pulled in from a library.

The honest list of what's still rough — a couple of small bugs, missing
tests, and where this goes next — is in [FUTURE.md](FUTURE.md).
