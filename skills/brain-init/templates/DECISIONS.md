# DECISIONS — append-only ledger

Rules: only user-confirmed decisions are recorded. Nothing is edited or deleted. A changed decision gets a **new** entry that `supersedes D-xxx`, and the old entry receives exactly one added line: `→ superseded by D-yyy (date)`. Sequential ids, never reused. (Full protocol: ballast decision-ledger skill.)

---

## D-001 · Adopt the ballast memory structure — <YYYY-MM-DD> (user, project setup)

This project uses `memory/` as its durable brain: decisions in this ledger, unresolved items in OPEN-QUESTIONS, per-session notes in SESSION-LOG. Standing decisions are followed without relitigating; changes go through the supersede protocol.

<!-- Append new entries below. Example of a superseded pair:

## D-002 · Weekly report goes out Fridays — 2026-01-10 (user, chat)

→ superseded by D-005 (2026-02-01)

## D-005 · Weekly report moves to Mondays — 2026-02-01 (user, chat)

Supersedes D-002. Fridays kept slipping into the weekend; Monday forces the week to start closed-loop.
-->
