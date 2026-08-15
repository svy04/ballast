# Changelog

## 0.5.0 — 2026-08-16

Two layers the distillation was missing: deliverables get checked before they ship, and research collection can be delegated without delegating judgment. No new code — the rules hook remains the only code-enforced part.

- new skill `rehearsal`: a zero-context executor receives the deliverable and nothing else, actually runs it, and reports every stall — fix, rerun, three rounds at most; a pass under the wrong persona is not a pass; the round log is citable evidence for goal's done-check
- new skill `researcher` + `rules/ballast.researcher.example.json`: point `.claude/ballast.researcher.json` at any CLI that takes a question — collection is delegated, judgment is not; everything returns `hearsay` and still passes the verify gate; a command that fails is said out loud once, then Claude collects directly; briefs carry the search language, established-methods/known-failure-axes questions, and a verification threshold, because hook rules never reach external tools
- goal: the skeleton now lives in `memory/goal/<slug>.md` — the tree with leaf statuses, the single next leaf, known gaps by name, the done-check, superseded cuts — so a session ending loses nothing the file holds; Phase 1 can delegate collection; Phase 5 cites the rehearsal log
- decision-ledger: a supersede now ends with a sweep — the old wording is hunted across docs, copy, and configs, or registered as an open question; until then the dead decision keeps working
- pin: corrections that follow an incident get a first-line classification (default regression / propagation miss / delegation leak / variant evasion — one owner's working taxonomy) so the remedy matches the failure
- verify-gate: a configured verifier that fails is now said out loud once, then `(self-gated)` — a silent never-ran is the worst outcome
- README (EN/KO): the two new pieces enter the tables, the diagram, and the walkthrough; counts 9 → 11

These are one owner's working practices, generalized. Whether they help you is `unknown` until your own checks pass.

## 0.4.0 — 2026-08-15

The conventions now chain across a goal's whole life — prepare, accumulate, reuse, return. Three new skills, one revised, and the hook gains a runnable test harness. All new pieces are conventions; the rules hook remains the only code-enforced part.

- new skill `knowledge-base`: verified findings accumulate in `memory/knowledge/` — lookup before any research, verify-gate labels on drafts, promotion only through the gate (claim + sources + sample + limits + date), back-notes on processed drafts so nothing gets re-verified from scratch, 90-day freshness
- new skill `skill-forge`: a procedure that will recur *and* passed a real check is promoted to a skill file — when-to-use, the steps as they actually ran (traps included), verification date, evidence; one-line lessons go to pin instead
- new skill `checkpoint`: `memory/CHECKPOINT.md` with five fixed sections for a thirty-second return, outgoing versions archived append-only under `memory/checkpoints/`, and `memory/HANDOFF.md` as single-use orders — read once, then deleted
- goal skill: new Phase 0.5 (Mobilize) — split the goal into coarse MECE branches, match each against held assets (rules catalog, knowledge base, ledger, skills); where an asset exists, using it is mandatory; gaps enter the terrain scan first
- brain-init: notes the scaffold is a floor, not a ceiling — checkpoint and knowledge files join the memory index as they appear
- hook test harness `hooks/scripts/verify-hook.mjs`: runs the hook as a child process against an isolated temp home, 5 cases (keyword inject, silence on no match, block with exit 2, legacy `prompt` field, broken catalog stays harmless), currently 5/5 passing
- README (EN/KO) usability pass: keyword matching is verbatim, so write keywords in the language you chat in — Korean keywords added to the example catalog and demos; JSON examples now show the full file with the required `version`/`rules` wrapper; `BALLAST_DEBUG=1` documented; 60-second smoke test as Quick start step 0; fail-open symptom and recovery spelled out; issue links made real; version badge added

## 0.3.1 — 2026-08-15

Density pass on the README (EN/KO) — layout only, no content or claim changes.

- walls of prose cut to ≤2-sentence paragraphs; first screen rebuilt as fact bullets + one-line caption; a real before/after injection transcript added
- Quick start split under verb headings; table cells compressed to phrases; Korean lines capped at 180 chars with glosses on first use only; new Maintenance section

## 0.3.0 — 2026-08-15

Repair release: documentation brought in line with what the engine actually reads. No engine changes.

- pin skill: rule entries were documented with a `triggers` field the hook never reads — corrected to the real schema (`when.keywords` / `when.patterns` / `when.always`), with a copy-exact example entry
- verify-gate skill: `.claude/ballast.verifier.json` now ships with an example (`rules/ballast.verifier.example.json`), and the skill states that the skill — not the rules hook — reads it
- verified `/ballast:goal` and `/ballast:brain-init` against current Claude Code (2.1.x): plugin skills are slash-invocable as `/plugin:skill` without a `commands/` directory (custom commands were merged into skills), so the README instructions stand as written
- new CONTRIBUTING.md
- README (EN/KO) rewritten: headline and demo now describe the same product; every piece is labeled code-enforced or convention — the rules hook is the only enforced row, and the README says so plainly; the non-developer origin story moved out of a footnote
- Korean edition rewritten as native Korean (not a translation): consistent register, terms defined at first use
- plugin/marketplace descriptions rewritten from mechanism lists to a single promise; version 0.3.0

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
