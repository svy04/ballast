---
name: checkpoint
description: Maintain a thirty-second return point (CHECKPOINT.md) and a single-use handoff (HANDOFF.md) so any session can resume mid-goal without archaeology. Use when a large unit of work finishes, a session enters its closing stretch, when leaving instructions for the next session, or when resuming and the user asks where things stand.
---

# Checkpoint — return in thirty seconds

A session ends; the work doesn't. Whoever returns — the user after a week, or a fresh session after a context reset — faces scrollback that no longer exists and a directory that doesn't explain itself. Reconstruction eats the first twenty minutes and gets details wrong. This skill keeps one file that makes return instant, and a second file that carries orders across the gap without letting them go stale.

## CHECKPOINT.md — the return point

Update `memory/CHECKPOINT.md` whenever a large unit of work completes or the session is winding down. Five sections, always in this order:

```markdown
# Checkpoint — <goal> — <YYYY-MM-DD HH:MM>

## The story so far
<Thirty seconds of reading, no more. What this work is and where it
stands, told to someone with zero context.>

## Decided
<Decisions confirmed since the last checkpoint — one line each, with
ledger ids where they exist.>

## Waiting on the user
<Decisions only the user can make, and the readings in force from
OPEN-QUESTIONS that are due a question — one line each, so they get asked
here, at the break, not mid-flow. Empty is a valid and welcome state.>

## Next first action
<ONE line, executable immediately without reading anything else.>

## Tried
<Approaches attempted that did not work, one line each with why.>
```

Rules:

- **Next first action is the load-bearing line.** A cold session must be able to execute it before reading a single other file: concrete verb, concrete object, no prerequisite. "Continue the analysis" fails this test; "run the export script against the staging list and diff the counts" passes.
- **Tried is a map of dead ends.** An approach that failed and went unrecorded will be attempted again, in good faith, by a session that has no way to know better. One line per dead end — what was tried, why it didn't work.
- **Archive on every update.** Before overwriting, copy the outgoing version to `memory/checkpoints/{YYYYMMDD-HHMM}-<short-title>.md`. That directory is append-only and sorts itself by filename — the full trail of how the work moved, at zero extra cost.
- **Index each file the first time it appears.** When this skill first creates `memory/CHECKPOINT.md`, `memory/checkpoints/`, or `memory/HANDOFF.md`, add a row for it to the File map in `memory/00-INDEX.md` — a file missing from the map is a file the next session never opens.

## HANDOFF.md — single-use, then destroyed

Concrete instructions aimed at the next session — "start with X, skip Y, the open question about Z is resolved" — go to `memory/HANDOFF.md`, not the checkpoint. The two files differ in lifespan, and the difference is the point:

- `CHECKPOINT.md` describes **state**. It is always current and always present.
- `HANDOFF.md` carries **orders**. It is read exactly once: the session that reads it acts on it and **deletes it immediately**. A handoff that outlives its reading turns into an old instruction wearing the authority of a current one — the delete is what keeps the file trustworthy.

## Returning

On resume — new session, context reset, or the user asking where things stand:

1. If `memory/HANDOFF.md` exists, read it, absorb the orders, delete it.
2. Read `memory/CHECKPOINT.md` and brief the user in thirty seconds: the story, what's decided, what they owe a decision on, the next first action.
3. Scan for unfinished signals: work whose start is recorded (session log, open questions) but whose conclusion is nowhere. Surface each one — never let it dissolve silently. Include the readings in force: one relied on again since the last checkpoint is due its question in this briefing.

Then execute the next first action, unless the user redirects.
