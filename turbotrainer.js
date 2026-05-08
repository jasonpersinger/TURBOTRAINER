(function () {
var TURBOTRAINER_VERSION = 'v0.3.0';

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
  var density = (function () {
    try { return localStorage.getItem('tt-density') || 'comfortable'; }
    catch (e) { return 'comfortable'; }
  })();
  var compact = density === 'compact';
  var pagePad = compact ? '16px' : '24px';
  var blockGap = compact ? '8px' : '12px';
  var topPad = compact ? '8px 16px' : '12px 24px';
  var controlPad = compact ? '8px 16px 10px' : '10px 24px 14px';
  var primaryBtnPad = compact ? '6px 10px' : '8px 12px';
  var quietBtnPad = compact ? '5px 9px' : '7px 11px';
  var inputPad = compact ? '5px 7px' : '7px 8px';

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

  var densityBtn = document.createElement('button');
  densityBtn.textContent = compact ? 'comfortable' : 'compact';
  densityBtn.type = 'button';
  densityBtn.style.cssText = M + 'background:#202020;border:1px solid #444;color:#aaa;'
    + 'font-size:12px;padding:7px 12px;cursor:pointer;letter-spacing:1px;';
  densityBtn.addEventListener('click', function () {
    try { localStorage.setItem('tt-density', compact ? 'comfortable' : 'compact'); } catch (e) {}
    ov.remove();
    turboTrainer();
  });
  hdrTop.appendChild(densityBtn);

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
  list.style.cssText = 'flex:1;overflow:auto;background:#101010;padding-bottom:' + blockGap + ';';

  var ILBL = M + 'color:#777;font-size:11px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0;';
  var IINPUT = M + 'width:66px;background:#1c1c1c;border:1px solid #4b4b4b;color:#e0e0e0;'
    + 'font-size:12px;padding:' + inputPad + ';text-align:center;';
  var QUIET_BTN = M + 'min-width:42px;background:#202020;border:1px solid #444;color:#bbb;'
    + 'font-size:12px;padding:' + quietBtnPad + ';cursor:pointer;letter-spacing:1px;';

  var makeMeta = function (label, value, id, strong) {
    var wrap = document.createElement('span');
    wrap.style.cssText = M + 'display:inline-flex;align-items:center;gap:6px;background:#101010;'
      + 'border:1px solid #2c2c2c;padding:5px 9px;min-width:86px;justify-content:space-between;';
    var key = document.createElement('span');
    key.textContent = label;
    key.style.cssText = 'color:#777;font-size:10px;letter-spacing:1px;text-transform:uppercase;';
    var val = document.createElement('span');
    if (id) val.id = id;
    val.textContent = value;
    val.style.cssText = 'color:' + (strong ? '#f0f0f0' : '#b0b0b0') + ';font-size:13px;font-weight:' + (strong ? 'bold' : 'normal') + ';';
    wrap.appendChild(key);
    wrap.appendChild(val);
    return wrap;
  };

  var makeGroup = function (label) {
    var wrap = document.createElement('div');
    wrap.style.cssText = M + 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
    var lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.cssText = ILBL;
    wrap.appendChild(lbl);
    return wrap;
  };

  var makePrimaryButton = function (label, kind, onClick) {
    var b = document.createElement('button');
    b.textContent = label;
    b.type = 'button';
    b.style.cssText = M + 'min-width:48px;border:1px solid '
      + (kind === 'reduce' ? '#9a3333' : '#d6b653')
      + ';background:' + (kind === 'reduce' ? '#261111' : '#28210f')
      + ';color:' + (kind === 'reduce' ? '#e07068' : '#e2c86a')
      + ';font-size:12px;padding:' + primaryBtnPad + ';cursor:pointer;font-weight:bold;';
    b.addEventListener('click', onClick);
    return b;
  };

  var makeQuietButton = function (label, onClick) {
    var b = document.createElement('button');
    b.textContent = label;
    b.type = 'button';
    b.style.cssText = QUIET_BTN;
    b.addEventListener('click', onClick);
    return b;
  };

  categories.forEach(function (cat) {
    var catRow = document.createElement('div');
    catRow.style.cssText = M + 'padding:14px ' + pagePad + ' 10px;font-size:12px;letter-spacing:3px;'
      + 'text-transform:uppercase;color:#e0c05a;margin-top:' + blockGap + ';background:#1a1a1a;'
      + 'border-top:1px solid #343434;border-bottom:1px solid #343434;position:sticky;top:0;z-index:2;';
    catRow.textContent = cat.name;
    list.appendChild(catRow);

    cat.skills.forEach(function (sk, idx) {
    var baseBg = idx % 2 === 0 ? '#171717' : '#141414';
    var hoverBg = '#202020';
    var maxRank = parseInt(sk.max) || 0;

    var block = document.createElement('div');
    block.style.cssText = M + 'background:' + baseBg + ';border-bottom:1px solid #303030;';
    block.onmouseover = function () { block.style.background = hoverBg; };
    block.onmouseout  = function () { block.style.background = baseBg; };

    var refresh = function () {
      var src = document.getElementById('amt_skill' + sk.id);
      var dst = document.getElementById('tt-rank-' + sk.id);
      if (src && dst) dst.textContent = src.textContent.replace(/\u00a0/g, ' ').trim();
      refreshPoints();
    };

    var topLine = document.createElement('div');
    topLine.style.cssText = M + 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:' + topPad + ';';

    var nameEl = document.createElement('span');
    nameEl.textContent = sk.name;
    nameEl.style.cssText = 'flex:1;min-width:240px;font-size:' + (compact ? '14px' : '15px')
      + ';line-height:1.35;color:#e0e0e0;font-weight:bold;';
    topLine.appendChild(nameEl);

    topLine.appendChild(makeMeta('Rank', sk.rank, 'tt-rank-' + sk.id, true));
    topLine.appendChild(makeMeta('Cost', sk.cost, null, false));
    topLine.appendChild(makeMeta('Max', sk.max, null, false));
    topLine.appendChild(makeMeta('Recover', sk.recover, null, false));
    block.appendChild(topLine);

    var controlLine = document.createElement('div');
    controlLine.style.cssText = M + 'display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:' + controlPad
      + ';border-top:1px solid #242424;background:rgba(0,0,0,0.18);';

    var minusGrp = makeGroup('Reduce');
    [10, 5, 1].forEach(function (n) {
      minusGrp.appendChild(makePrimaryButton('-' + n, 'reduce', function () {
        for (var i = 0; i < n; i++) downskill(sk.id);
        refresh();
      }));
    });
    controlLine.appendChild(minusGrp);

    var plusGrp = makeGroup('Train');
    [1, 5, 10].forEach(function (n) {
      plusGrp.appendChild(makePrimaryButton('+' + n, 'train', function () {
        for (var i = 0; i < n; i++) upskill(sk.id);
        refresh();
      }));
    });
    controlLine.appendChild(plusGrp);

    var advanced = document.createElement('div');
    advanced.style.cssText = M + 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto;'
      + 'background:#111;border:1px solid #282828;padding:' + (compact ? '6px 8px' : '8px 10px') + ';';

    var setLbl = document.createElement('span');
    setLbl.textContent = 'set rank';
    setLbl.style.cssText = ILBL;
    advanced.appendChild(setLbl);

    var setInput = document.createElement('input');
    setInput.type = 'text';
    setInput.style.cssText = IINPUT;
    setInput.placeholder = '\u2014';
    advanced.appendChild(setInput);

    var goBtn = makeQuietButton('go', function () {
      var v = parseInt(setInput.value);
      if (!isNaN(v)) { setSkillTo(sk.id, v, maxRank); setInput.value = ''; }
    });
    setInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') goBtn.click();
    });
    advanced.appendChild(goBtn);

    var deltaLbl = document.createElement('span');
    deltaLbl.textContent = 'change by';
    deltaLbl.style.cssText = ILBL;
    advanced.appendChild(deltaLbl);

    var deltaInput = document.createElement('input');
    deltaInput.type = 'text';
    deltaInput.style.cssText = IINPUT;
    deltaInput.placeholder = '\u2014';
    advanced.appendChild(deltaInput);

    [1, -1].forEach(function (sign) {
      advanced.appendChild(makeQuietButton(sign > 0 ? '+' : '\u2212', function () {
        var v = parseInt(deltaInput.value);
        if (!isNaN(v)) {
          var src = document.getElementById('amt_skill' + sk.id);
          var cur = src ? (parseInt(src.textContent.replace(/\u00a0/g, ' ').trim()) || 0) : 0;
          setSkillTo(sk.id, cur + sign * v, maxRank);
        }
      }));
    });

    var quickLbl = document.createElement('span');
    quickLbl.textContent = 'quick set';
    quickLbl.style.cssText = ILBL;
    advanced.appendChild(quickLbl);

    [['0', 0], ['1x', unit], ['2x', unit * 2], ['3x', unit * 3], ['max', maxRank]].forEach(function (pair) {
      advanced.appendChild(makeQuietButton(pair[0], function () {
        if (pair[0] !== 'max' || maxRank > 0) setSkillTo(sk.id, pair[1], maxRank);
      }));
    });

    controlLine.appendChild(advanced);
    block.appendChild(controlLine);
    list.appendChild(block);
    });
  });
  ov.appendChild(list);

  var ftr = document.createElement('div');
  ftr.style.cssText = M + 'padding:14px 24px;border-top:1px solid #2e2e2e;'
    + 'display:flex;align-items:center;justify-content:space-between;gap:16px;flex-shrink:0;background:#181818;flex-wrap:wrap;';

  var versionEl = document.createElement('span');
  versionEl.textContent = TURBOTRAINER_VERSION + '  \u00b7  ' + density;
  versionEl.style.cssText = 'color:#666;font-size:11px;letter-spacing:1px;';
  ftr.appendChild(versionEl);

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
