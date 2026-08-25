---
name: schedule
description: Own the calendar as a ledger - fixed dates, event-triggered entries, and launch bundles that fire together or not at all. Use when work has deadlines or submission windows, reacts to outside events (an outage, a deprecation, a competitor incident), or needs several deliverables published near-simultaneously.
---

# Schedule — events become entries, and nothing fires half-staged

The human fires the outward actions; the agent owns everything before that: noticing, entering, judging, preparing, recording. One file holds it: `memory/SCHEDULE.md` (create it on first use). Without a ledger, events are handled from memory — which means twice, or never.

## Three kinds of entry

| Kind | What it is | Required fields |
|---|---|---|
| **Fixed** | dates known in advance — deadlines, eligibility days, submission windows | date · action · where the prepared material lives · what is still unconfirmed |
| **Event** | born outside — an outage, a model deprecation, a competitor incident | date it happened · freshness limit · judgment · prepared material · handling record |
| **Bundle** | deliverables that launch as one wave plan | member list · each member's staged / not staged · fire order on each channel's clock · the bundle rule |

**The bundle rule: if one member is not staged, nothing fires.** A half-launched wave reads as two small ones. Staging is all-or-nothing; firing is not all-at-once — every documented winning launch staged everything first, fired the channel with a ranking clock at its own hour, and released the rest in waves, because a same-minute blast on a ranked platform reads as vote manipulation. Verify the first member actually went live before the next wave fires.

## The event procedure

1. **Notice** — a scan (scheduled, or at session start) or the human's one line. The human is the fastest sensor; the scan is the floor, not the ceiling.
2. **Check the ledger first.** An event already handled is never reacted to twice — that is what the handling record is for.
3. **Enter it with a freshness limit** — a date after which the right reaction is no reaction, only a record.
4. **Judge it against red lines written in advance.** An event can be an opportunity (people are moving), an avoid-day (your promotion lands as noise, or as bad taste on someone's crisis), or both at once — the same day can be right for joining conversations and wrong for self-promotion. Never attach a promotion to a tragedy. And watch the wounded party: if they reverse course within a day or two, the window closes and the right reaction becomes no reaction.
5. **Prepare everything the human needs to fire**: the text, the destination, the timing, the one thing still unconfirmed.
6. **Report one line per changed entry.** "No change" is a complete report.

## Steps

1. If `memory/SCHEDULE.md` does not exist, create it with the three sections above and every date already known.
2. On every scan or session start: run the event procedure, check today's fixed entries, check whether any bundle is now fully staged.
3. Record the scan date in the ledger. If more than a day was missed (machine off, no session), scan the gap too — an event from a missed day may still be inside its freshness limit.

## Honesty

- A scheduled wakeup lives only while its host does — machine off or session closed means no scan ran. The ledger's last-scan date is the truth; the scan schedule is an intention.
- Noticing lags reality by up to one scan cycle. A big event deserves the human's one line, not a wait for morning.
- The agent prepares; the human fires anything outward (posts, submissions, payments). An entry is "staged", never "done", until the human fired it and the handling record says so.

---

*Part of [ballast](https://github.com/svy04/ballast) — foundations first, every solved path kept, done means checks pass.*
