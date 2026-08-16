---
name: proof-standard
description: Never make an external-facing claim about a product without evidence from a truth file. Use when writing marketing copy, announcements, docs, landing pages, investor material, or answering "can our product do X".
---

# Proof standard

External claims about a product come from **evidence**, not from memory, enthusiasm, or the roadmap. The failure mode this prevents: shipping confident copy about features that don't exist.

## The truth file

`memory/PRODUCT-TRUTH.md` (run brain-init to create it) has three sections:

1. **Implemented** — with evidence (code path, test, screenshot) and a date
2. **Not implemented** — explicitly listed, so absence is a fact rather than a gap
3. **Permanently excluded** — decided against; copy must never imply it

Claims may be sourced **only from Implemented**.

One truth file per subject you make claims about, split by **what kind of evidence is available** — code you can read versus someone else's system or word. Name the evidence class at the top of each file, and never let two classes share a section: a line you can settle by opening a path and a line that rests on a vendor's statement do not carry the same weight, and a shared section hides which one you are holding.

## Four code states — never blended

| State | Meaning |
|---|---|
| `implemented` | The code exists |
| `wired` | Connected end-to-end (UI → backend → effect) |
| `operational` | Running in production with real data |
| `verified` | Tested, with evidence you can point to |

Copy that says "we do X" requires `operational` or better. "X is available" requires at least `wired`. Everything else is roadmap language — clearly future-tense, clearly conditional. Mixing these states in one sentence is how honest teams end up lying.

## Rules

1. **Truth file first.** Before any capability claim, open the truth file. No entry → no claim; register an open question instead of guessing.
2. **Evidence and dates on every entry.** "It works" is not an entry. "Import wired end-to-end, e2e test passing, 2026-08-01, `tests/import.spec.ts`" is.
3. **Product changes → truth file first, copy second.** Never the reverse order.
4. **Internal is external.** The deck you show an investor, the answer you give a partner — same standard. There is no audience for unproven claims.
5. **Absence claims too.** "We never store X" is a capability claim about the negative — it also needs a truth-file entry with evidence.

## Freshness

Every entry carries the date it was last checked against the code, not only the date it was written. Before an entry older than 90 days is used in a claim, re-confirm it — open the path, run the test, look at the screen — and stamp the new date. A date says when the entry was true, not that it still is.

**"Not implemented" is the section that leaks the other way.** A stale Implemented entry pushes you toward claiming too much, and everyone watches that direction. A stale "Not implemented" line does the reverse: the capability shipped weeks ago, the line never moved, and the truth file is now talking you out of a claim you have already earned — understating instead of overstating. Sweep that section on the same 90-day clock, and check it again every time something ships.
