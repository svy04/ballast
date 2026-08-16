# Using ballast with Codex

ballast takes a goal in a field you have no expertise in and builds up to it: it splits the goal into the foundations it actually needs, mobilizes the ones you already hold, learns the ones you are missing, and leaves every path it solves behind — as a rule, a verified note, or a skill the next goal starts from. Nothing is called done until a check passes.

It is packaged as a Claude Code plugin, but twelve of its thirteen pieces are plain markdown conventions — files any capable agent can read. This guide wires them into Codex CLI.

**What carries over:** all twelve skills (`SKILL.md` is plain markdown — Codex is simply told to read it), the `memory/` conventions, and the config files. One rule catalog can serve both tools on the same project.

**What does not:** the rules hook. It is a Claude Code `UserPromptSubmit` hook with no Codex equivalent — so on Codex, rule delivery is a convention too. Nothing is code-enforced on Codex.

## Setup

1. Clone this repo somewhere stable:

```
git clone https://github.com/svy04/ballast
```

2. Append this block to your project's `AGENTS.md`, replacing `<BALLAST>` with the clone path. (AGENTS.md gets committed — if your clone path is personal, put the block in `~/.codex/AGENTS.md` instead; Codex reads both.)

```markdown
## ballast conventions

Skills live at <BALLAST>/skills/ — one folder per skill, SKILL.md inside.
Before matching work, read the relevant SKILL.md and follow it exactly:
goal (big or unfamiliar goals) · verify-gate (claims, labels) · knowledge-base
(research reuse) · decision-ledger (decisions) · proof-standard (external claims)
· rehearsal (before shipping a deliverable) · researcher (delegated collection)
· checkpoint (pause and return) · pin (corrections become rules) · brain-init
(memory setup) · skill-forge (repeated procedures). Folder names match these
skill names.

Standing rules: at the start of every task, read .claude/ballast.rules.json
(project) and ~/.claude/ballast.rules.json (user) if present. Honor every rule
whose keywords or patterns match the task. Treat action:"block" rules as a
refusal, quoting the rule as the reason. This delivery is a convention —
nothing enforces it here.
```

3. Seed the rule catalog. It is not in the clone's `.claude/` — you create it: copy `<BALLAST>/rules/ballast.rules.example.json` to `<project>/.claude/ballast.rules.json` and prune it. The rule format (keywords, patterns, `action: "block"`) is documented in the README under [Write the catalog by hand](../README.md#write-the-catalog-by-hand).

4. Optional: the second-model configs (`.claude/ballast.verifier.json`, `.claude/ballast.researcher.json`) are read by the verify-gate and researcher skills, not by any hook — the one-line file format is in the README's [Know the limits](../README.md#know-the-limits). `memory/` appears in your project root once you run brain-init (wrapper below).

## Invoking skills directly

Codex custom prompts give you slash-style invocation. Create `~/.codex/prompts/ballast-goal.md`:

```markdown
---
description: Run a goal through the full ballast pipeline
---

Read <BALLAST>/skills/goal/SKILL.md and follow it exactly.

Task: $ARGUMENTS
```

One wrapper file per skill you call often — `ballast-brain-init.md`, `ballast-pin.md`, same pattern.

## Know the limits

- **No enforcement.** On Claude Code the hook delivers matching rules whether the model cooperates or not; on Codex the AGENTS.md block asks, and Codex complies as well as it follows any instruction. Blocks are a stated refusal, not a stopped prompt.
- **The hook's mechanics don't exist here.** No substring matching, no 12-rule / ~6,000-char cap, no `BALLAST_DISABLE` / `BALLAST_DEBUG`: matching is the model's judgment, and the whole catalog gets read each task — keep it lean.
- **Delivery timing differs.** The hook injects per message; AGENTS.md is read per session. A long Codex session can drift from the catalog like any instruction file — re-point it at the block when it does.
- **The evidence is `observed`, not a harness.** 2026-08-16, Codex CLI 0.130, `codex exec`, one session each: given the block above plus the example catalog, Codex presented an estimate and asked approval before a spending task, and read and followed the rehearsal and verify-gate skills unprompted — labels included. Both sessions ran with a non-default model and service-tier override, not the CLI's stock config — instruction-following varies by model. Two sessions is an observation, not a rate. The runnable 6-case harness exists only for the Claude Code hook.
