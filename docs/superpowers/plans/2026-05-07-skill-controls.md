# TurboTrainer Extended Skill Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sub-row beneath each skill row with numeric set-to, delta ±, and 0/1x/2x/3x/max quick controls.

**Architecture:** All changes inside the single `turboTrainer()` function in `index.html`. A `unit` variable (min non-zero maxtrn across all skills) and a `setSkillTo` helper are added at function scope after the categories check. Style constants for sub-row UI sit alongside the existing `COL`/`ROWBASE` constants. Each skill's `cat.skills.forEach` block gets a sub-row appended after its existing row.

**Tech Stack:** Vanilla JavaScript (ES5), no dependencies, single HTML file bookmarklet.

---

### Task 1: Add `unit` computation, `setSkillTo` helper, and sub-row style constants

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert `unit` computation and `setSkillTo` after the categories-empty guard**

Find this exact sequence in `index.html`:

```javascript
    if (!categories.length) { alert('TurboTrainer: no skills found on this page.'); return; }

    var M = 'font-family:Courier New,monospace;box-sizing:border-box;';
```

Insert between those two lines:

```javascript
    var unit = Infinity;
    categories.forEach(function (cat) {
      cat.skills.forEach(function (sk) {
        var m = parseInt(sk.max);
        if (m > 0) unit = Math.min(unit, m);
      });
    });
    if (!isFinite(unit) || unit <= 0) unit = 1;

    var setSkillTo = function (id, target, maxRank) {
      var src = document.getElementById('amt_skill' + id);
      var current = src ? (parseInt(src.textContent.replace(/\u00a0/g, ' ').trim()) || 0) : 0;
      if (maxRank > 0) target = Math.min(target, maxRank);
      target = Math.max(0, Math.round(target));
      if (target > current) {
        for (var i = current; i < target; i++) upskill(id);
      } else if (target < current) {
        for (var i = current; i > target; i--) downskill(id);
      }
      var dst = document.getElementById('tt-rank-' + id);
      if (src && dst) dst.textContent = src.textContent.trim();
      refreshPoints();
    };
```

- [ ] **Step 2: Add sub-row style constants after `ROWBASE`**

Find:

```javascript
    var ROWBASE = M + 'display:flex;align-items:center;gap:10px;padding:6px 20px;';

    var hrow = document.createElement('div');
```

Insert between those two lines:

```javascript
    var IBTN   = M + 'background:#181818;border:1px solid #2e2e2e;color:#666;font-size:10px;padding:2px 8px;cursor:pointer;letter-spacing:1px;';
    var IINPUT = M + 'width:44px;background:#1a1a1a;border:1px solid #333;color:#aaa;font-size:11px;padding:2px 4px;text-align:center;';
    var ISEP   = 'color:#2a2a2a;font-size:13px;margin:0 4px;user-select:none;';
    var ILBL   = M + 'color:#444;font-size:10px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0;';
```

- [ ] **Step 3: Verify no JS errors**

Open `index.html` in a browser. Open DevTools console (F12) — zero errors should appear. Right-click the bookmarklet link → Inspect → confirm the `href` attribute starts with `javascript:`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add setSkillTo helper, unit computation, and sub-row style constants"
```

---

### Task 2: Add sub-row to each skill

**Files:**
- Modify: `index.html` (inside `cat.skills.forEach` loop)

- [ ] **Step 1: Locate the end of the skill row block**

Find this exact sequence (the final two lines of the `cat.skills.forEach` callback, near the bottom of the `turboTrainer` function):

```javascript
      list.appendChild(row);
      });
    });
```

- [ ] **Step 2: Replace that sequence with the sub-row block**

```javascript
      list.appendChild(row);

      var maxRank = parseInt(sk.max) || 0;

      var subRow = document.createElement('div');
      subRow.style.cssText = M + 'display:flex;align-items:center;flex-wrap:wrap;gap:5px;'
        + 'padding:4px 20px 6px;border-bottom:1px solid #1e1e1e;background:#111;';
      subRow.onmouseover = function () { subRow.style.background = '#161616'; };
      subRow.onmouseout  = function () { subRow.style.background = '#111'; };

      // set to [input] go
      var setLbl = document.createElement('span');
      setLbl.textContent = 'set to';
      setLbl.style.cssText = ILBL;
      subRow.appendChild(setLbl);

      var setInput = document.createElement('input');
      setInput.type = 'text';
      setInput.style.cssText = IINPUT;
      setInput.placeholder = '—';
      subRow.appendChild(setInput);

      var goBtn = document.createElement('button');
      goBtn.textContent = 'go';
      goBtn.type = 'button';
      goBtn.style.cssText = IBTN;
      goBtn.addEventListener('click', function () {
        var v = parseInt(setInput.value);
        if (!isNaN(v)) { setSkillTo(sk.id, v, maxRank); setInput.value = ''; }
      });
      setInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') goBtn.click();
      });
      subRow.appendChild(goBtn);

      var sep1 = document.createElement('span');
      sep1.textContent = '|';
      sep1.style.cssText = ISEP;
      subRow.appendChild(sep1);

      // ± [input] + −
      var deltaLbl = document.createElement('span');
      deltaLbl.textContent = '±';
      deltaLbl.style.cssText = ILBL;
      subRow.appendChild(deltaLbl);

      var deltaInput = document.createElement('input');
      deltaInput.type = 'text';
      deltaInput.style.cssText = IINPUT;
      deltaInput.placeholder = '—';
      subRow.appendChild(deltaInput);

      [1, -1].forEach(function (sign) {
        var b = document.createElement('button');
        b.textContent = sign > 0 ? '+' : '−';
        b.type = 'button';
        b.style.cssText = IBTN;
        b.addEventListener('click', function () {
          var v = parseInt(deltaInput.value);
          if (!isNaN(v)) {
            var src = document.getElementById('amt_skill' + sk.id);
            var cur = src ? (parseInt(src.textContent.replace(/\u00a0/g, ' ').trim()) || 0) : 0;
            setSkillTo(sk.id, cur + sign * v, maxRank);
          }
        });
        subRow.appendChild(b);
      });

      var sep2 = document.createElement('span');
      sep2.textContent = '|';
      sep2.style.cssText = ISEP;
      subRow.appendChild(sep2);

      // 0, 1x, 2x, 3x, max
      [['0', 0], ['1x', unit], ['2x', unit * 2], ['3x', unit * 3], ['max', maxRank]].forEach(function (pair) {
        var b = document.createElement('button');
        b.textContent = pair[0];
        b.type = 'button';
        b.style.cssText = IBTN;
        b.addEventListener('click', function () { setSkillTo(sk.id, pair[1], maxRank); });
        subRow.appendChild(b);
      });

      list.appendChild(subRow);
      });
    });
