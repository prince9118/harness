# Remaining — before this goes on a resume

Written 2026-08-18, after a bug-fix pass on the code (see git log / diff for
what changed: model id, in-between-text print, `list_files` sandboxing,
`index.ts` crash-on-error, `Message` type, `tool-executor.ts` using the
unresolved path). The architecture itself is in good shape — this list is
what's left before the *repo* is something you'd hand an interviewer.

Ordered by how much it would hurt if someone actually opened the code.

---

## 1. Fix `FUTURE.md` — it now contradicts the code (do this first)

`FUTURE.md` still describes several bugs as open that are already fixed:

- The `"gpt-5.4"` model id concern (now `"gpt-5"`).
- `list_files` missing `pathArgs` (now has it).
- The commented-out in-between-text print (now active, and only fires on
  turns that also call a tool, so the final answer doesn't print twice).
- `index.ts` letting an uncaught error kill the whole process (now wrapped
  in try/catch).
- `types.ts`'s `Message` type not matching what flows through the code (now
  typed as the OpenAI SDK's own `ResponseInputItem`, threaded through
  `harness.ts` / `index.ts` / `llm.ts` instead of `any[]`).

A "known bugs" doc that's stale is worse than not having one — it tells a
reader you don't revisit your own notes. Either:
- Rewrite `FUTURE.md`'s stage 1/2/4/7 sections to say what's actually true
  now (recommended — keep the honest-retro format, it's good), or
- Delete the parts that no longer apply and fold what's left into this file.

## 2. Add tests — the single most likely thing to come up in an interview

Still genuinely zero tests in the project. You don't need heavy coverage,
just enough to show you tested the parts that matter:

- **`assertSafePath` rejects a `../../etc/passwd`-style escape.** Do this
  one first — it's the security-critical path, and the natural first
  question if you claim "sandboxed" in your resume bullet.
- One test per tool (mock the filesystem):
  - `read_file` — reads an existing file, errors cleanly on a missing one.
  - `write_file` — creates/overwrites, respects the sandbox.
  - `list_files` — lists a dir, respects the sandbox.
  - `edit_file` — replaces a unique match; rejects 0 matches and >1 matches.
  - `grep` — finds matches, returns "no matches" cleanly, skips ignored dirs.
  - `bash` — mock `exec`, assert the timeout and output-cap paths are hit.
- One loop test in `harness.ts` with a fake LLM client: canned tool-call
  response → canned final-answer response → assert the tool ran, the result
  was fed back in, and the final text is what's returned.

Pick a runner (`bun test` needs nothing extra installed — it's built in).

## 3. Small cleanup (cheap, but visible on a skim)

- `src/conversation/conversation.ts` — the `Conversation` class is never
  imported anywhere. Delete it, or actually wire `harness.ts` to use it
  instead of the raw array. Right now it's just dead code sitting in the repo.
- `commander` in `package.json` `dependencies` — never imported; `cli.ts`
  uses `inquirer` exclusively. Remove it or you'll get asked "what's this
  for?"
- Both `bun.lock` and `package-lock.json` are committed. Pick one (README
  says Bun) and delete the other — two lockfiles tracking the same tree
  will drift and it reads as "didn't clean up before pushing."
- Typos worth a pass: `list-files.ts`'s description ("discription" instead
  of "description", double space), `edit-file.ts`'s `newText` description
  ("replae" instead of "replace").

## 4. Optional, only if you have time — makes the demo itself stronger

- Do one real end-to-end run (`bun run dev`) before showing it live —
  everything here passed `tsc --noEmit`, but it hasn't been smoke-tested
  against a live OpenAI call since the last round of edits.
- Pick 1–2 items from `FUTURE.md`'s "where to take it after stage 7" list
  (streaming output and provider abstraction are the two with the best
  effort-to-impressiveness ratio) if you want a "and here's what I'd do
  next" answer that isn't just "write tests."

---

**Bottom line:** items 1 and 2 are the actual gap between "solid side
project" and "resume-ready." Everything else is polish.
