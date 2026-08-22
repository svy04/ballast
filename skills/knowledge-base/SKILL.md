---
name: knowledge-base
description: Keep verified findings in memory/knowledge/ so the same research is never done twice. Use before researching any topic, when a finding passes the verify gate, or when about to answer from something learned in an earlier session.
---

# Knowledge base

A session that researches well and forgets is a session that will research again. This skill adds the layer that makes learning cumulative: verified findings land in `memory/knowledge/<topic>.md`, and every new question checks there first.

## Lookup before research — always

Before investigating any topic, read `memory/knowledge/` for an entry that answers it. If a current entry exists, use it and cite it — re-researching a settled question wastes the work that settled it. If the entry is stale or only partially covers the question, research the gap, not the whole topic.

## Drafts stay drafts

Findings made mid-task (a benchmark result, a library's actual behavior, an API's undocumented limit) are drafts. Label each with the verify-gate labels — `confirmed` / `observed` / `assumed` / `hearsay` / `unknown` — wherever the draft lives: session log, working notes, a comment in the task file. Drafts may inform the current task but must not be quoted later as established knowledge.

## Promotion — the gate is the door

Only claims that pass the verify gate enter `memory/knowledge/`. One file per topic, entries shaped like:

```markdown
## Connection pool exhausts under burst load — verified 2026-08-14

- Claim: the default pool (10) exhausts at ~40 concurrent requests; queue wait exceeds 2s.
- Sources: load test output (tests/load/pool.txt), library docs on pool sizing (both opened).
- Sample: 3 runs, same config. Limits: measured on the staging tier only; production tier untested.
```

Every entry carries: the claim, named primary sources, sample size, stated limits, and a verification date. An entry missing any of these is still a draft, whatever file it sits in.

The first time you create `memory/knowledge/`, add a row for it to the File map in `memory/00-INDEX.md` before writing the first entry — a folder missing from the map is a folder the next session never opens.

**Check what the finding contradicts before filing it.** Read the existing entries this finding touches. If it contradicts one, do not shelve the two beside each other: surface the conflict first, then either supersede the old entry — with a link back to it from the new one — or hold the new entry and register the question in `OPEN-QUESTIONS.md`. If the two rest on different layers of evidence (different scope, subject, or measurement), placing them side by side is as far as it goes; they do not get merged into one claim.

## Close the loop on processed drafts

When a draft is promoted (or rejected), annotate it in place: `→ recorded in memory/knowledge/db-pooling.md (2026-08-14)` or `→ rejected: failed refutation`. Without the back-note, the same finding resurfaces as a candidate in the next session and gets re-verified from scratch — the exact duplication this skill exists to end.

## Compression tools stay out

A knowledge entry is its source, its sample, and its label; a compression pass aimed at token savings removes exactly those first. Do not run memory-file compressors (caveman-compress and the like) over `memory/knowledge/`. Shorten by hand if you must, with the original kept and a part-by-part comparison before accepting.

## Freshness

Verified knowledge expires. Before relying on an entry older than 90 days, re-verify it and update the date; if it no longer holds, supersede the entry with what is now true rather than deleting the history. The date on an entry is a promise about when it was true, not forever.

The correction runs downstream too: when an entry changes, update the skills that cite it in the same pass. A forged procedure resting on the old entry keeps the old entry in service, corrected copy or not.

## Scope

This is a convention skill — plain markdown files, no tooling required. If the project already runs a wiki or knowledge-management plugin, the two coexist: `memory/knowledge/` remains the lookup-first layer, and the wiki can serve as the deeper archive behind it.