```

- [ ] **Step 3: Manual verification on the GS4 Skills Trainer page**

Open `https://www.play.net/gs4/play/cm/trainer.asp`, click the bookmarklet, then verify:

1. Every skill has two rows — the existing ±1/5/10 row plus a dimmer sub-row
2. Sub-row reads: `set to [—] go | ± [—] + − | 0 1x 2x 3x max`
3. Type `5` in a "set to" field → press Enter → rank becomes 5, TP counters update
4. Type `10` in a "set to" field → click go → rank becomes 10, input clears
5. Type `3` in a `±` field → click `+` → rank increases by 3
6. Type `3` in a `±` field → click `−` → rank decreases by 3 (never below 0)
7. Click `0` → rank becomes 0
8. Click `1x` → rank becomes the unit value (identical across all skills at this level)
9. Click `2x` on a 2x-capped skill → rank goes to maxtrn; on a 3x-capped skill → rank = unit × 2
10. Click `3x` → rank = unit × 3, clamped to skill's maxtrn
11. Click `max` → rank becomes that skill's maxtrn value
12. For a 1x-capped skill: `1x`, `2x`, `3x`, and `max` all land at maxtrn (since unit × 2 and unit × 3 exceed the cap and get clamped)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add extended skill control sub-rows (set-to, delta, 0/1x/2x/3x/max)"
```

---

### Task 3: Update landing page and README

**Files:**
- Modify: `index.html` (Usage `<ol>` in HTML body)
- Modify: `README.md`

- [ ] **Step 1: Update the Usage `<ol>` in `index.html`**

Find:

```html
      <li>+5, +10, -5, -10 buttons appear next to every skill</li>
      <li>Submit your training as normal when done</li>
```

Replace with:

```html
      <li>±1, ±5, ±10 buttons appear next to every skill</li>
      <li>A sub-row beneath each skill adds: type a rank to jump straight to it, type a delta to add/subtract, or use quick buttons: <strong>0</strong>, <strong>1x</strong>, <strong>2x</strong>, <strong>3x</strong>, <strong>max</strong></li>
      <li>Submit your training as normal when done</li>
```

- [ ] **Step 2: Replace the full contents of `README.md`**

```markdown
# ⚡ GS4 TURBOTRAINER

Adds bulk training controls to the GemStone IV skill trainer page so you don't have to click +1 or -1 a hundred times.

---

## How to install

**1. Go to the TURBOTRAINER page:**
👉 https://turbotrainer.gamemasters.lol

**2. Drag the gold button to your bookmarks bar.**
(If you don't see the bookmarks bar, press `Ctrl+Shift+B` on Windows/Linux or `⌘+Shift+B` on Mac.)

**3. Done.** That's it.

---

## How to use it

1. Log in to GemStone IV
2. Open the [skill trainer](https://www.play.net/gs4/play/cm/trainer.asp)
3. Click **⚡ GS4 TURBOTRAINER** in your bookmarks bar
4. Controls appear next to every skill

**Each skill has two rows of controls:**

*Top row — quick increments:*
- **±1, ±5, ±10** buttons to nudge ranks up or down

*Sub-row — precision controls:*
- **set to `[n]` go** — type any rank number and jump straight to it (Enter or click go)
- **± `[n]` + −** — type a number and add or subtract that many ranks
- **0** — zero out the skill
- **1x / 2x / 3x** — set to 1×, 2×, or 3× your current training level (auto-detected from the page, clamped to each skill's max)
- **max** — set to the skill's maximum allowed ranks

5. Submit your training as normal when you're done

The original +1 / -1 buttons on the trainer page still work. TURBOTRAINER adds controls on top.

---

## Does it store my login or character info?

No. TURBOTRAINER is a bookmarklet — it's just a button that runs a tiny piece of JavaScript on the page already open in your browser. It doesn't send data anywhere, has no server, and doesn't touch your account.

---

## It stopped working after a page update

Click the bookmark again — it re-runs every time you click it. If the buttons don't appear, the trainer page may have changed. Open an [issue](https://github.com/jasonpersinger/TURBOTRAINER/issues) and I'll take a look.

---

*Not affiliated with Simutronics Corp.*
```

- [ ] **Step 3: Commit**

```bash
git add index.html README.md
git commit -m "docs: update README and landing page for extended skill controls"
```
