(function () {
var TURBOTRAINER_VERSION = 'v0.2.1';

function turboTrainer() {
  if (document.getElementById('tt-overlay')) {
    document.getElementById('tt-overlay').remove();
    return;
  }

  var categories = [];
  var currentCat = null;

  document.querySelectorAll('tr').forEach(function (tr) {
    var catTd = tr.querySelector('td.dimBG');
    if (catTd) {
      currentCat = { name: catTd.textContent.trim(), skills: [] };
      categories.push(currentCat);
      return;
    }
    var upBtn = tr.querySelector('img[onclick^="upskill("]');
    if (!upBtn || !currentCat) return;
    var m = upBtn.getAttribute('onclick').match(/upskill\((\d+)\)/);
    if (!m) return;
    var id = parseInt(m[1]);
    var a = tr.querySelector('td > a');
    var get = function (pfx) {
      var el = document.getElementById(pfx + id);
      return el ? el.textContent.replace(/\u00a0/g, ' ').trim() : '';
    };
    currentCat.skills.push({
      id:      id,
      name:    a ? a.textContent.trim() : 'Skill ' + id,
      rank:    get('amt_skill'),
      cost:    get('sklcost'),
      recover: get('skrcost'),
      max:     get('maxtrn')
    });
  });

  if (!categories.length) { alert('TurboTrainer: no skills found on this page.'); return; }

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
    if (src && dst) dst.textContent = src.textContent.replace(/\u00a0/g, ' ').trim();
    refreshPoints();
  };

  var M = 'font-family:Courier New,monospace;box-sizing:border-box;';

  var ov = document.createElement('div');
  ov.id = 'tt-overlay';
  ov.style.cssText = M + 'position:fixed;inset:0;background:#141414;z-index:99999;'
    + 'display:flex;flex-direction:column;color:#d0d0d0;font-size:13px;';

  var hdr = document.createElement('div');
  hdr.style.cssText = M + 'padding:16px 24px;border-bottom:1px solid #343434;flex-shrink:0;background:#181818;';

  var hdrTop = document.createElement('div');
  hdrTop.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:14px;flex-wrap:wrap;';

  var ttitle = document.createElement('span');
  ttitle.textContent = '\u26a1 GS4 TurboTrainer ' + TURBOTRAINER_VERSION;
  ttitle.style.cssText = 'color:#f0f0f0;font-weight:bold;letter-spacing:2px;font-size:16px;';
  hdrTop.appendChild(ttitle);

  var charInfo = (function () {
    try {
      var parts = [];
      var nameEl = document.querySelector('#leftside .invS1');
      if (nameEl) parts.push(nameEl.textContent.trim());
      document.querySelectorAll('#leftside .normS2').forEach(function (lbl) {
        try {
          var row = lbl.parentElement;
          while (row && row.tagName !== 'TR') row = row.parentElement;
          var val = row && row.querySelector('.normS1');
          if (val) parts.push(lbl.textContent.trim() + ' ' + val.textContent.trim());
        } catch (e) {}
      });
      return parts.join('  \u00b7  ');
    } catch (e) { return ''; }
  })();

  var charEl = document.createElement('span');
  charEl.textContent = charInfo;
  charEl.style.cssText = 'font-size:12px;color:#9a9a9a;letter-spacing:1px;flex:1;text-align:right;min-width:220px;';
  hdrTop.appendChild(charEl);

  var closeBtn = document.createElement('button');
  closeBtn.textContent = 'x  close';
  closeBtn.type = 'button';
  closeBtn.style.cssText = M + 'background:#202020;border:1px solid #444;color:#aaa;'
    + 'font-size:12px;padding:7px 12px;cursor:pointer;letter-spacing:1px;';
  closeBtn.addEventListener('click', function () { ov.remove(); });
  hdrTop.appendChild(closeBtn);
  hdr.appendChild(hdrTop);

  var getTP = function (id) {
    var el = document.getElementById(id);
    return el ? el.textContent.trim() : '?';
  };

  var hdrPoints = document.createElement('div');
  hdrPoints.style.cssText = 'display:flex;gap:10px;font-size:12px;flex-wrap:wrap;';

  var pointDefs = [
    ['Physical TPs', 'disp_phy_tp'],
    ['Mental TPs',   'disp_mnt_tp'],
    ['Phy\u2192Mnt', 'phytomnt'],
    ['Mnt\u2192Phy', 'mnttophy']
  ];

  pointDefs.forEach(function (def) {
    var wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:#111;border:1px solid #2d2d2d;padding:6px 10px;';
    var lbl = document.createElement('span');
    lbl.textContent = def[0];
    lbl.style.cssText = 'color:#777;letter-spacing:1px;font-size:10px;text-transform:uppercase;';
    var val = document.createElement('span');
    val.id = 'tt-tp-' + def[1];
    val.textContent = getTP(def[1]);
    val.style.cssText = 'color:#c8a84a;font-weight:bold;';
    wrap.appendChild(lbl);
    wrap.appendChild(val);
    hdrPoints.appendChild(wrap);
  });

  hdr.appendChild(hdrPoints);
  ov.appendChild(hdr);

  var refreshPoints = function () {
    pointDefs.forEach(function (def) {
      var el = document.getElementById('tt-tp-' + def[1]);
      if (el) el.textContent = getTP(def[1]);
    });
  };

  var list = document.createElement('div');
  list.style.cssText = 'flex:1;overflow:auto;background:#121212;';

  var COL = {
    name:    'flex:1;min-width:220px;',
    cost:    'width:72px;text-align:center;',
    rank:    'width:72px;text-align:center;',
    max:     'width:72px;text-align:center;',
    recover: 'width:82px;text-align:center;',
    btns:    'width:150px;display:flex;gap:6px;flex-shrink:0;align-items:center;'
  };

  var ROWBASE = M + 'display:flex;align-items:center;gap:14px;padding:10px 24px;min-height:50px;';

  var IBTN   = M + 'min-width:42px;background:#202020;border:1px solid #444;color:#bbb;font-size:12px;padding:6px 10px;cursor:pointer;letter-spacing:1px;';
  var IINPUT = M + 'width:64px;background:#1d1d1d;border:1px solid #4a4a4a;color:#ddd;font-size:12px;padding:6px 7px;text-align:center;';
  var ISEP   = 'color:#3f3f3f;font-size:15px;margin:0 8px;user-select:none;';
  var ILBL   = M + 'color:#777;font-size:11px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0;';

  var hrow = document.createElement('div');
  hrow.style.cssText = ROWBASE + 'border-bottom:1px solid #363636;background:#1c1c1c;position:sticky;top:0;z-index:1;';
  var HL = 'font-size:11px;letter-spacing:2px;color:#777;text-transform:uppercase;';
  [['name','Skill Name'],['cost','Cost'],['max','Max'],['recover','Recover'],['btns','Reduce'],['rank','Rank'],['btns','Train']].forEach(function(pair) {
    var h = document.createElement('span');
    h.textContent = pair[1];
    h.style.cssText = HL + COL[pair[0]];
    hrow.appendChild(h);
  });
  list.appendChild(hrow);

  categories.forEach(function (cat) {
    var catRow = document.createElement('div');
    catRow.style.cssText = M + 'padding:18px 24px 8px;font-size:11px;letter-spacing:3px;'
      + 'text-transform:uppercase;color:#d6b653;margin-top:8px;background:#121212;';
    catRow.textContent = cat.name;
    list.appendChild(catRow);

    cat.skills.forEach(function (sk) {
    var row = document.createElement('div');
    row.style.cssText = ROWBASE + 'border-top:1px solid #292929;background:#181818;';
    row.onmouseover = function () { row.style.background = '#202020'; };
    row.onmouseout  = function () { row.style.background = '#181818'; };

    var refresh = function () {
      var src = document.getElementById('amt_skill' + sk.id);
      var dst = document.getElementById('tt-rank-' + sk.id);
      if (src && dst) dst.textContent = src.textContent.replace(/\u00a0/g, ' ').trim();
      refreshPoints();
    };

    var nameEl = document.createElement('span');
    nameEl.textContent = sk.name;
    nameEl.style.cssText = 'font-size:14px;color:#ddd;font-weight:bold;' + COL.name;
    row.appendChild(nameEl);

    var costEl = document.createElement('span');
    costEl.textContent = sk.cost;
    costEl.style.cssText = 'font-size:13px;color:#9a9a9a;' + COL.cost;
    row.appendChild(costEl);

    var maxEl = document.createElement('span');
    maxEl.textContent = sk.max;
    maxEl.style.cssText = 'font-size:13px;color:#8a8a8a;' + COL.max;
    row.appendChild(maxEl);

    var recEl = document.createElement('span');
    recEl.textContent = sk.recover;
    recEl.style.cssText = 'font-size:13px;color:#9a9a9a;' + COL.recover;
    row.appendChild(recEl);

    var minusGrp = document.createElement('div');
    minusGrp.style.cssText = COL.btns;
    [10, 5, 1].forEach(function (n) {
      var b = document.createElement('button');
      b.textContent = '-' + n;
      b.type = 'button';
      b.style.cssText = M + 'min-width:44px;background:#261111;border:1px solid #9a3333;color:#e07068;'
        + 'font-size:12px;padding:7px 10px;cursor:pointer;font-weight:bold;';
      b.addEventListener('click', function () { for (var i = 0; i < n; i++) downskill(sk.id); refresh(); });
      minusGrp.appendChild(b);
    });
    row.appendChild(minusGrp);

    var rankEl = document.createElement('span');
    rankEl.id = 'tt-rank-' + sk.id;
    rankEl.textContent = sk.rank;
    rankEl.style.cssText = 'font-size:15px;color:#f0f0f0;font-weight:bold;' + COL.rank;
    row.appendChild(rankEl);

    var plusGrp = document.createElement('div');
    plusGrp.style.cssText = COL.btns;
    [1, 5, 10].forEach(function (n) {
      var b = document.createElement('button');
      b.textContent = '+' + n;
      b.type = 'button';
      b.style.cssText = M + 'min-width:44px;background:#28210f;border:1px solid #d6b653;color:#e2c86a;'
        + 'font-size:12px;padding:7px 10px;cursor:pointer;font-weight:bold;';
      b.addEventListener('click', function () { for (var i = 0; i < n; i++) upskill(sk.id); refresh(); });
      plusGrp.appendChild(b);
    });
    row.appendChild(plusGrp);

    list.appendChild(row);

    var maxRank = parseInt(sk.max) || 0;

    var subRow = document.createElement('div');
    subRow.style.cssText = M + 'display:flex;align-items:center;flex-wrap:wrap;gap:8px;'
      + 'padding:8px 24px 12px;border-bottom:1px solid #303030;background:#101010;';
    subRow.onmouseover = function () { subRow.style.background = '#151515'; };
    subRow.onmouseout  = function () { subRow.style.background = '#101010'; };

    // set to [input] go
    var setLbl = document.createElement('span');
    setLbl.textContent = 'set rank';
    setLbl.style.cssText = ILBL;
    subRow.appendChild(setLbl);

    var setInput = document.createElement('input');
    setInput.type = 'text';
    setInput.style.cssText = IINPUT;
    setInput.placeholder = '\u2014';
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

    // +/- [input] + -
    var deltaLbl = document.createElement('span');
    deltaLbl.textContent = 'change by';
    deltaLbl.style.cssText = ILBL;
    subRow.appendChild(deltaLbl);

    var deltaInput = document.createElement('input');
    deltaInput.type = 'text';
    deltaInput.style.cssText = IINPUT;
    deltaInput.placeholder = '\u2014';
    subRow.appendChild(deltaInput);

    [1, -1].forEach(function (sign) {
      var b = document.createElement('button');
      b.textContent = sign > 0 ? '+' : '\u2212';
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
    var quickLbl = document.createElement('span');
    quickLbl.textContent = 'quick set';
    quickLbl.style.cssText = ILBL;
    subRow.appendChild(quickLbl);

    [['0', 0], ['1x', unit], ['2x', unit * 2], ['3x', unit * 3], ['max', maxRank]].forEach(function (pair) {
      var b = document.createElement('button');
      b.textContent = pair[0];
      b.type = 'button';
      b.style.cssText = IBTN;
      b.addEventListener('click', function () { if (pair[0] !== 'max' || maxRank > 0) setSkillTo(sk.id, pair[1], maxRank); });
      subRow.appendChild(b);
    });

    list.appendChild(subRow);
    });
  });
  ov.appendChild(list);

  var ftr = document.createElement('div');
  ftr.style.cssText = M + 'padding:14px 20px;border-top:1px solid #2e2e2e;'
    + 'display:flex;justify-content:flex-end;flex-shrink:0;';

  var submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Training';
  submitBtn.type = 'button';
  submitBtn.style.cssText = M + 'background:#c8a84a;border:none;color:#141414;'
    + 'font-size:13px;font-weight:bold;padding:9px 22px;cursor:pointer;letter-spacing:1px;';
  submitBtn.addEventListener('click', function () {
    ov.remove();
    var s = document.querySelector('input[type=submit],button[type=submit]');
    if (s) s.click(); else if (document.forms[0]) document.forms[0].submit();
  });
  ftr.appendChild(submitBtn);
  ov.appendChild(ftr);

  document.body.appendChild(ov);
}

  turboTrainer();
}());
