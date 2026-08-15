---
name: rehearsal
description: Test a deliverable on a zero-context reader before it ships. Use before shipping any document, guide, kit, or handoff meant to work without you, and before calling a deliverable done in goal Phase 5.
---

# Rehearsal — the recipient has no context

Whatever you just wrote reads clearly to you because you wrote it. The recipient has none of that. The failure mode this prevents: a deliverable that fails on first contact with its reader — after shipping, when every stall costs a round-trip.

## The setup

Hand the deliverable — and nothing else — to a zero-context executor: a fresh subagent, or a person who hasn't seen this conversation. No history, no verbal explanation, no "what I meant was". If it needs an explanation to work, the explanation belongs inside the deliverable.

## The instruction has three parts

1. **Persona, precisely.** Who will actually receive this: what they know, what they don't, what tools they have, what language they read. Those facts come from the user or the deliverable's stated audience — if neither says who it's for, ask; the recipient is the user's fact to give, not yours to invent. A generic "reader" is the wrong test — the real recipient usually knows the domain and not your shorthand.
2. **Execute, don't review.** Follow the deliverable and actually do what it says — run the steps, fill the form, build the thing. Reading and nodding finds nothing.
3. **Report the stalls.** Every place they stopped, guessed, or misread — line by line, no pushing past a gap. The stalls are the finding, not a footnote.

## Rounds

Fix what stalled, hand it to a fresh executor, repeat — **three rounds at most**. Round one tends to find the real blockers, round two finds what the fixes broke, round three is mostly false alarms: that's convergence.

**Clean** means the executor finished without a blocking stall — a report that points at text which already answers it is a false alarm, not a stall. Not clean by round three? The structure is wrong, not the wording: redesign instead of re-polishing, and a redesigned deliverable is a new deliverable — its rounds start again at one.

One redesign is normal. A second redesign that still isn't clean ends the loop: take the stall list to the user — the deliverable's shape is now their decision, not another rewrite.

## Three rules

- **A pass under the wrong persona is not a pass.** If the rehearsal reader knew more — or less — than the real recipient, correct the persona and rerun.
- **A clean pass earns the done-check, not the ship.** Anything externally visible still leaves only with the user's click (goal's standing behavior).
- **Keep the log.** Rounds, stalls, fixes — beside the deliverable, or in the goal file's done-check (`memory/goal/<slug>.md`) when the work runs under goal. The log is citable evidence that the deliverable survived contact (`observed`, dated); "it reads fine to me" cites nothing.

ballast's own releases go through this procedure — the README you installed from survived its rounds.
