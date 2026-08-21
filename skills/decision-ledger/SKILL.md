---
name: decision-ledger
description: Maintain an append-only decision ledger (DECISIONS.md). Use when the user confirms a decision, reverses or changes a past decision, asks what was decided and why, or at session start to load standing decisions.
---

# Decision ledger

One file holds every confirmed decision: `memory/DECISIONS.md` (run brain-init if it doesn't exist yet). The ledger is **append-only** — nothing is ever edited or deleted. Changed minds are recorded as new entries that supersede old ones.

## Entry format

```markdown
## D-021 · <short title> — <YYYY-MM-DD> (<source: who confirmed, in what context>)

<What was decided, in the decider's own terms. Include the reason if one was given.>
```

## Rules

1. **Append-only.** Never rewrite, reorder, or remove an existing entry. The ledger is trustworthy precisely because it cannot be quietly rewritten.
2. **User-confirmed only.** Record what the user actually decided, not what you proposed. If your proposal was adopted, say so: `(AI-proposed, user-confirmed)`. Never promote your own suggestion to a decision — and never promote your reading of a non-answer (see *Provisional readings* below).
3. **Supersede, don't edit.** When a decision changes: write a new entry stating what changed and `supersedes D-xxx`, then add exactly one line to the old entry: `→ superseded by D-yyy (YYYY-MM-DD)`. That backlink is the only permitted touch to an old entry.
4. **Record in-session.** The moment a decision is confirmed, write it — not at the end of the conversation. Topic changes destroy unwritten decisions.
5. **Sequential ids.** `D-001, D-002, …` Never reuse a number, even after supersede.
6. **Surface conflicts.** If a new decision contradicts a standing entry and the user hasn't acknowledged that, point it out *before* recording — then record whichever the user confirms, with the supersede link.
7. **A supersede ends with a sweep.** The old decision's wording usually lives in more places than the ledger — docs, copy, configs, skill files. Search the project for it, fix each surface or register the stragglers in `memory/OPEN-QUESTIONS.md`, then add one sweep line to the new entry: `sweep: <what was fixed> (YYYY-MM-DD)`, appending `→ Q-xx` for anything left open. Like the supersede backlink, that one line is a permitted touch to an already-written entry — until it's there, the dead decision keeps working: the ledger says B while the README still says A.

## Provisional readings — what is not a decision

The user goes quiet, changes the subject, or answers with a token that could mean anything — "ok", "sure", "fine, whatever works" — and the work has to go somewhere. The failure mode this prevents: your reading of that moment getting written down as *their* decision, then being relied on for days.

- **Silence and short tokens are not confirmations for one-way doors.** Anything hard to reverse, anything that leaves the repo (publishing, sending, spending, deleting), and anything that would become a standing rule waits for words that actually say yes. Two-way-door work — cheap to undo, internal — may read a repeated go-ahead inside an established pattern as delegation. Read the context, not the token: the same "ok" is an acknowledgement in one place and a go-ahead in another, and no form classifies itself. (Most calls are two-way doors; treating them all as one-way is how work stalls.)
- **Quote them, label yourself.** When you proceed on a reading the user did not confirm, it goes in `memory/OPEN-QUESTIONS.md` under *Readings in force* — never here: the user's words verbatim, your reading marked `assumed`, what breaks if the reading is wrong, what ends it (their confirmation, a date, or the next time the subject comes up), and where it is being relied on. A reading never gets a `D-` number.
- **Proceed only through two-way doors while it is provisional.** One-way doors wait. When you cannot tell which door it is, treat it as one-way.
- **Ask at the break, once, bundled.** Do not re-ask on every message and do not stop the work to ask — over-asking is its own failure, and the user is usually mid-flow. The open readings go to the checkpoint's *Waiting on the user*; ask when the thread pauses. A reading relied on a second time since the last checkpoint is due its question now.
- **Three exits.** The user confirms → a real entry here, with their words quoted. The user contradicts → drop the reading and sweep whatever was built on it. The condition expires or the subject returns → ask, then one of the first two.

A wrong entry and a pile of unconfirmed readings are both failures, and ballast does not rank them; it keeps them apart. Readings live in open questions, where they stay visible; the ledger holds only what was said.

## Reading the ledger

At session start (or when context resets), read the ledger before substantive work. Standing decisions are followed **without relitigating** — if you believe a decision is wrong, say so once, with reasons, and let the user decide whether to supersede it.

## Why this works

An LLM session forgets; a file does not. But a file that can be silently edited is worse than no file — it *feels* authoritative while drifting. Append-only + supersede gives you both: current truth at a glance, and the full history of how you got there.
