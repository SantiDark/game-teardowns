/* ------------------------------------------------------------------
   Game Teardowns - design diary
   Routes:  #/diary          games in the diary, add a game, patterns
            #/diary/<id>     one game: log moments, curve, make a draft

   A diary for players who want to notice why a game works: each
   moment records what happened, the feeling, the cause and how
   intense it was. Saved only in this browser (localStorage "gt-diary").
------------------------------------------------------------------- */
(function () {
  'use strict';

  var GT = window.GT;
  if (!GT || !GT.ed) return;
  var esc = GT.esc, icon = GT.icon, pad2 = GT.pad2, plural = GT.plural, all = GT.all, clone = GT.clone, ed = GT.ed;
  var LAYERS = GT.LAYERS;
  var SITE = 'Game Teardowns';
  var app = document.getElementById('app');
  var KEY = 'gt-diary';
  var STATUS = [['playing', 'Playing'], ['finished', 'Finished'], ['dropped', 'Dropped'], ['planned', 'Want to play']];
  var FEELINGS = ['Tension', 'Relief', 'Curiosity', 'Mastery', 'Frustration', 'Surprise', 'Fear', 'Pride', 'Wonder', 'Attachment', 'Satisfaction', 'Boredom'];

  /* ---------- storage ---------- */
  function read() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && Array.isArray(d.games)) {
        d.games = d.games.filter(function (g) { return g && typeof g.id === 'string' && typeof g.title === 'string'; });
        d.games.forEach(function (g) { if (!Array.isArray(g.moments)) g.moments = []; });
        return d;
      }
    } catch (e) { /* blocked or broken storage */ }
    return { v: 1, games: [] };
  }
  var DATA = read();
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(DATA)); return true; } catch (e) { return false; }
  }
  /* run a change; if the browser refuses to store it, undo it */
  function commit(change) {
    var before = clone(DATA);
    change();
    if (!write()) { DATA = before; return false; }
    return true;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function find(id) { return DATA.games.filter(function (g) { return g.id === id; })[0] || null; }
  function filled(s) { return typeof s === 'string' && s.trim() !== ''; }
  function day(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function statusLabel(s) { for (var i = 0; i < STATUS.length; i++) if (STATUS[i][0] === s) return STATUS[i][1]; return 'Playing'; }
  function curveOf(d) { return { pacing: { points: d.moments.map(function (m) { return { phase: m.feeling || '', v: m.v }; }) } }; }
  function short(s, n) { var w = String(s).trim().split(/\s+/); return w.slice(0, n).join(' ') + (w.length > n ? '…' : ''); }
  /* a published or local teardown of the same game, if there is one */
  function libraryMatch(d) {
    var slug = ed.slugify(d.title), wd = d.source && d.source.wikidata;
    return GT.store.games().filter(function (g) {
      return g.slug === d.lib || g.slug === slug || (wd && g.source && g.source.wikidata === wd);
    })[0] || null;
  }

  /* the curve of one diary game: one point per moment, in order */
  function chartSVG(ms) {
    var compact = GT.compactMQ.matches, f1 = GT.f1;
    var W = compact ? 360 : 640, H = compact ? 220 : 240, L = 26, R = 18, T = 30, B = compact ? 30 : 48;
    var n = ms.length, iw = W - L - R, ih = H - T - B;
    function X(i) { return L + (i * iw) / (n - 1); }
    function Y(v) { return T + (1 - GT.clamp(v, 0, 10) / 10) * ih; }
    var xy = ms.map(function (m, i) { return [X(i), Y(m.v)]; });
    var line = GT.smooth(xy, T, H - B);
    var area = line + ' L' + f1(X(n - 1)) + ' ' + Y(0) + ' L' + f1(X(0)) + ' ' + Y(0) + ' Z';
    var pk = 0;
    ms.forEach(function (m, i) { if (m.v > ms[pk].v) pk = i; });
    var grid = [0, 5, 10].map(function (v) {
      return '<line class="' + (v ? 'ch-grid-dash' : 'ch-grid') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(v)) + '" y2="' + f1(Y(v)) + '"/>' +
        (v === 5 ? '' : '<text class="ch-label" x="' + (L - 8) + '" y="' + f1(Y(v) + 3.5) + '" text-anchor="end">' + v + '</text>');
    }).join('');
    var showWords = !compact && n <= 8;
    var pts = ms.map(function (m, i) {
      var x = f1(X(i)), y = f1(Y(m.v)), on = i === pk;
      return '<circle cx="' + x + '" cy="' + y + '" r="' + (on ? 5.5 : 4) + '" class="ch-dot ch-c0"' + (on ? ' style="fill:var(--accent-hi)"' : '') + '/>' +
        '<text class="ch-label" x="' + x + '" y="' + f1(Y(m.v) - 11) + '" text-anchor="middle"' + (on ? ' style="fill:var(--accent)"' : '') + '>' + esc(m.v) + '</text>' +
        '<text class="ch-label" x="' + x + '" y="' + (H - B + 18) + '" text-anchor="middle">' + pad2(i + 1) + '</text>' +
        (showWords && filled(m.feeling) ? '<text class="ch-label dg-word" x="' + x + '" y="' + (H - B + 33) + '" text-anchor="middle">' + esc(short(m.feeling, 2).toUpperCase()) + '</text>' : '');
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Intensity of ' + plural(n, 'moment', 'moments') + ', from ' +
      esc(ms[0].v) + ' to ' + esc(ms[n - 1].v) + ', peak ' + esc(ms[pk].v) + ' at moment ' + (pk + 1) + '.">' +
      '<defs><linearGradient id="dg-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ch-fill-stop-a"/><stop offset="1" class="ch-fill-stop-b"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#dg-fill)"/><path class="ch-line ch-c0" d="' + line + '"/>' + pts + '</svg>';
  }

  function band(crumbs, eyebrow, title, text, side, extra) {
    return '<div class="band"><div class="wrap band-in">' +
      '<nav class="crumbs" aria-label="Breadcrumb">' + crumbs + '</nav>' +
      '<div class="band-grid"><div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(eyebrow) + '</p>' +
      '<h1 id="page-h">' + esc(title) + '</h1>' + (text ? '<p class="hook">' + text + '</p>' : '') + (extra || '') + '</div>' + (side || '') + '</div></div></div>';
  }

  /* ================================================================
     DIARY HOME  #/diary
  ================================================================ */
  var filter = '';
  function diaryHome() {
    document.title = 'My diary | ' + SITE;
    var moments = DATA.games.reduce(function (a, g) { return a + g.moments.length; }, 0);
    var count = function (s) { return DATA.games.filter(function (g) { return g.status === s; }).length; };
    var side = '<aside class="glance" aria-label="Your diary in numbers"><dl>' +
      '<div><dt>Games</dt><dd>' + DATA.games.length + '</dd></div><div><dt>Moments</dt><dd>' + moments + '</dd></div>' +
      '<div><dt>Playing now</dt><dd>' + count('playing') + '</dd></div><div><dt>Finished</dt><dd>' + count('finished') + '</dd></div></dl></aside>';
    var lib = GT.store.games().filter(function (g) { return !DATA.games.some(function (d) { return d.lib === g.slug; }); });

    app.innerHTML = band('<a href="#/">Teardowns</a>' + icon('chevron') + '<span aria-current="page">Diary</span>',
      'For players · saved in this browser', 'My design diary',
      'Log the games you play and the moments that hit you: what happened, what you felt and what caused it. Your notes draw a pacing curve and can become a teardown draft.', side) +
      '<div class="wrap page-body"><div class="dy-grid">' +
      '<section class="dy-main" aria-labelledby="dy-h">' +
      '<div class="block-head"><div><p class="eyebrow">Library</p><h2 id="dy-h" tabindex="-1">Your games</h2></div>' +
      (DATA.games.length ? '<div class="chips" role="group" aria-label="Filter by status"><button type="button" class="chip" data-st="" aria-pressed="' + (!filter) + '">All</button>' +
        STATUS.map(function (s) { return '<button type="button" class="chip" data-st="' + s[0] + '" aria-pressed="' + (filter === s[0]) + '">' + s[1] + '<span class="n">' + count(s[0]) + '</span></button>'; }).join('') + '</div>' : '') +
      '</div>' +
      (DATA.games.length ? '<ul class="dcards" id="dcards"></ul><p class="notice" id="dy-none" hidden>No game with this status.</p>'
        : '<div class="p-empty card"><span class="layer-ic" aria-hidden="true">' + icon('diary') + '</span><div><h2>Your diary is empty</h2>' +
          '<p>Add the game you are playing. While you play, note the moments that stand out: a scare, a small win, a fight you wanted to quit. After a few sessions you will see the shape of the game, and what keeps you playing.</p></div></div>') +
      patternsHTML() +
      '</section>' +

      '<aside class="dy-side" aria-labelledby="add-h"><div class="card new-card">' +
      '<h2 id="add-h">Add a game</h2><p>Search Wikidata to fill in the studio and year.</p>' + ed.wdHTML('dy') +
      '<div class="dy-or"><span>or</span></div>' +
      '<form id="dy-title-form" class="dy-mini" novalidate><label class="fld-l" for="dy-title">Add by title only</label>' +
      '<div class="wd-row"><input class="inp" id="dy-title" type="text" autocomplete="off"><button class="btn" type="submit">' + icon('plus') + 'Add</button></div></form>' +
      (lib.length ? '<form id="dy-lib-form" class="dy-mini" novalidate><label class="fld-l" for="dy-lib">From the teardowns</label>' +
        '<div class="wd-row"><select class="inp" id="dy-lib">' + lib.map(function (g) { return '<option value="' + esc(g.slug) + '">' + esc(g.title) + '</option>'; }).join('') + '</select>' +
        '<button class="btn" type="submit">' + icon('plus') + 'Add</button></div></form>' : '') +
      '<p class="wd-msg" id="dy-msg" role="status"></p>' +
      '<p class="dy-note">' + icon('alert') + '<span>The diary is saved only in this browser. Clearing the browser data deletes it.</span></p>' +
      '</div></aside></div></div>';

    /* list + filter */
    var list = document.getElementById('dcards'), none = document.getElementById('dy-none');
    function draw() {
      if (!list) return;
      var shown = DATA.games.filter(function (g) { return !filter || g.status === filter; })
        .sort(function (a, b) { return String(b.updated || '').localeCompare(String(a.updated || '')); });
      list.innerHTML = shown.map(cardHTML).join('');
      none.hidden = shown.length > 0;
    }
    all('[data-st]', app).forEach(function (c) {
      c.addEventListener('click', function () {
        filter = c.getAttribute('data-st');
        all('[data-st]', app).forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        draw();
      });
    });
    draw();

    /* adding */
    var msg = document.getElementById('dy-msg');
    function add(entry, m) {
      var dup = DATA.games.filter(function (g) {
        return ed.slugify(g.title) === ed.slugify(entry.title) || (entry.source && g.source && g.source.wikidata === entry.source.wikidata);
      })[0];
      if (dup) { location.hash = '#/diary/' + dup.id; return; }
      var now = new Date().toISOString();
      entry.id = uid(); entry.status = 'playing'; entry.added = now; entry.updated = now; entry.moments = [];
      if (!commit(function () { DATA.games.push(entry); })) { (m || msg).textContent = 'This browser did not allow saving. Storage may be full or blocked.'; return; }
      location.hash = '#/diary/' + entry.id;
    }
    ed.initWD(app, 'dy', 'Add to my diary', function (it, m) {
      var g = ed.blankGame();
      ed.applyInfo(g, it, false);
      add({ title: g.title, studio: g.studio, year: g.year, genre: g.genre, source: g.source }, m);
    });
    document.getElementById('dy-title-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var t = document.getElementById('dy-title').value.trim();
      if (!t) { msg.textContent = 'Type the title of the game.'; document.getElementById('dy-title').focus(); return; }
      add({ title: t, studio: '', year: '', genre: '' });
    });
    var lf = document.getElementById('dy-lib-form');
    if (lf) lf.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = GT.store.games().filter(function (x) { return x.slug === document.getElementById('dy-lib').value; })[0];
      if (g) add({ title: g.title, studio: g.studio, year: GT.shortYear(g.year), genre: g.genre, lib: g.slug, source: g.source ? clone(g.source) : undefined });
    });
    return 'diary';
  }

  function cardHTML(d, i) {
    var n = d.moments.length;
    return '<li><a class="dcard" href="#/diary/' + encodeURIComponent(d.id) + '">' +
      '<div class="gthumb dthumb">' + (n >= 2 ? GT.thumbSVG(curveOf(d), 'dc' + i) : '<span class="ed-ph">' + (n ? 'One moment so far' : 'No moments yet') + '</span>') + '</div>' +
      '<div class="dcard-b"><p class="ed-st"><span class="badge st-' + esc(d.status) + '">' + statusLabel(d.status) + '</span></p>' +
      '<h3>' + esc(d.title) + '</h3>' +
      ([d.studio, d.year].filter(filled).length ? '<p class="gmeta">' + [d.studio, d.year].filter(filled).map(esc).join('<span class="sep" aria-hidden="true"></span>') + '</p>' : '') +
      '<p class="dcard-f">' + plural(n, 'MOMENT', 'MOMENTS') + (d.updated ? ' · ' + esc(day(d.updated).toUpperCase()) : '') + '</p></div></a></li>';
  }

  /* what the notes say across every game */
  function patternsHTML() {
    var ms = [];
    DATA.games.forEach(function (g) { g.moments.forEach(function (m) { ms.push({ m: m, g: g }); }); });
    if (ms.length < 3) {
      return '<section class="block dy-pat" aria-labelledby="pat-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Patterns</p><h2 id="pat-h">What keeps you playing</h2>' +
        '<p class="sub">After three moments, this shows the feelings you note most, which layers cause them and your most intense moments.</p></div></div></section>';
    }
    function tally(fn) {
      var map = {}, label = {};
      ms.forEach(function (x) { var v = fn(x.m); if (!filled(v)) return; var k = v.trim().toLowerCase(); map[k] = (map[k] || 0) + 1; label[k] = label[k] || ed.cap(v.trim()); });
      return Object.keys(map).map(function (k) { return { k: label[k], n: map[k] }; }).sort(function (a, b) { return b.n - a.n; });
    }
    function bars(list, total) {
      if (!list.length) return '<p class="muted">Nothing noted yet.</p>';
      var max = list[0].n;
      return '<ol class="pbars">' + list.slice(0, 6).map(function (x) {
        return '<li><span class="nm">' + esc(x.k) + '</span><span class="sbar" aria-hidden="true"><b style="width:' + Math.round((x.n / max) * 100) + '%"></b></span>' +
          '<span class="v">' + x.n + '<span class="sr"> of ' + total + '</span></span></li>';
      }).join('') + '</ol>';
    }
    var feel = tally(function (m) { return m.feeling; });
    var layer = tally(function (m) { return m.layer; });
    var cause = tally(function (m) { return m.cause; });
    var top = ms.slice().sort(function (a, b) { return b.m.v - a.m.v; }).slice(0, 3);
    var avg = ms.reduce(function (a, x) { return a + x.m.v; }, 0) / ms.length;
    return '<section class="block dy-pat" aria-labelledby="pat-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Patterns</p><h2 id="pat-h">What keeps you playing</h2>' +
      '<p class="sub">Read across ' + plural(ms.length, 'moment', 'moments') + ' in ' + plural(DATA.games.length, 'game', 'games') + '. Average intensity ' + (Math.round(avg * 10) / 10) + ' of 10.</p></div></div>' +
      '<div class="pat-grid">' +
      '<div class="card pat"><h3>' + icon('star') + 'Feelings you note most</h3>' + bars(feel, ms.length) + '</div>' +
      '<div class="card pat"><h3>' + icon('System') + 'Layers that cause them</h3>' + bars(layer, ms.length) + '</div>' +
      '<div class="card pat"><h3>' + icon('Mechanic') + 'Causes that repeat</h3>' + bars(cause, ms.length) + '</div>' +
      '<div class="card pat"><h3>' + icon('gauge') + 'Your most intense moments</h3><ol class="ptop">' + top.map(function (x) {
        return '<li><span class="v">' + esc(x.m.v) + '</span><span><a href="#/diary/' + encodeURIComponent(x.g.id) + '">' + esc(x.g.title) + '</a>' +
          '<span class="t">' + esc(short(x.m.text, 14)) + '</span></span></li>';
      }).join('') + '</ol></div></div></section>';
  }

  /* ================================================================
     ONE GAME  #/diary/<id>
  ================================================================ */
  function diaryGame(id) {
    var d = find(id);
    if (!d) {
      document.title = 'Not found | ' + SITE;
      app.innerHTML = band('<a href="#/diary">Diary</a>' + icon('chevron') + '<span aria-current="page">Not found</span>', 'Diary', 'Not found',
        'This game is not in the diary of this browser.') +
        '<div class="wrap page-body"><a class="btn btn-primary" href="#/diary">' + icon('back') + 'Back to my diary</a></div>';
      return 'diary';
    }
    document.title = d.title + ' | My diary | ' + SITE;
    var lib = libraryMatch(d);
    var editing = null;          /* id of the moment being edited */
    var meta = [d.studio, d.year, d.genre].filter(filled);

    var statusHTML = '<fieldset class="seg" id="dg-status"><legend class="sr">Status</legend>' + STATUS.map(function (s) {
      return '<label><input type="radio" name="dg-st" value="' + s[0] + '"' + (d.status === s[0] ? ' checked' : '') + '><span>' + s[1] + '</span></label>';
    }).join('') + '</fieldset>';

    app.innerHTML = band('<a href="#/diary">Diary</a>' + icon('chevron') + '<span aria-current="page">' + esc(d.title) + '</span>',
      meta.length ? meta.join(' · ') : 'In my diary', d.title, '', '', statusHTML) +
      '<div class="wrap page-body"><div class="dg-grid">' +

      '<div class="dg-main">' +
      '<section class="card dg-curve" aria-labelledby="cv-h"><div class="pace-head"><h2 id="cv-h">Intensity across your moments</h2><span class="mono">0 CALM → 10 PEAK</span></div>' +
      '<div id="dg-chart"></div><div class="dg-stats" id="dg-stats"></div></section>' +
      '<section class="dg-list" aria-labelledby="ml-h"><div class="block-head"><div><p class="eyebrow">Timeline</p><h2 id="ml-h" tabindex="-1">Moments</h2></div></div>' +
      '<div id="dg-moments"></div></section>' +
      '</div>' +

      '<aside class="dg-side">' +
      '<form class="card mform" id="m-form" novalidate aria-labelledby="mf-h">' +
      '<h2 id="mf-h">Note a moment</h2>' +
      '<div class="fgrid">' +
      '<div class="fld"><label class="fld-l" for="m-text">What happened<span class="req" aria-hidden="true">*</span></label>' +
      '<textarea class="inp" id="m-text" rows="3" aria-required="true" placeholder="The boss phase changed when I was almost out of healing"></textarea></div>' +
      '<div class="fld half"><label class="fld-l" for="m-feel">What you felt</label><input class="inp" id="m-feel" list="m-feels" autocomplete="off" placeholder="Tension">' +
      '<datalist id="m-feels"></datalist></div>' +
      '<div class="fld half"><label class="fld-l" for="m-v">Intensity <output id="m-vo" for="m-v">5</output><span class="muted"> / 10</span></label>' +
      '<input class="range" type="range" id="m-v" min="0" max="10" step="1" value="5"></div>' +
      '<div class="fld"><label class="fld-l" for="m-cause">What caused it</label><input class="inp" id="m-cause" list="m-causes" autocomplete="off" aria-describedby="m-cause-h" placeholder="Stamina">' +
      '<datalist id="m-causes"></datalist><p class="fld-h" id="m-cause-h">The system or mechanic behind it, if you can tell.</p></div>' +
      '<div class="fld"><label class="fld-l" for="m-layer">Layer</label><select class="inp" id="m-layer"><option value="">Not sure</option>' +
      LAYERS.map(function (l) { return '<option>' + esc(l.id) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="mform-btns"><button class="btn btn-primary" type="submit" id="m-submit">' + icon('plus') + 'Add moment</button>' +
      '<button class="btn" type="button" id="m-cancel" hidden>Cancel</button></div>' +
      '<p class="wd-msg" id="m-msg" role="status"></p></form>' +

      '<section class="card new-card" aria-labelledby="td-h" id="dg-td"></section>' +
      '<div class="ed-more"><button type="button" class="btn btn-sm btn-danger" id="dg-delete">' + icon('trash') + 'Remove from diary</button></div>' +
      '</aside></div></div>';

    var chart = document.getElementById('dg-chart'), stats = document.getElementById('dg-stats');
    var listEl = document.getElementById('dg-moments'), td = document.getElementById('dg-td');
    var form = document.getElementById('m-form'), msg = document.getElementById('m-msg');
    var fText = document.getElementById('m-text'), fFeel = document.getElementById('m-feel'), fV = document.getElementById('m-v');
    var fVo = document.getElementById('m-vo'), fCause = document.getElementById('m-cause'), fLayer = document.getElementById('m-layer');
    var submit = document.getElementById('m-submit'), cancel = document.getElementById('m-cancel');

    function touch() { d.updated = new Date().toISOString(); }
    function suggestions() {
      var feels = FEELINGS.slice(), causes = [];
      d.moments.forEach(function (m) {
        if (filled(m.feeling) && feels.indexOf(ed.cap(m.feeling)) < 0) feels.unshift(ed.cap(m.feeling));
        if (filled(m.cause) && causes.indexOf(m.cause) < 0) causes.push(m.cause);
      });
      if (lib) lib.systems.forEach(function (s) { if (causes.indexOf(s.name) < 0) causes.push(s.name); });
      document.getElementById('m-feels').innerHTML = feels.map(function (f) { return '<option value="' + esc(f) + '">'; }).join('');
      document.getElementById('m-causes').innerHTML = causes.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
    }
    function paint() {
      var ms = d.moments, n = ms.length;
      chart.innerHTML = n >= 2 ? chartSVG(ms) :
        '<p class="dg-empty">' + (n ? 'Note one more moment to draw the curve.' : 'Note at least two moments to draw the curve.') + '</p>';
      if (n) {
        var peak = ms.reduce(function (a, m) { return m.v > a.v ? m : a; }, ms[0]);
        var avg = Math.round((ms.reduce(function (a, m) { return a + m.v; }, 0) / n) * 10) / 10;
        stats.innerHTML = '<dl><div><dt>Moments</dt><dd>' + n + '</dd></div><div><dt>Average</dt><dd>' + avg + '</dd></div>' +
          '<div><dt>Peak</dt><dd>' + esc(peak.v) + '<small>' + esc(short(peak.feeling || peak.text, 3)) + '</small></dd></div></dl>';
      } else stats.innerHTML = '';

      listEl.innerHTML = n ? '<ol class="moments">' + ms.map(function (m, i) {
        var bits = [];
        if (filled(m.feeling)) bits.push('<span class="mchip"><span class="k">Felt</span>' + esc(m.feeling) + '</span>');
        if (filled(m.cause)) bits.push('<span class="mchip"><span class="k">Cause</span>' + esc(m.cause) + '</span>');
        if (filled(m.layer)) bits.push('<span class="mchip">' + GT.layerDots(m.layer) + esc(m.layer) + '</span>');
        var meter = '';
        for (var k = 1; k <= 10; k++) meter += '<i' + (k <= m.v ? ' class="on"' : '') + '></i>';
        var what = 'moment ' + (i + 1);
        return '<li class="moment' + (editing === m.id ? ' is-editing' : '') + '"><span class="m-n">' + pad2(i + 1) + '</span>' +
          '<div class="m-body"><p class="m-text">' + esc(m.text) + '</p>' +
          '<div class="m-meta"><span class="meter" aria-label="Intensity ' + esc(m.v) + ' of 10">' + meter + '</span><span class="m-v">' + esc(m.v) + '/10</span>' + bits.join('') + '</div>' +
          (m.at ? '<p class="m-at">' + esc(day(m.at)) + '</p>' : '') + '</div>' +
          '<span class="rep-tools">' +
          '<button type="button" class="ib" data-m="up" data-i="' + i + '" aria-label="Move ' + what + ' up"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
          '<button type="button" class="ib" data-m="down" data-i="' + i + '" aria-label="Move ' + what + ' down"' + (i === n - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
          '<button type="button" class="ib" data-m="edit" data-i="' + i + '" aria-label="Edit ' + what + '">' + icon('edit') + '</button>' +
          '<button type="button" class="ib" data-m="remove" data-i="' + i + '" aria-label="Delete ' + what + '">' + icon('trash') + '</button></span></li>';
      }).join('') + '</ol>'
        : '<p class="rep-empty">No moments yet. Use the form to note the first one, ideally right after it happens.</p>';

      var made = d.teardown && GT.store.entry(d.teardown);
      td.innerHTML = '<h2 id="td-h">Turn it into a teardown</h2>' +
        (made ? '<p>A teardown draft was made from this diary. New moments are not added to it automatically.</p>' +
          '<a class="btn" href="#/edit/' + encodeURIComponent(d.teardown) + '">' + icon('edit') + 'Open the draft</a>'
          : '<p>Creates a draft in the editor. Your moments become its pacing curve and every cause becomes a system for you to describe.</p>' +
          '<button type="button" class="btn" id="dg-make"' + (n ? '' : ' disabled') + '>' + icon('arrow') + 'Create teardown draft</button>' +
          (n ? '' : '<p class="fld-h">Note at least one moment first.</p>')) +
        (lib ? '<p class="dg-lib">' + icon('learn') + '<span>There is a teardown of this game: <a href="#/game/' + encodeURIComponent(lib.slug) + '">' + esc(lib.title) + '</a>. Compare your notes with it.</span></p>' : '');
      var mk = document.getElementById('dg-make');
      if (mk) mk.addEventListener('click', makeDraft);
      suggestions();
    }
    function resetForm() {
      editing = null;
      form.reset(); fVo.textContent = '5';
      document.getElementById('mf-h').textContent = 'Note a moment';
      submit.innerHTML = icon('plus') + 'Add moment';
      cancel.hidden = true;
    }

    fV.addEventListener('input', function () { fVo.textContent = fV.value; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = fText.value.trim();
      if (!text) { msg.textContent = 'Write what happened first.'; fText.focus(); return; }
      var m = { text: text, feeling: fFeel.value.trim(), cause: fCause.value.trim(), layer: fLayer.value, v: Number(fV.value) };
      var wasEditing = editing;
      var ok = commit(function () {
        if (wasEditing) {
          var cur = d.moments.filter(function (x) { return x.id === wasEditing; })[0];
          if (cur) { cur.text = m.text; cur.feeling = m.feeling; cur.cause = m.cause; cur.layer = m.layer; cur.v = m.v; }
        } else {
          m.id = uid(); m.at = new Date().toISOString();
          d.moments.push(m);
          if (d.status === 'planned') d.status = 'playing';
        }
        touch();
      });
      if (!ok) { msg.textContent = 'This browser did not allow saving. Storage may be full or blocked.'; return; }
      resetForm(); paint();
      msg.textContent = wasEditing ? 'Moment updated.' : 'Moment ' + d.moments.length + ' added.';
      syncStatus();
      fText.focus();
    });
    cancel.addEventListener('click', function () { resetForm(); paint(); msg.textContent = 'Edit cancelled.'; fText.focus(); });

    listEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]');
      if (!b) return;
      var act = b.getAttribute('data-m'), i = Number(b.getAttribute('data-i')), m = d.moments[i];
      if (act === 'edit') {
        editing = m.id;
        fText.value = m.text; fFeel.value = m.feeling || ''; fCause.value = m.cause || ''; fLayer.value = m.layer || '';
        fV.value = m.v; fVo.textContent = m.v;
        document.getElementById('mf-h').textContent = 'Edit moment ' + (i + 1);
        submit.innerHTML = icon('check') + 'Save moment';
        cancel.hidden = false;
        paint();
        form.scrollIntoView({ block: 'nearest', behavior: GT.reduceMotion.matches ? 'auto' : 'smooth' });
        fText.focus();
        return;
      }
      if (act === 'remove' && !confirm('Delete moment ' + (i + 1) + '? This cannot be undone.')) return;
      var j = act === 'up' ? i - 1 : i + 1;
      var ok = commit(function () {
        if (act === 'remove') d.moments.splice(i, 1);
        else { var t = d.moments[i]; d.moments[i] = d.moments[j]; d.moments[j] = t; }
        touch();
      });
      if (!ok) { msg.textContent = 'This browser did not allow the change.'; return; }
      if (act === 'remove' && editing === m.id) resetForm();
      paint();
      if (act === 'remove') { msg.textContent = 'Moment deleted.'; document.getElementById('ml-h').focus(); }
      else {
        var mv = listEl.querySelector('[data-m="' + act + '"][data-i="' + j + '"]');
        if (!mv || mv.disabled) mv = listEl.querySelector('[data-m="' + (act === 'up' ? 'down' : 'up') + '"][data-i="' + j + '"]');
        if (mv) mv.focus();
      }
    });

    function syncStatus() {
      all('#dg-status input', app).forEach(function (r) { r.checked = r.value === d.status; });
    }
    all('#dg-status input', app).forEach(function (r) {
      r.addEventListener('change', function () {
        var before = d.status;
        if (!commit(function () { d.status = r.value; touch(); })) { d.status = before; syncStatus(); msg.textContent = 'This browser did not allow the change.'; }
      });
    });
    document.getElementById('dg-delete').addEventListener('click', function () {
      if (!confirm('Remove "' + d.title + '" and its ' + plural(d.moments.length, 'moment', 'moments') + ' from the diary? This cannot be undone.')) return;
      if (!commit(function () { DATA.games = DATA.games.filter(function (g) { return g !== d; }); })) { msg.textContent = 'This browser did not allow the change.'; return; }
      location.hash = '#/diary';
    });

    /* moments -> teardown draft in the editor */
    function makeDraft() {
      var g = ed.blankGame(), ms = d.moments;
      g.title = d.title; g.studio = d.studio || ''; g.year = d.year || ''; g.genre = d.genre || '';
      if (d.source) g.source = clone(d.source);
      if (ms.length) {
        g.pacing.label = 'Intensity of the moments I noted while playing, in the order they happened. My own reading, not a measurement.';
        g.pacing.points = ms.map(function (m) {
          return { phase: filled(m.feeling) ? ed.cap(m.feeling.trim()) : short(m.text, 4), v: m.v, note: m.text };
        });
        while (g.pacing.points.length < 3) g.pacing.points.push({ phase: '', v: '', note: '' });
      }
      var causes = [];
      ms.forEach(function (m) {
        if (!filled(m.cause)) return;
        var c = causes.filter(function (x) { return x.name.toLowerCase() === m.cause.trim().toLowerCase(); })[0];
        if (!c) { c = { name: m.cause.trim(), layer: m.layer, feel: [] }; causes.push(c); }
        if (!c.layer && m.layer) c.layer = m.layer;
        if (filled(m.feeling) && c.feel.indexOf(m.feeling.trim().toLowerCase()) < 0) c.feel.push(m.feeling.trim().toLowerCase());
      });
      if (causes.length) {
        g.systems = causes.map(function (c) {
          return { name: c.name, layer: c.layer || LAYERS[0].id, what: '', why: '', effect: c.feel.length ? 'In my notes: ' + c.feel.join(', ') + '.' : '' };
        });
      }
      g.slug = ed.uniqueSlug(ed.slugify(g.title) || 'new-teardown');
      if (!GT.store.save(g, null)) { msg.textContent = 'This browser did not allow saving the draft.'; return; }
      commit(function () { d.teardown = g.slug; touch(); });
      location.hash = '#/edit/' + encodeURIComponent(g.slug);
    }

    /* redraw the curve when crossing the compact breakpoint */
    function onMQ() { if (d.moments.length >= 2) chart.innerHTML = chartSVG(d.moments); }
    if (GT.compactMQ.addEventListener) GT.compactMQ.addEventListener('change', onMQ);
    GT.onLeave(function () { if (GT.compactMQ.removeEventListener) GT.compactMQ.removeEventListener('change', onMQ); });

    paint();
    return 'diary';
  }

  GT.view('diary', function (p) { return p[1] ? diaryGame(p[1]) : diaryHome(); });
})();
