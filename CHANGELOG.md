# Changelog

## 0.2.0 — 2026-08-14

Repositioned: ballast is a goal engine that doesn't trust itself — not just a discipline layer.

- new skill `goal`: the full pipeline for big/unfamiliar goals — terrain scan (questions before answers), full skeleton, atomic leaves verified before load-bearing, re-check loop, done-means-verified
- new skill `pin`: turn a correction just made into a permanent rule catalog entry in one step
- README (EN/KO) rewritten around the goal-engine positioning; rules hook keeps the "tell Claude once" role
- no engine changes: hooks and existing skills untouched

## 0.1.0 — 2026-08-13

Initial release.

- rules hook (UserPromptSubmit): catalog-matched rule-body injection, block rules, user+project catalog merge, fail-silent design
- skills: decision-ledger, verify-gate, proof-standard, brain-init (+ memory templates)
- example rule catalog
- publish hygiene checklist and .gitignore baseline
- docs in English and Korean
