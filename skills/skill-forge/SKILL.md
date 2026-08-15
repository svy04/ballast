---
name: skill-forge
description: Promote a procedure that was worked out end-to-end and verified into a reusable skill file, so the next similar task starts from the solved path. Use when a hard-won procedure succeeds with evidence, when the same multi-step task appears a second time, or when the user says "make this repeatable".
---

# Skill forge

Some tasks are solved once and then re-solved forever: the deploy that took an afternoon of trial and error, the migration that only worked in one specific order, the flaky test that needed three environment tweaks. The solving was real work; letting it evaporate means paying for it again. When a procedure has been driven from start to finish and the success was **checked, not declared**, forge it into `.claude/skills/<name>/SKILL.md` — the next similar task starts where this one ended.

## When to forge

Both conditions, not either:

1. **It will recur.** The task shape is likely to come back — same project or same class of problem. One-off procedures stay in the session log.
2. **Success was verified.** A check passed: the build is green, the endpoint responds, the output was inspected. "It seemed to work" forges nothing — a skill built on an unverified run teaches the next session a guess.

## What goes in the file

The skill file records the procedure **as it actually ran**, not as it should have run in theory:

- **When to use** — the task shape that triggers it, specific enough that the wrong task won't match.
- **Procedure** — the steps in the order that worked, including the traps hit along the way (`step 3 fails silently if the cache wasn't cleared first` is the most valuable line in the file).
- **Verified** — the date the procedure last succeeded.
- **Evidence** — what confirmed success: the test that passed, the file that existed, the output that was checked. This line is what separates a skill from a hopeful note.

Frontmatter follows the usual shape: `name` matching the directory, `description` saying what it does and when to use it.

## Relation to pin

pin promotes a **one-line rule** — a correction or preference that should arrive with matching messages. skill-forge promotes an **entire procedure** — multiple steps, ordering, traps. When a lesson fits in a sentence, pin it; when it only fits in a walkthrough, forge it. A forged skill often yields one pin as a by-product: the single sharpest trap, delivered even when the skill isn't opened.

## Freshness

A procedure is a claim that these steps still work. Two triggers force a refresh: the verification date is more than 90 days old, or the procedure fails when followed. Either way, re-run it, fix what changed, and update the date and evidence — a skill that silently stopped working is worse than no skill, because it carries the authority of a past success.
