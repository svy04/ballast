---
name: recall
description: Sweep everything the project already holds before answering — at the first message of a session, and again whenever the subject shifts to something the current thread was not about. Use before replying, not only before researching.
---

# Recall

The failure this prevents is not missing knowledge. It is knowledge that was written down, indexed, and then not opened.

That failure has a shape: the answer existed in the project's own files, the assistant answered from general habit instead, and nobody noticed until the user said *"isn't that already written down somewhere?"* — because it was. Delivery hooks do not close this. A hook fires on keywords in the message; it cannot know that a settled note three folders away decides the question.

## When it runs

Two moments, no exceptions:

- **The first substantive reply of a session.** Not the greeting — the first answer that carries work.
- **A subject shift.** The thread moves to something it was not about: a different deliverable, a different field, a different kind of question. If you are unsure whether the subject shifted, it shifted.

Inside one continuing subject, later replies do not repeat the sweep. It has already run.

## What to sweep — five places, all of them

1. **`memory/00-INDEX.md`** — the map of what exists at all. Read this first; it names the layers the rest of the sweep will visit.
2. **`memory/knowledge/`** — findings that passed the gate.
3. **`DECISIONS.md`** — what was settled, and what superseded what.
4. **The rule catalog** (`.claude/ballast.rules.json`, plus the user-level one) — standing corrections that apply whether or not a keyword matched this message.
5. **`skills/` and `memory/goal/`** — procedures already forged, and the skeleton of any goal in flight.

Scan at the index level — titles, headings, entry names. Then **open what looks relevant and actually read it** before answering.

## Do not stop at the first hit

A sweep that ends when something turns up is the same failure wearing a better hat.

- **Finding one does not end the sweep.** Visit all five places even after an answer appears in the second.
- **The layers hold different things.** A rule is not a verified fact; a verified fact is not a settled decision; a settled decision is not a forged procedure. One layer answering the question does not mean the others have nothing to add — often they qualify or contradict it.
- **Open widely, not carefully.** Read the candidates together rather than one at a time, and delegate a broad pass when the surface is large. Opening fewer files is not economy; it is the omission this skill exists to prevent.

## Leave the sweep visible

Say in one line what you swept and what you opened — including when nothing matched. A sweep nobody can see is indistinguishable from a sweep that never ran, and the next session will redo the same reading.

> Swept index, knowledge/, DECISIONS, rules, skills — opened `knowledge/pricing-copy.md` and decision D-014; nothing in skills or goal touches this.

## How this differs from the other lookups

- **goal's mobilize phase** splits a stated goal top-down and asks what each branch needs. It starts from the task and reasons down.
- **knowledge-base's lookup** runs before researching a topic.
- **recall runs before answering at all**, and it reasons the other way: from what is held, upward. Top-down mobilization only summons what the task is already known to need — it cannot summon what you did not know was there. That gap is where this skill lives, and it is why a project can have both and still be caught by *"that was already written down."*
