# ZZUGGURU Codex Instructions

## Project layout

- Put user-facing features in `src/features/<feature-name>/`.
- Keep a feature's client, server, shared types, test data, scenarios, and tests together.
- Put browser and server infrastructure shared by multiple features in `src/platform/`.
- Move code to `src/shared/` only after multiple features actually share it.
- Do not create empty placeholder directories. Add a top-level `tests/` directory only when a real cross-feature test exists.

## Commands

Run these checks before declaring an implementation complete:

```bash
npm run typecheck
npm run test
npm run build
git diff --check
```

Do not delete, skip, or weaken a failing test merely to make a check pass. Report pre-existing failures separately from failures caused by the current change.

## Feature delivery workflow

For a behavior-changing feature that includes implementation, use the repository skill `$two-agent-harness` in `.agents/skills/two-agent-harness/SKILL.md`.

- Read `BRIEF.md` before implementation and use its active `Developer Request` as the task contract.
- Never edit or delete `Developer Request`, `Developer Decisions`, or `Developer Final Check` unless the user explicitly asks.
- Write only in the agent-owned `Agent Understanding`, `Agent Questions`, and `Agent Result` sections.
- If the prompt and `BRIEF.md` conflict or recency is unclear, ask the user to reconcile them before implementation.
- Keep the total agent count at two: the main implementing agent and one reviewing subagent.
- Implement first, then delegate a read-only independent review. Do not run concurrent writes.
- Have the main agent address valid findings and ask the same reviewer to verify the fixes.
- Do not use this workflow for explanations, status reports, trivial documentation-only edits, or read-only investigations unless the user explicitly requests it.

## Scope and safety

- Preserve unrelated user changes in a dirty worktree.
- Keep each change focused on one coherent feature outcome.
- Avoid speculative shared abstractions and unrelated refactors.
- Treat authentication, authorization, input validation, API error formats, and data integrity as shared safety constraints rather than deferred cleanup.
- Never commit secrets or real credentials. Use placeholders in documentation and tests.

## Visual changes

- Read and follow `DESIGN.md` before adding or changing visible UI.
- Treat the YAML design tokens in `DESIGN.md` as the source of truth.
- Do not introduce a new visual token or component variant without updating `DESIGN.md`.
- Run `npm run design:lint` after changing `DESIGN.md`.

## User validation

- Ask the user for one additional validation before implementing a decision that is difficult to understand, materially ambiguous, visually subjective, or likely to change the product direction.
- Present the uncertain point, the recommended interpretation, and the practical alternative concisely.
- Do not use this rule to block routine, reversible implementation details that follow existing project conventions.

## Completion report

State the implemented outcome, checks run and their results, reviewer findings addressed, and any residual risk or unverified behavior.
