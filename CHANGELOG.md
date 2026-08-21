# Changelog

## 0.9.0 — 2026-08-21

- **A non-answer is not a decision.** decision-ledger gains *Provisional readings*: when the user goes quiet, changes the subject, or answers with a token that could mean anything, the reading you proceed on is written in `OPEN-QUESTIONS.md` — their words quoted, your reading labeled `assumed`, what breaks if it is wrong, what ends it — never in the ledger. One-way doors (publish, send, spend, delete, standing rules) wait for words that actually say yes; two-way work may proceed with the label visible; questions are bundled at the next break instead of asked every message. The OPEN-QUESTIONS template gets a second table, *Readings in force*; brain-init, checkpoint and the session-start snippet point at it; README pieces table updated in three languages. Source: a hypothesis drafted by a second model over our own workspace, then narrowed by a refute-first review — its strong form ("silence is never consent") was rejected (most calls are two-way doors, and treating them all as one-way is how work stalls); what survived is above.
- **Codex runs the hook natively.** Codex CLI loads `UserPromptSubmit` hooks — project `.codex/hooks.json`, user `~/.codex/hooks.json`, plugin `hooks/hooks.json` — in the JSON shape ballast already emits, and the engine needed no change. New `.codex-plugin/plugin.json` makes the repository installable with `codex plugin marketplace add svy04/ballast` + `codex plugin add ballast@ballast`; new `rules/ballast.codex-hooks.example.json` is the copy-ready project hook. Observed 2026-08-21 on codex-cli 0.147.0 (Windows): a probe rule arrived through a project hook and through the plugin hook (installed from a local clone path). Trust is manual — `/hooks`, recorded per hash — and `--dangerously-bypass-hook-trust` exists for automation. `docs/CODEX.md` is rewritten around this; the `codex exec` wrapper stays as the fallback for builds without hooks.
- **Correction.** 0.5.1 through 0.8.0 said released Codex CLIs did not load user hook configs. Our 2026-08-17 test had written `~/.codex/hooks.toml` — a file Codex never reads; the real files are `hooks.json` or a `[hooks]` table in `config.toml`. The docs now say so.
- Versions: both plugin manifests and the README badges read 0.9.0. Hook engine unchanged; harness 7/7.

## 0.8.1 — 2026-08-21

