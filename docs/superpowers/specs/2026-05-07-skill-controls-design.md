# TurboTrainer — Extended Skill Controls

**Date:** 2026-05-07  
**Status:** Approved

## Overview

Add a sub-row of extended controls beneath each skill row in the TurboTrainer overlay. The existing ±1/5/10 buttons are unchanged. New controls allow precise numeric targeting, quick multiplier shortcuts, and zero/max one-click actions.

## New Controls (per skill sub-row)

| Control | Behavior |
|---|---|
| **Set to** `[input]` **go** | Set skill to exact rank value (Enter or click go) |
| **±** `[input]` **+** / **−** | Add or subtract N ranks from current rank |
| **0** | Set rank to 0 |
| **1x** | Set rank to `unit × 1`, clamped to `maxRank` |
| **2x** | Set rank to `unit × 2`, clamped to `maxRank` |
| **3x** | Set rank to `unit × 3`, clamped to `maxRank` |
| **max** | Set rank to `maxRank` |

Sub-rows are always visible (not hidden behind a toggle).

## 1x Training Unit

The **1x unit** is computed once at overlay initialization as the **minimum non-zero `maxtrn` value** across all skills on the page.

In GS4, `maxtrn` for any skill = `unit × N` where N ∈ {1, 2, 3} (profession's training cap for that skill). Taking the minimum gives the base 1x rank value for the current character — accounting for race/profession bonuses automatically, with no level parsing needed.

Example: level 21 bard — unit = 23 (min of 23, 46). At level 100, unit ≈ 102.

## Core Engine: `setSkillTo`

```
setSkillTo(id, target, maxRank):
  current = parseInt(amt_skill{id}.textContent)
  target  = clamp(target, 0, maxRank)
  if target > current: call upskill(id) × (target - current)
  if target < current: call downskill(id) × (current - target)
  call refresh()
```

All new buttons delegate to this function. `upskill` and `downskill` are the page's existing client-side DOM functions (no server calls until Submit). The synchronous loop is safe — max delta is ~306 calls at level 100 3x cap, which completes in under 1ms.

## Layout

Option A: second row per skill, always shown.

```
[Recover]  [−10][−5][−1]  [Rank]  [+1][+5][+10]  [Cost]  [Max]  [Skill Name]
           set to: [___] go  |  ± [___] [+][−]  |  [0] [1x] [2x] [3x] [max]
```

Sub-row is indented to align under the button groups, styled dimmer than the primary row.

## Data

- `maxtrn` is already scraped per skill as `sk.max` (string — parse with `parseInt`)
- Current rank is read live from `#amt_skill{id}` at click time (not from `sk.rank` snapshot)
- `unit` is computed once after `categories` is populated, before the overlay renders

## Constraints

- No changes to existing ±1/5/10 buttons, header, TP display, footer, or Submit behavior
- All logic stays inside the `turboTrainer()` function (bookmarklet constraint — single self-contained function)
- No external dependencies
- `maxtrn` values of 0 or non-numeric are skipped when computing `unit`
