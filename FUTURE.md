# Future Work

Status check as of 2026-08-18, based on a full read of `src/`. Short version:
**stages 0–6 are functionally in place, stage 7 is the one still open.** Below
is what's actually true in the code today, the specific bugs worth fixing
before you call this "done," and where to take it next.

Legend: 🟢 done · 🟡 done but with a gap · 🔴 not done

---

## Where each stage actually stands

### 🟢 Stage 0 — Body (listen / read / write / list / run)
All wired end to end. Not revisiting.

### 🟡 Stage 1 — Memory bug
- `history` is created once in [index.ts](src/index.ts) before the `while (true)`
  loop and threaded into `runHarness()` every turn. ✅
- Tool loop has a hard cap — `MAX_ITERATIONS = 25` in
  [harness.ts](src/harness.ts#L157). ✅
- You went with "pass the growing array in" rather than the `Conversation`
  class — that's a legitimate choice the stage doc explicitly allowed, **but**
  it means `src/conversation/conversation.ts` is now dead code (see cleanup
  list below).
- ⚠️ **`model: "gpt-5.4"` in [llm.ts:19](src/llm.ts#L19) is almost certainly
  not a real model id.** The stage doc called this out by name — it's still
  unverified. This fails as an opaque API error, not a compile error, so it's
  easy to miss until you actually run it. Confirm the exact model string
  against your OpenAI account before a demo.

### 🟡 Stage 2 — Safer toolbox
- Confirmation prompt before mutating/running tools: works, via
  `requiresConfirmation` + `confirmAction()` in
  [tool-executor.ts](src/tools/tool-executor.ts#L19). ✅
- Path sandboxing (`assertSafePath`, blocks `../../` escapes): implemented
  once, applied generically via each tool's `pathArgs` list. ✅ for
  `read_file`, `write_file`, `edit_file`.
  - ⚠️ **`list_files` never declares `pathArgs: ["path"]`**
    ([list-files.ts](src/tools/list-files.ts)) — it's the one tool that can
    still list a directory outside the project root. Small one-line fix,
    but it quietly breaks the "every tool gets this for free" promise the
    stage doc makes.
- Timeout + output-size cap on `bash`: done, 30s / 200KB, with sensible
  truncation messages. ✅

### 🟢 Stage 3 — Better tools
`edit-file.ts` (exact-match replace, rejects 0 or >1 occurrences) and
`grep.ts` (recursive directory search, skips `node_modules`/`.git`/etc.) both
exist and are registered in `registry.ts`. This is genuinely solid work.
One note for later: `grep` currently does plain substring `.includes()`
matching, not regex — fine for now, listed under "nice to have" below.

### 🟡 Stage 4 — Polish
- Slash commands `/exit`, `/clear`, `/help`: implemented, but living in
  `index.ts` rather than `cli.ts` as the stage doc suggested. Not wrong,
  just a different seam — worth a one-line mental note if an interviewer
  asks "where do slash commands live?"
- Tool names/results colored via `picocolors`: done (yellow for tool calls,
  blue for results).
- 🔴 **"Print the model's in-between text even on turns where it also calls a
  tool" — the code for this exists but is commented out**
  ([harness.ts:171-173](src/harness.ts#L171)). Right now, if the model
  narrates a thought before/between tool calls, you never see it — only the
  final answer prints. This is the one item on this stage that isn't
  actually active despite being written.

### 🟢 Stage 5 — Environment awareness
`buildSystemPrompt()` in [harness.ts](src/harness.ts#L71) dynamically injects
`process.cwd()`, OS (win32/darwin/linux → friendly name), and a top-level
directory listing on every turn. Matches the stage doc. (README-folding was
listed as optional and is skipped — fine.)

### 🟢 Stage 6 — Context management
This is further along than the stage doc even asks for. Real LLM-based
summarization: once `history.length > MAX_MESSAGES` (20), the oldest messages
get compressed into a running `summary` string via a dedicated summarization
prompt, the raw messages are dropped, and the summary is re-injected as a
pseudo-message on every subsequent call. That's the actual "context
management" goal from your own README, implemented, not just planned.

### 🔴 Stage 7 — Prove it, then tidy up
- Scratch files (`hello.ts`, `hello2.ts`, `broken.ts`) are already gone from
  the repo root. ✅ (nothing to do here)
- **No tests exist anywhere in the project.** `find`/`grep` turned up zero
  test files. This is the biggest remaining gap — see checklist below.
- **`src/types.ts`'s `Message` type doesn't match what actually flows through
  the code.** It's `{ role: "system"|"user"|"assistant", content: string }`,
  but `harness.ts` pushes raw OpenAI Responses API output items into
  `history`/`input` — `function_call`, `function_call_output`, items with
  `call_id`/`arguments`/`output`, etc. None of that shape is `Message`. In
  practice `history`/`input` are typed `any[]` specifically to route around
  this, which is the tell.
- **README doesn't match reality** (see cleanup list — I've rewritten it,
  see below).

---

## Fix before a demo (small, high-leverage)

1. **Verify the model id.** Swap `"gpt-5.4"` in `llm.ts` for a model id you've
   confirmed works against your API key. This is the single most likely
   thing to fail silently mid-interview.
2. **Uncomment the in-between-text print** in `harness.ts` (the block right
   after `generateResponse`) — it's the one bit of stage 4 that's written but
   inert.
3. **Add `pathArgs: ["path"]` to `list_files`** so directory sandboxing is
   actually universal, matching what the README/design already claims.
4. **Wrap the `runHarness()` call in `index.ts`'s loop in try/catch.**
   Right now an API error, a network blip, or hitting `MAX_ITERATIONS`
   throws out of `runHarness` uncaught — since nothing in `main()` catches
   it, the *entire CLI process dies* on a single bad turn, taking your whole
   conversation history with it. This is the difference between "the
   assistant had a hiccup" and "the demo crashed." Catch it, print the error,
   and let the `while (true)` loop continue.

## Cleanup (stage 7, matches what the doc already asked for)

- `src/conversation/conversation.ts` — the `Conversation` class is never
  imported anywhere. Either delete it, or actually switch `harness.ts` to use
  it instead of the raw array (pick one, the doc offered both as valid).
- `import { Content } from "openai/resources/skills.mjs"` in `harness.ts` —
  unused, and the import path itself looks like a stray autocomplete, not an
  intentional import. Safe to delete.
- `commander` in `package.json` dependencies — never imported; `cli.ts` uses
  `inquirer` exclusively. Either remove the dependency or note why it's kept.
- Both `bun.lock` and `package-lock.json` are committed — two package
  managers tracking the same tree will drift. Pick one (README says Bun) and
  delete the other lockfile.
- Fix `types.ts`'s `Message` type to match what's actually flowing (see
  stage 7 above), and stop typing `history`/`input` as `any[]` once it does.

## Test checklist (the actual stage-7 ask, still open)

- One test per tool, filesystem mocked:
  - `read_file` reads existing file, errors cleanly on missing file.
  - `write_file` creates/overwrites, respects sandbox.
  - `list_files` lists a dir, respects sandbox (once the bug above is fixed).
  - `edit_file` replaces a unique match; rejects 0 matches and >1 matches.
  - `grep` finds matches, returns "no matches" cleanly, skips ignored dirs.
  - `bash` — mock `exec`, assert timeout and output-cap paths are hit.
- `tool-executor.ts`: one test confirming `assertSafePath` actually rejects
  a `../../etc/passwd`-style escape (this is the security-critical path —
  worth a dedicated test even before the others).
- One loop test in `harness.ts` using a fake LLM client: canned tool call
  response → canned final-answer response → assert the tool ran, the result
  was fed back, and the final text is returned.

---

## Where to take it after stage 7 (not asked for yet, but the natural next arc)

Roughly in order of interview-impressiveness per unit of effort:

1. **Streaming output.** Right now you wait for the full response before
   printing anything. Switching to the Responses API's streaming mode so
   tokens print as they arrive is the single most visible "this feels like a
   real coding agent" upgrade you can make, and it composes cleanly with the
   tool loop you already have.
2. **Persist conversation across restarts.** `history`/`summary` currently
   live only in process memory — closing the CLI loses everything. Writing
   them to a `.harness/session.json` on each turn (and loading on boot) is a
   small change with an outsized "it remembers me" effect.
3. **Provider abstraction.** `llm.ts` hardcodes the OpenAI client and the
   Responses API shape. A small `LLMClient` interface (`generate(input,
   system): Promise<...>`) would let you swap in Anthropic or a fake client
   for tests without touching `harness.ts` — this is also what unlocks clean
   loop tests (checklist above) and de-risks "gpt-5.4 doesn't exist" style
   bugs permanently, since you could target multiple providers.
4. **Token-aware context trimming.** Stage 6 trims on message *count*
   (`MAX_MESSAGES = 20`). Fine for a demo; a real harness trims on token
   count (via the API's `usage` field or a local tokenizer), since 20 short
   messages and 20 huge ones are very different budgets.
5. **`grep` regex support.** Currently substring-only (`.includes()`). Real
   value add: accept a regex pattern, `-i` case-insensitive, and a
   glob filter so it's not just "read every file in the tree."
6. **Windows process-tree kill for `bash` timeouts.** `execAsync`'s timeout
   kills the immediate child; on Windows, `cmd.exe`-spawned grandchildren can
   survive that kill. Worth a `taskkill /T /F` fallback if you ever demo a
   genuinely runaway command.
7. **Retry/backoff around `generateResponse`.** One transient 429/5xx
   currently surfaces as a raw thrown error (see the try/catch fix above).
   Once that's caught, the next step is a couple of retries with backoff
   before giving up.

None of these block you from presenting the project today — they're the
honest "if I kept going" list, useful if an interviewer asks "what would you
do next."
