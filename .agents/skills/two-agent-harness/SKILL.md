---
name: two-agent-harness
description: "Implement the active BRIEF.md request and independently verify it with exactly two Codex agents: one main implementing agent and one read-only reviewing subagent. Use for behavior-changing feature development spanning client, server, shared contracts, scenarios, tests, or integrated visual assets when the repository requires a two-agent delivery loop or the user invokes $two-agent-harness."
---

# Two-Agent Feature Harness

Deliver one coherent feature with a sequential implement-review-fix-verify loop. Keep the total agent count at two: the current main agent and exactly one reviewer subagent.

## 1. Establish the contract

Read `BRIEF.md` first, followed by the applicable `AGENTS.md`, feature code, and tests. Treat the active `Developer Request` and `Developer Decisions` as the task contract. Do not modify developer-owned sections. Summarize the contract in `Agent Understanding` before editing:

- goal and user-visible outcome;
- included and excluded scope;
- client/server request and response boundaries, when applicable;
- acceptance criteria, including failure and boundary behavior;
- required verification commands.

Ask the user only when a missing choice would materially change behavior or data. Otherwise make a scoped assumption and record it.

If `BRIEF.md` is not in `READY` or `IN_PROGRESS`, lacks a usable goal or completion criteria, or conflicts with the prompt, stop and ask the developer to update or reconcile it. Record material questions in `Agent Questions` and set the status to `NEEDS_INPUT`. The main agent may update status and agent-owned sections only.

## 2. Inspect the baseline

Inspect `git status` and preserve unrelated changes. Read the narrowest relevant code. Run a focused baseline check when it helps distinguish existing failures from new ones.

Do not spawn the reviewer during exploration or implementation. The reviewer needs a stable diff.

## 3. Implement vertically

Implement the smallest end-to-end slice that satisfies the contract. Keep feature-specific client, server, types, test data, scenarios, and tests under `src/features/<feature-name>/` until sharing is demonstrated.

Include tests for:

- the primary success path;
- expected rejection or failure paths;
- material boundary conditions;
- client/server contract compatibility when both sides change.

Avoid unrelated refactors and speculative common abstractions.

## 4. Verify before review

Run the commands required by the nearest `AGENTS.md`. At minimum for this repository run:

```bash
npm run typecheck
npm run test
npm run build
git diff --check
```

Fix failures introduced by the change. Record any pre-existing failure with evidence rather than masking it.

## 5. Delegate one independent review

Spawn exactly one subagent after the implementation and initial checks are complete. Give it a concrete, bounded, read-only review task. Require it to read the active contract directly from `BRIEF.md`, then pass only the changed scope, relevant paths, and verification commands. Do not pass a suspected answer or ask it to confirm the main agent's conclusions.

Use this reviewer brief, adapted to the feature:

```text
Act as the independent reviewer for this feature. Do not edit files.

Contract:
Read the active Developer Request and Developer Decisions in BRIEF.md.

Review the current working-tree diff and relevant surrounding code for:
1. unmet acceptance criteria;
2. functional bugs and regressions;
3. client/server contract mismatches;
4. missing failure or boundary handling;
5. tests that cannot catch the likely failure;
6. security or data-integrity risks.

Run focused read-only checks when useful. Report findings in severity order with file locations, evidence, impact, and a minimal remediation. Ignore style preferences and unrelated refactors. If there are no findings, list what you verified and any residual unverified risk.
```

Wait for this reviewer before changing the reviewed files. Do not create another reviewer, exploration agent, or test agent.

### Asset review mode

When the change creates, edits, or integrates raster assets, keep the same single reviewer and add the checks below to its brief. Do not spawn a separate asset reviewer.

Inspect the source asset independently from its in-product rendering:

- verify file format, pixel dimensions, color mode, alpha transparency, frame or tile layout, and unexpected padding or edge artifacts;
- compare directional frames, poses, scale, baseline, silhouette, palette, lighting, and character identity for consistency;
- compare the asset with the active story, concept references, `DESIGN.md`, and explicit visual constraints without relying on recognizable third-party character identifiers;
- verify the import path, build inclusion, loading fallback, frame selection, crop coordinates, smoothing mode, source size, destination size, and exact scale ratio;
- prefer native or integer scaling for pixel art. Treat a larger source as a master asset, not proof that a smaller runtime rendering will remain sharp;
- read the actual per-frame alpha bounds and derive the rendered visible bounds from the scale and destination anchor. Do not use the full transparent frame rectangle as the character silhouette;
- verify the visible feet baseline after transparent bottom padding and scaling, not only the destination rectangle. Align it with the intended collision or interaction baseline;
- use the maximum rendered top, bottom, left, and right extent across every directional frame when multiple directions share movement bounds;
- compare the derived visible silhouette with collision boxes, map tiles, doors, furniture, and all map or viewport boundaries;
- exercise representative directions, idle state, extreme coordinates, and every scene that renders the asset;
- when a background or character scale changes, recompute each scene's usable floor and movement bounds independently. Verify every spawn is valid and every exit, collectible, device, and interaction point remains reachable after applying the movement clamp;
- add regression coverage for the actual raster metadata or alpha bounds, source and destination draw geometry, visual anchor, four-side extrema, scene-specific bounds, and in-bounds reachability of every required interaction;
- inspect the running product with the browser or applicable visual tool and capture evidence when available. Do not treat source-image inspection alone as proof of correct integration;
- if runtime visual inspection is unavailable, report it explicitly as residual unverified risk and do not claim full visual verification.

Require concrete evidence such as source and alpha dimensions, scale equations, anchor coordinates, boundary extrema, reachable interaction coordinates, screenshots, rendered states, or focused test results. A subjective statement that the asset merely “looks correct” is insufficient.

## 6. Triage and fix

Evaluate findings against the contract and repository evidence. Address valid correctness, regression, security, data-integrity, and essential-test findings. Do not automatically accept stylistic or out-of-scope suggestions.

Have the main agent make all fixes. Re-run the relevant checks.

## 7. Reuse the same reviewer

Send a follow-up task to the same reviewer. Ask it to verify that its findings are resolved and that the fixes introduced no new regression. Keep this pass read-only.

If the reviewer identifies a new valid blocking issue, repeat the main-agent fix and same-reviewer verification loop. Do not spawn a replacement reviewer merely to obtain a different verdict.

## 8. Finish transparently

Return control to the developer with:

- the delivered behavior;
- the verification commands and results;
- reviewer findings that were fixed or intentionally rejected, with reasons;
- residual risks, manual checks, or unavailable verification.

Write the same concise summary to the agent-owned `Agent Result` section and set the status to `READY_FOR_DEVELOPER_CHECK`. Do not mark the task `ACCEPTED`; only the developer may do that after checking the diff and actual behavior.

Do not claim independent verification if subagents are unavailable. In that case, perform the normal checks, clearly report the degraded single-agent path, and recommend a separate Codex `/review` before merge.