- **The plugin failed to load on current Claude Code — fixed.** `hooks/hooks.json` declared its `UserPromptSubmit` entry flat (`type`/`command` directly on the entry). Claude Code loads the documented shape — each entry wraps its commands in a nested `hooks` array — and rejected the manifest: `claude plugin list` showed `failed to load … expected array, received undefined`, so a marketplace install ran no hook. Reproduced on Claude Code 2.1.201 here and on 2.1.235 in the report; after the fix the same install reads `enabled`, and a probe rule arrived in a live `claude -p` session. The fix is [PR #2](https://github.com/svy04/ballast/pull/2) by @biggieb327-lgtm — the project's first outside contribution. Thank you.
- **Why the harness did not catch it:** `verify-hook.mjs` exercised the rule engine, never the manifest, and the install-from-marketplace check had been carried forward since 0.4 without being run. Case 7 now parses `hooks/hooks.json` and fails if any event entry lacks a nested `hooks` array — 7/7 passing. The README specs line says 7 in all three languages.
- **If you installed before this release:** `/plugin update ballast@ballast` (or uninstall and install again), then `claude plugin list` should read `enabled`. Nothing else changed — engine, skills, and catalog format are as in 0.8.0.

## 0.8.0 — 2026-08-17

- **`codex exec` gets real rule delivery** — new `hooks/scripts/ballast-codex.mjs` wraps `codex exec`: it runs the same rule engine, prepends matching rules to the prompt, and honors `block` rules (refuse + reason, exit 2). Verified live on codex-cli 0.130: a spending prompt arrived with the cost-gate rule and Codex opened with an estimate and approval request; the block path stops before Codex is invoked.
- Why a wrapper and not a hook: Codex's lifecycle-hook system (same `UserPromptSubmit` event and JSON shape ballast already emits) exists in openai/codex main, but released CLIs through 0.147.0 do not load user hook configs — checked against the 0.147.0 binary on 2026-08-17. When that ships, the existing hook plugs in unchanged; the wrapper is the bridge until then.
- Interactive Codex sessions remain convention-only, and the docs still say so — `docs/CODEX.md` now separates the three states plainly: Claude Code (hook, code-enforced) · codex exec (wrapper, code-enforced) · interactive Codex (convention).
- README (EN/KO/ZH): the Codex line updated to match; version badges to 0.8.0.


## 0.7.0 — 2026-08-17

- **new skill `recall`** — sweeps everything the project already holds *before answering*, at a session's first substantive reply and again at every subject shift. Five places, all of them: `memory/00-INDEX.md`, `memory/knowledge/`, `DECISIONS.md`, the rule catalog, and `skills/` + `memory/goal/`. Scan at index level, open what looks relevant, read it, and leave one line saying what was swept and opened — including when nothing matched.
- The skill's own rule is that finding one thing does not end the sweep. The layers hold different kinds of thing (a rule is not a verified fact is not a settled decision is not a forged procedure), so one layer answering does not mean the others have nothing to add.
- Why it is separate from what already existed: `goal`'s mobilize phase reasons **down** from a stated task and can only summon what the task is known to need; `knowledge-base`'s lookup runs before *researching*. `recall` reasons **up** from what is held and runs before *answering at all*. That gap is where "but that was already written down" happens.
- README (EN/KO) and `docs/CODEX.md`: symptom list, fixes table, pieces table, chain, and every skill count updated together.

## 0.6.0 — 2026-08-16

An audit against the private workspace this project was distilled from: identity first, then the gaps the distillation left behind. One hook change; everything else is convention and copy.

- **identity** — the lead now says what ballast is for: taking a goal in a field you have no expertise in and building up to it, then keeping every solved path for the next goal. Verification, rehearsal, rule delivery and done-means-checked protect that, and are described inside the loop instead of as the headline. Applied to README (EN/KO), `plugin.json`, `marketplace.json` and `docs/CODEX.md` together — those surfaces had drifted apart
- **rules hook** — a catalog file that exists but cannot be read now gets one line back to the user, naming the file and stating that its rules are not being delivered. Every other failure stays silent, and a parse failure still never blocks the prompt. A missing catalog is unchanged: that is the normal starting state and stays quiet
- **hook harness** `hooks/scripts/verify-hook.mjs` — 6 cases, 6/6 passing; the two new ones cover the notice above and the guarantee that a broken catalog still exits 0
- **verify-gate** — an empty, truncated or off-topic verifier reply counts as a failed run, not a pass; a partial refutation is confirmed at its narrowed wording rather than rejected whole; the gate's result gets written down where the claim lives
- **knowledge-base** — a finding that contradicts a standing entry surfaces the conflict before it is filed; editing an entry updates the skills resting on it
- **proof-standard** — a freshness rule, and one truth file per subject split by what kind of evidence is available; the "not implemented" section is called out as the part that rots toward understating the product
- **skill-forge** — a third refresh trigger: the knowledge entry a procedure rests on changed
- **goal** — the Phase 0 restatement is re-read before done is claimed; leaves report the sub-fields they exposed and tree nodes carry evidence; leaves filled in parallel get one refutation pass over the batch
- **researcher** — search language picks one primary per question, at most one secondary, never all in parallel
- **checkpoint, knowledge-base** — new memory files register a row in the index the first time they appear
- **README (EN/KO)** — "Why ballast" split into *The fixes* and *The chain*; the chain's fourth link is quality, not return; verifier and researcher setup folded into `<details>`; a reference link to `skills/`; the zero-dependency claim now names its scope (the hook is one script; the check harness is separate and spawns `node`)

## 0.5.1 — 2026-08-16

ballast now runs on Codex too — as conventions. No code changes.

- new doc `docs/CODEX.md`: wires the eleven skills and the shared rule catalog into Codex through an `AGENTS.md` block; custom-prompt wrappers for direct invocation; honest limits — nothing is code-enforced on Codex, the hook's matching/cap/env mechanics don't exist there, the hook stays Claude Code-only
- observed live on Codex CLI 0.130 (`codex exec`, one session each — an observation, not a harness): a catalog rule held (estimate presented, approval requested before executing), and the rehearsal and verify-gate skills were read and followed unprompted, labels included
- brain-init: the session-start block also goes to `AGENTS.md` when the project uses Codex
- README (EN/KO): a Codex pointer under Install

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
