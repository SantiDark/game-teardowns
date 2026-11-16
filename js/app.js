/* ------------------------------------------------------------------
   Game Teardowns - app
   Plain JavaScript, no build step. Hash routing, so it works on
   GitHub Pages and also when index.html is opened from a folder.

   Routes:  #/                          home
            #/game/<slug>[/<section>]   one teardown, optionally scrolled
                                        to overview, loop, systems,
                                        feedback, onboarding, pacing
                                        or takeaways
            #/compare                   side-by-side table
            #/method                    how a teardown is built

   Every diagram is an original SVG generated from js/data.js.
------------------------------------------------------------------- */
(function () {
  'use strict';

  var META = window.TEARDOWN_META || {};
  var SITE = 'Game Teardowns';
  var app = document.getElementById('app');
  var main = document.getElementById('main');
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var compactMQ = window.matchMedia ? window.matchMedia('(max-width: 600px)') : { matches: false };
  var cleanup = null;            /* teardown for listeners of the current view */
  var view = { name: null, slug: null };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function wrapWords(text, max) {
    var lines = [], cur = '';
    String(text).split(' ').forEach(function (w) {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
      else { cur = cur ? cur + ' ' + w : w; }
    });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }
  function gameHref(g, sec) { return '#/game/' + encodeURIComponent(g.slug) + (sec ? '/' + sec : ''); }
  function shortYear(y) { var m = String(y).match(/\d{4}/); return m ? m[0] : y; }
  function peakOf(g) {
    var best = 0;
    g.pacing.points.forEach(function (p, i) { if (p.v > g.pacing.points[best].v) best = i; });
    return best;
  }

  /* Catmull-Rom spline through points, as cubic Bezier commands.
     Control points are clamped so the curve never leaves the chart. */
  function smooth(pts, yMin, yMax) {
    if (pts.length < 3) return 'M' + pts.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join(' L');
    var d = 'M' + f1(pts[0][0]) + ' ' + f1(pts[0][1]);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = clamp(p1[1] + (p2[1] - p0[1]) / 6, yMin, yMax);
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = clamp(p2[1] - (p3[1] - p1[1]) / 6, yMin, yMax);
      d += ' C' + f1(c1x) + ' ' + f1(c1y) + ' ' + f1(c2x) + ' ' + f1(c2y) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d;
  }

  /* ---------- original icons (24px grid, stroked) ---------- */
  var ICON = {
    Mechanic: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8.5"/><path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3"/>',
    System: '<circle cx="6" cy="7" r="2.6"/><circle cx="18" cy="7" r="2.6"/><circle cx="12" cy="18" r="2.6"/><path d="M8.6 7h6.8M7.3 9.3l3.4 6.4M16.7 9.3l-3.4 6.4"/>',
    Content: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><path d="M17 13.8v6.4M13.8 17h6.4"/>',
    Narrative: '<path d="M4 5h16v10.5h-9.5L6 19.5v-4H4z"/><path d="M8 9h8M8 12h5"/>',
    Presentation: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/><path d="M10.2 7.8l4.3 2.45-4.3 2.45z"/>',
    visual: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    audio: '<path d="M3 12h1.5M7 8.5v7M10.5 5v14M14 8v8M17.5 10v4M21 12h0"/>',
    mechanical: '<path d="M4 7h9M17.5 7H20M4 17h3.5M12 17h8"/><circle cx="15.2" cy="7" r="2.2"/><circle cx="9.8" cy="17" r="2.2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    loop: '<path d="M18.4 8.2A7 7 0 1 0 19 13"/><path d="M19.2 4.6v3.9h-3.9"/>',
    test: '<path d="M9.5 3h5M10.5 3v5.5L5.2 18a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3l-5.3-9.5V3"/><path d="M7.5 14.5h9"/>',
    tension: '<path d="M3.5 12h6.5M14 12h6.5M6.5 9l-3 3 3 3M17.5 9l3 3-3 3"/>',
    flag: '<path d="M5 21V4M5 4.5h11.5l-2.2 4 2.2 4H5"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    trash: '<path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    external: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.2v.3"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    make: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17v3h3l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    learn: '<path d="M3 6.5C5.5 5 8.5 5 12 7c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 7v12.5"/>',
    teach: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M7 20l2.5-4M17 20l-2.5-4M7.5 8.5h6M7.5 11.5h9"/>',
    play: '<path d="M7.5 7h9a4.5 4.5 0 0 1 4.4 5.5l-.9 4a2.4 2.4 0 0 1-4.2 1L14.5 16h-5l-1.3 1.5a2.4 2.4 0 0 1-4.2-1l-.9-4A4.5 4.5 0 0 1 7.5 7z"/><path d="M8 10v3M6.5 11.5h3M15.5 11h.01M17.5 12.5h.01"/>',
    problem: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
    diary: '<path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 3.5v17M9.5 8h5.5M9.5 11.5h5.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'
  };
  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICON[name] || '') + '</svg>';
  }

  /* ---------- data validation ---------- */
  function validate(g) {
    var p = [];
    function need(ok, msg) { if (!ok) p.push(msg); }
    if (!g || typeof g !== 'object') return ['not an object'];
    ['slug', 'title', 'studio', 'year', 'genre', 'hook', 'summary', 'fantasy'].forEach(function (k) {
      need(typeof g[k] === 'string' && g[k].trim() !== '', 'missing text field "' + k + '"');
    });
    need(Array.isArray(g.tags), 'tags must be an array');
    need(Array.isArray(g.facts), 'facts must be an array');
    need(g.coreLoop && Array.isArray(g.coreLoop.steps) && g.coreLoop.steps.length >= 3 && g.coreLoop.steps.length <= 8,
      'coreLoop.steps needs between 3 and 8 steps');
    need(Array.isArray(g.systems) && g.systems.length > 0, 'systems must have at least one item');
    need(g.feedback && ['visual', 'audio', 'mechanical'].every(function (k) { return Array.isArray(g.feedback[k]); }),
      'feedback needs visual, audio and mechanical arrays');
    need(g.onboarding && typeof g.onboarding.summary === 'string' && Array.isArray(g.onboarding.steps),
      'onboarding needs summary and steps');
    need(g.pacing && Array.isArray(g.pacing.points) && g.pacing.points.length >= 3, 'pacing.points needs 3 or more points');
    need(Array.isArray(g.tensions), 'tensions must be an array');
    need(Array.isArray(g.takeaways), 'takeaways must be an array');
    if (!p.length) {
      need(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug), 'slug may only use lowercase letters, numbers and hyphens');
      need(g.coreLoop.steps.every(function (s) { return s && typeof s.label === 'string' && s.label.trim() !== ''; }), 'every loop step needs a label');
      need(g.pacing.points.every(function (q) {
        return q && typeof q.phase === 'string' && typeof q.v === 'number' && isFinite(q.v) && q.v >= 0 && q.v <= 10;
      }), 'every pacing point needs a phase and a value v from 0 to 10');
    }
    return p;
  }

  /* ---------- content store ----------
     js/data.js is the published content. Changes made in the editor are
     kept in this browser (localStorage "gt-edits") and merged on top:
     edited[slug] replaces a published game, added[] holds new ones. */
  var EDITS_KEY = 'gt-edits';
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var BASE = (Array.isArray(window.TEARDOWNS) ? window.TEARDOWNS : []);
  var BASE_SLUGS = BASE.map(function (g) { return g && g.slug; });
  function readEdits() {
    try {
      var e = JSON.parse(localStorage.getItem(EDITS_KEY) || 'null');
      if (e && typeof e === 'object') {
        return {
          edited: e.edited && typeof e.edited === 'object' && !Array.isArray(e.edited) ? e.edited : {},
          added: Array.isArray(e.added) ? e.added.filter(function (g) { return g && typeof g === 'object'; }) : []
        };
      }
    } catch (err) { /* blocked or broken storage: start clean */ }
    return { edited: {}, added: [] };
  }
  var EDITS = readEdits();
  function writeEdits() {
    try {
      if (!Object.keys(EDITS.edited).length && !EDITS.added.length) localStorage.removeItem(EDITS_KEY);
      else localStorage.setItem(EDITS_KEY, JSON.stringify(EDITS));
      return true;
    } catch (err) { return false; }
  }

  var GAMES = [];       /* valid teardowns, in order: published first, then added */
  var ENTRIES = [];     /* every teardown including drafts: { game, origin, problems } */
  function rebuild() {
    GAMES = []; ENTRIES = [];
    function push(g, origin) {
      var problems = validate(g);
      if (g && g.slug && ENTRIES.some(function (x) { return x.game.slug === g.slug; })) problems.push('duplicate slug "' + g.slug + '"');
      ENTRIES.push({ game: g, origin: origin, problems: problems });
      if (problems.length) {
        if (origin !== 'added') console.warn('[Game Teardowns] Skipped "' + (g && g.title ? g.title : 'unknown') + '": ' + problems.join('; '));
      } else GAMES.push(g);
    }
    BASE.forEach(function (g) {
      var e = g && EDITS.edited[g.slug];
      push(e || g, e ? 'edited' : 'base');
    });
    EDITS.added.forEach(function (g) { push(g, 'added'); });
  }
  rebuild();

  function entryOf(slug) {
    for (var i = 0; i < ENTRIES.length; i++) if (ENTRIES[i].game && ENTRIES[i].game.slug === slug) return ENTRIES[i];
    return null;
  }
  function addedIndex(slug) {
    for (var i = 0; i < EDITS.added.length; i++) if (EDITS.added[i].slug === slug) return i;
    return -1;
  }
  /* every change goes through commit(): if the browser refuses to store it, nothing changes */
  function commit(change) {
    var before = clone(EDITS);
    change();
    if (!writeEdits()) { EDITS = before; return false; }
    rebuild();
    return true;
  }
  var store = {
    entries: function () { return ENTRIES; },
    games: function () { return GAMES; },
    entry: entryOf,
    isPublished: function (slug) { return BASE_SLUGS.indexOf(slug) >= 0; },
    published: function (slug) { var i = BASE_SLUGS.indexOf(slug); return i >= 0 ? clone(BASE[i]) : null; },
    /* save a teardown; oldSlug is its address before editing (null for a new one) */
    save: function (g, oldSlug) {
      return commit(function () {
        if (oldSlug && BASE_SLUGS.indexOf(oldSlug) >= 0) { g.slug = oldSlug; EDITS.edited[oldSlug] = g; return; }
        var i = oldSlug ? addedIndex(oldSlug) : -1;
        if (i >= 0) EDITS.added[i] = g; else EDITS.added.push(g);
      });
    },
    restore: function (slug) { return commit(function () { delete EDITS.edited[slug]; }); },
    remove: function (slug) { return commit(function () { var i = addedIndex(slug); if (i >= 0) EDITS.added.splice(i, 1); }); },
    discardAll: function () { return commit(function () { EDITS = { edited: {}, added: [] }; }); },
    counts: function () {
      var edited = Object.keys(EDITS.edited).filter(function (s) { return BASE_SLUGS.indexOf(s) >= 0; }).length;
      return {
        edited: edited, added: EDITS.added.length,
        drafts: ENTRIES.filter(function (e) { return e.problems.length; }).length,
        live: GAMES.length, any: edited + EDITS.added.length > 0
      };
    },
    /* a complete js/data.js with every valid teardown; drafts are left out */
    exportJS: function () {
      return '/* ------------------------------------------------------------------\n' +
        '   Game Teardowns - content\n' +
        '   Exported from the editor on ' + new Date().toISOString().slice(0, 10) + '.\n' +
        '   Every teardown follows the same template (see README.md).\n' +
        '------------------------------------------------------------------- */\n\n' +
        'window.TEARDOWN_META = ' + JSON.stringify(META, null, 2) + ';\n\n' +
        'window.TEARDOWNS = ' + JSON.stringify(GAMES, null, 2) + ';\n';
    }
  };

  var LAYERS = (META.layers && META.layers.length ? META.layers : [
    { id: 'Mechanic', def: '' }, { id: 'System', def: '' }, { id: 'Content', def: '' },
    { id: 'Narrative', def: '' }, { id: 'Presentation', def: '' }
  ]);
  function layerIndex(id) {
    for (var i = 0; i < LAYERS.length; i++) if (LAYERS[i].id === id) return i;
    return -1;
  }
  function layerDots(id) {
    var k = layerIndex(id), s = '';
    for (var i = 0; i < LAYERS.length; i++) s += '<i' + (i === k ? ' class="on"' : '') + '></i>';
    return '<span class="lind" aria-hidden="true">' + s + '</span>';
  }

  /* ---------- design problems ----------
     META.problems lists the problems; a system answers one with
     problems: ["problem-id"]. Unknown ids are ignored. */
  var PROBLEMS = (Array.isArray(META.problems) ? META.problems : []).filter(function (p) {
    return p && typeof p.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) && typeof p.name === 'string' && p.name.trim() !== '';
  });
  function problemOf(id) {
    for (var i = 0; i < PROBLEMS.length; i++) if (PROBLEMS[i].id === id) return PROBLEMS[i];
    return null;
  }
  function problemsOfSystem(s) {
    return (Array.isArray(s.problems) ? s.problems : []).map(problemOf).filter(Boolean);
  }
  /* every system, in every live teardown, that answers a problem */
  function solutionsOf(pid) {
    var out = [];
    GAMES.forEach(function (g) {
      g.systems.forEach(function (s) { if (Array.isArray(s.problems) && s.problems.indexOf(pid) >= 0) out.push({ g: g, s: s }); });
    });
    return out;
  }
  function gamesIn(sols) {
    var list = [];
    sols.forEach(function (x) { if (list.indexOf(x.g) < 0) list.push(x.g); });
    return list;
  }

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  function currentTheme() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function paintThemeBtn() { themeBtn.setAttribute('aria-pressed', String(currentTheme() === 'dark')); }
  themeBtn.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    function apply() {
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('gt-theme', next); } catch (e) { /* storage may be blocked */ }
      paintThemeBtn();
    }
    if (!document.startViewTransition || reduceMotion.matches) { apply(); return; }
    /* the new theme grows in a circle from the button */
    var r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add('vt-theme');
    var t = document.startViewTransition(apply);
    t.ready.then(function () {
      document.documentElement.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () { /* skipped */ });
    t.finished.then(function () { document.documentElement.classList.remove('vt-theme'); }, function () { document.documentElement.classList.remove('vt-theme'); });
  });
  paintThemeBtn();

  /* ---------- footer ---------- */
  var disc = document.getElementById('disclaimer');
  if (disc && META.disclaimer) disc.textContent = META.disclaimer;
  var pl = document.getElementById('portfolio-link');
  if (pl && META.portfolio) pl.href = META.portfolio;
  var an = document.getElementById('author-name');
  if (an && META.author) an.textContent = META.author;

  /* ================================================================
     SVG GENERATORS
  ================================================================ */

  /* Card thumbnail: the game's pacing curve on a dot grid. */
  function thumbSVG(g, uid) {
    var W = 320, H = 150, L = 20, R = 20, T = 34, B = 24;
    var pts = g.pacing.points, n = pts.length, pk = peakOf(g);
    var xy = pts.map(function (p, i) {
      return [L + (i * (W - L - R)) / (n - 1), T + (1 - clamp(p.v, 0, 10) / 10) * (H - T - B)];
    });
    var line = smooth(xy, T, H - B);
    var area = line + ' L' + f1(xy[n - 1][0]) + ' ' + (H - B) + ' L' + f1(xy[0][0]) + ' ' + (H - B) + ' Z';
    var ticks = xy.map(function (p) {
      return '<line class="ch-grid" x1="' + f1(p[0]) + '" x2="' + f1(p[0]) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '"/>';
    }).join('');
    var dots = xy.map(function (p, i) {
      return i === pk ? '' : '<circle class="ch-dot ch-c0" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="2.6"/>';
    }).join('');
    var px = xy[pk][0], py = xy[pk][1];
    var lx = clamp(px, L + 24, W - R - 24);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' +
      '<defs><pattern id="dp-' + uid + '" width="14" height="14" patternUnits="userSpaceOnUse"><circle class="dotgrid" cx="1" cy="1" r="0.9"/></pattern>' +
      '<linearGradient id="fg-' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ch-fill-stop-a"/><stop offset="1" class="ch-fill-stop-b"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#dp-' + uid + ')"/>' +
      '<line class="ch-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>' + ticks +
      '<path d="' + area + '" fill="url(#fg-' + uid + ')"/>' +
      '<path class="ch-line ch-c0" d="' + line + '"/>' + dots +
      '<line class="ch-grid-dash" x1="' + f1(px) + '" x2="' + f1(px) + '" y1="' + f1(py + 6) + '" y2="' + (H - B) + '"/>' +
      '<circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="4.5" style="fill:var(--accent-hi)"/>' +
      '<circle cx="' + f1(px) + '" cy="' + f1(py) + '" r="8" style="fill:none;stroke:var(--accent-hi);stroke-opacity:.35"/>' +
      '<text class="ch-label" x="' + f1(lx) + '" y="' + f1(py - 13) + '" text-anchor="middle">PEAK ' + esc(pts[pk].v) + '</text>' +
      '</svg>';
  }

  /* Hero visual: every teardown's pacing curve on one normalised axis. */
  var CURVE_CLASSES = ['ch-c0', 'ch-c1', 'ch-c2'];
  function heroSVG(list) {
    var compact = compactMQ.matches;
    var W = compact ? 360 : 560, H = compact ? 230 : 280, L = 30, R = 10, T = 16, B = 30;
    var ih = H - T - B;
    function Y(v) { return T + (1 - v / 10) * ih; }
    var zones =
      '<rect x="' + L + '" y="' + f1(Y(10)) + '" width="' + (W - L - R) + '" height="' + f1(Y(7) - Y(10)) + '" style="fill:var(--accent-hi);fill-opacity:.06"/>' +
      '<text class="ch-label" x="' + (L + 8) + '" y="' + f1(Y(10) + 14) + '">PRESSURE ZONE</text>';
    var grid = [0, 5, 10].map(function (v) {
      return '<line class="' + (v === 0 ? 'ch-grid' : 'ch-grid-dash') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(v)) + '" y2="' + f1(Y(v)) + '"/>' +
        '<text class="ch-label" x="' + (L - 8) + '" y="' + f1(Y(v) + 3.5) + '" text-anchor="end">' + v + '</text>';
    }).join('');
    var axis = '<text class="ch-label" x="' + L + '" y="' + (H - 9) + '">START</text>' +
      '<text class="ch-label" x="' + (W - R) + '" y="' + (H - 9) + '" text-anchor="end">END OF SECTION</text>';
    var curves = '', peaks = '';
    list.slice(0, 3).forEach(function (g, gi) {
      var pts = g.pacing.points, n = pts.length, pk = peakOf(g);
      var xy = pts.map(function (p, i) { return [L + (i * (W - L - R)) / (n - 1), Y(clamp(p.v, 0, 10))]; });
      /* the dashed third curve fades in, the solid ones draw themselves */
      var anim = gi === 2 ? ' fade-in" d="' : ' draw draw-d' + gi + '" pathLength="1" d="';
      curves = '<path class="ch-line ' + CURVE_CLASSES[gi] + anim + smooth(xy, T, H - B) + '"/>' + curves;
      peaks += '<circle class="ch-dot ' + CURVE_CLASSES[gi] + ' fade-in" cx="' + f1(xy[pk][0]) + '" cy="' + f1(xy[pk][1]) + '" r="4" style="stroke-dasharray:none"/>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Pacing curves of ' +
      esc(list.slice(0, 3).map(function (g) { return g.title; }).join(', ')) +
      ', drawn on a scale from 0, calm, to 10, peak pressure. Each rises and falls several times before its highest point near the end.">' +
      zones + grid + axis + curves + peaks + '</svg>';
  }
  function swatch(gi) {
    return '<svg viewBox="0 0 18 6" aria-hidden="true"><line class="ch-line ' + CURVE_CLASSES[gi] + '" x1="1.5" x2="16.5" y1="3" y2="3" style="stroke-width:2.5"/></svg>';
  }

  /* ================================================================
     HOME
  ================================================================ */
  function sum(fn) { return GAMES.reduce(function (a, g) { return a + fn(g); }, 0); }

  function cardHTML(g) {
    var i = GAMES.indexOf(g), e = entryOf(g.slug), o = e ? e.origin : 'base';
    return '<li><a class="gcard" href="' + gameHref(g) + '">' +
      '<div class="gthumb"><span class="gnum">' + pad2(i + 1) + ' / PACING</span>' +
      (o !== 'base' ? '<span class="gloc">' + (o === 'added' ? 'ADDED HERE' : 'EDITED HERE') + '</span>' : '') + thumbSVG(g, 'c' + i) + '</div>' +
      '<div class="gbody">' +
      '<p class="gmeta"><span>' + esc(g.studio) + '</span><span class="sep" aria-hidden="true"></span><span>' + esc(shortYear(g.year)) + '</span><span class="sep" aria-hidden="true"></span><span>' + esc(g.genre) + '</span></p>' +
      '<h3>' + esc(g.title) + '</h3>' +
      '<p class="hook">' + esc(g.hook) + '</p>' +
      '<ul class="gtags">' + g.tags.map(function (t) { return '<li class="tag">' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="gfoot"><span>' + g.coreLoop.steps.length + '-STEP LOOP · ' + g.systems.length + ' SYSTEMS · ' + g.takeaways.length + ' TAKEAWAYS</span>' +
      '<span class="go" aria-hidden="true">' + icon('arrow') + '</span></div>' +
      '</div></a></li>';
  }

  var DOORS = [
    PROBLEMS.length ?
      { ic: 'make', k: 'Making a game', t: 'See how other games solve your problem',
        d: 'Design problems, each with the systems that answer it across games, and a question to test it in your project.', href: '#/problems', go: 'Browse problems' } :
      { ic: 'make', k: 'Making a game', t: 'See how other games solve it',
        d: 'Every system from every teardown in one library, searchable by mechanic and layer, with what it does and why.', href: '#/systems', go: 'Browse systems' },
    { ic: 'learn', k: 'Learning design', t: 'Take a game apart with a method',
      d: 'Read the teardowns, then write your own in the guided editor and export it for your portfolio.', href: '#/new', go: 'Write a teardown' },
    { ic: 'teach', k: 'Teaching design', t: 'Give a class one shared template',
      d: 'Six sections and five layers, the same for every student, so the work can be compared side by side.', href: '#/method', go: 'See the method' },
    { ic: 'play', k: 'Playing', t: 'Keep a design diary',
      d: 'Note the moments that hit you while you play. Your notes become a pacing curve and a teardown draft.', href: '#/diary', go: 'Open my diary' }
  ];

  function home() {
    document.title = SITE + ' | ' + (META.author || '');
    var tags = [];
    GAMES.forEach(function (g) { g.tags.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
    tags.sort();

    var nSystems = sum(function (g) { return g.systems.length; });
    var nSteps = sum(function (g) { return g.coreLoop.steps.length; });
    var nTakes = sum(function (g) { return g.takeaways.length; });
    var projects = [];
    GAMES.forEach(function (g) { g.takeaways.forEach(function (t) { if (t.project && projects.indexOf(t.project) < 0) projects.push(t.project); }); });
    var layerCount = {};
    GAMES.forEach(function (g) { g.systems.forEach(function (s) { layerCount[s.layer] = (layerCount[s.layer] || 0) + 1; }); });

    var shown = GAMES.slice(0, 3);
    var initials = String(META.author || '').split(' ').map(function (w) { return w.charAt(0); }).join('').slice(0, 2);
    var compareKeys = ['tension', 'failure'];
    var rowsMeta = (META.compareRows || []).filter(function (r) { return compareKeys.indexOf(r.key) >= 0; });

    app.innerHTML =
      /* hero */
      '<section class="wrap hero" aria-labelledby="hero-h">' +
      '<div class="hero-copy">' +
      '<p class="kicker">Game design teardowns' + (META.author ? ' <span>by ' + esc(META.author) + '</span>' : '') + '</p>' +
      '<h1 id="hero-h">Games, taken apart <em class="hero-em">to see why they work.</em></h1>' +
      '<p class="lede">When a game stays with me, I want to know why. Each teardown follows its core loop, systems, feedback and pacing, then ends with what I would take into my own work. Same structure every time, so any two games can sit side by side.</p>' +
      '<div class="actions">' +
      '<a class="btn btn-primary" href="#/" data-jump="list-h">Browse teardowns' + icon('arrow', 'ic-arrow') + '</a>' +
      '<a class="btn" href="#/compare">Compare games</a></div>' +
      '</div>' +
      '<figure class="viz hero-fig">' +
      '<div class="viz-head"><h2>How tension rises and falls</h2><span>Intensity, 0 to 10</span></div>' +
      '<div id="hero-chart">' + heroSVG(shown) + '</div>' +
      '<ul class="viz-legend">' + shown.map(function (g, gi) {
        return '<li><a href="' + gameHref(g, 'pacing') + '"><span class="lg-name">' + swatch(gi) + esc(g.title) + '</span>' +
          '<span class="lg-meta">Peaks at ' + esc(g.pacing.points[peakOf(g)].v) + ' over ' + g.pacing.points.length + ' beats</span></a></li>';
      }).join('') + '</ul>' +
      '<figcaption><span class="fig-n">Fig. 1</span>Pacing of three teardowns, drawn from my own reading of each game\'s rhythm. Not measured data.</figcaption>' +
      '</figure>' +
      '</section>' +

      /* the library in one line */
      '<section class="wrap" aria-label="In numbers"><dl class="tally">' +
      '<div><dd>' + GAMES.length + '</dd><dt>teardowns, one template</dt></div>' +
      '<div><dd>' + nSystems + '</dd><dt>systems, each with what, why and effect</dt></div>' +
      '<div><dd>' + nSteps + '</dd><dt>loop steps, with what the player feels</dt></div>' +
      '<div><dd>' + nTakes + '</dd><dt>takeaways' + (projects.length ? ' for ' + plural(projects.length, 'original project', 'original projects') : ' to try in your own work') + '</dt></div>' +
      '</dl></section>' +

      /* greeting or invitation, from the taste profile */
      (GT.profile ? GT.profile.homeHTML() : '') +

      /* four ways in */
      '<section class="wrap block ways" aria-labelledby="doors-h">' +
      '<div class="ways-head"><h2 id="doors-h">Four ways in</h2><p>Start with the one that sounds like you.</p></div>' +
      '<ol class="ways-list">' + DOORS.map(function (d, i) {
        return '<li><a class="door" href="' + d.href + '"><span class="door-n">' + pad2(i + 1) + '</span>' +
          '<span class="door-k">' + d.k + '</span>' +
          '<span class="door-main"><span class="door-t">' + d.t + '</span><span class="door-d">' + d.d + '</span></span>' +
          '<span class="door-go"><span>' + d.go + '</span>' + icon('arrow') + '</span></a></li>';
      }).join('') + '</ol></section>' +

      /* teardown grid */
      '<section class="wrap block" aria-labelledby="list-h">' +
      '<div class="block-head"><div><p class="eyebrow">Library</p><h2 id="list-h" tabindex="-1">Teardowns</h2></div>' +
      '<div class="home-tools">' +
      '<label class="search"><span class="sr">Search teardowns</span>' + icon('search') +
      '<input type="search" id="q" placeholder="Search title, studio or tag" autocomplete="off"></label>' +
      '<div class="chips" role="group" aria-label="Filter by tag">' +
      '<button type="button" class="chip" data-tag="" aria-pressed="true">All</button>' +
      tags.map(function (t) { return '<button type="button" class="chip" data-tag="' + esc(t) + '" aria-pressed="false">' + esc(t) + '</button>'; }).join('') +
      '</div></div></div>' +
      '<p class="status" id="status" role="status"></p>' +
      '<ul class="cards" id="rows"></ul>' +
      '<p id="empty" class="notice" hidden>No teardown matches this search. Clear the search or choose "All".</p>' +
      '</section>' +

      /* five layers */
      '<section class="wrap block" aria-labelledby="layers-h">' +
      '<div class="block-head"><div><p class="eyebrow">Method</p><h2 id="layers-h">How a teardown works</h2>' +
      '<p class="sub">Every element of a game is placed in exactly one of five layers, so mechanics, systems, content, narrative and presentation are never mixed up.</p></div>' +
      '<a class="text-link" href="#/method">Read the method' + icon('arrow') + '</a></div>' +
      '<ol class="layers">' + LAYERS.map(function (l, i) {
        var c = layerCount[l.id] || 0;
        return '<li><div class="layer-card"><span class="lnum">L' + (i + 1) + '</span>' +
          '<span class="layer-ic">' + icon(l.id) + '</span><h3>' + esc(l.id) + '</h3><p>' + esc(l.def) + '</p>' +
          '<span class="lcount">' + plural(c, 'SYSTEM', 'SYSTEMS') + ' ACROSS ' + GAMES.length + ' GAMES' +
          '<span class="lbar" aria-hidden="true">' + barSegs(c, nSystems) + '</span></span></div></li>';
      }).join('') + '</ol></section>' +

      /* compare teaser */
      (GAMES.length > 1 ?
        '<section class="wrap block" aria-labelledby="cmp-h"><div class="teaser">' +
        '<div class="teaser-copy"><p class="eyebrow" style="margin:0">Compare</p><h2 id="cmp-h">Same questions, every game</h2>' +
        '<p>' + esc((META.compareInsight || [])[0] || 'The same questions asked of every game, side by side.') + '</p>' +
        '<a class="btn" href="#/compare">Open the comparison' + icon('arrow', 'ic-arrow') + '</a></div>' +
        '<div class="teaser-table" tabindex="0" role="region" aria-label="Comparison preview"><table class="mini"><caption class="sr">Preview of the comparison table</caption>' +
        '<thead><tr><td></td>' + GAMES.slice(0, 3).map(function (g) { return '<th scope="col">' + esc(g.title) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rowsMeta.map(function (r) {
          return '<tr><th scope="row">' + esc(r.label) + '</th>' + GAMES.slice(0, 3).map(function (g) {
            return '<td>' + esc((g.compare && g.compare[r.key]) || '') + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' +
        '</div></section>' : '') +

      /* a note from the author */
      (META.author ?
        '<section class="wrap block" aria-labelledby="note-h"><div class="note">' +
        '<span class="avatar note-av" aria-hidden="true">' + esc(initials) + '</span>' +
        '<div class="note-b"><p class="eyebrow">A note from me</p>' +
        '<h2 id="note-h" class="note-q">This is my design notebook, left open on purpose.</h2>' +
        '<p>I write these to train my eye: to name what a game is doing instead of only feeling it. If one of them helps you fix a loop, plan a class or understand why a game got under your skin, it did its job. And if you take a game apart yourself, I would love to read it.</p>' +
        '<p class="note-sign">' + esc(META.author) + '</p>' +
        '<div class="actions"><a class="btn" href="#/new">' + icon('edit') + 'Write a teardown</a>' +
        (META.repo ? '<a class="btn btn-ghost" href="#/contribute">Send it to the site' + icon('arrow', 'ic-arrow') + '</a>' : '') + '</div></div>' +
        '</div></section>' : '');

    /* filtering */
    var q = document.getElementById('q');
    var rows = document.getElementById('rows');
    var status = document.getElementById('status');
    var empty = document.getElementById('empty');
    var chips = all('.chips .chip', app);
    var tag = '';
    function apply() {
      var term = q.value.trim().toLowerCase();
      var list = GAMES.filter(function (g) {
        var hay = [g.title, g.studio, g.genre, g.hook].concat(g.tags).join(' ').toLowerCase();
        return (!term || hay.indexOf(term) >= 0) && (!tag || g.tags.indexOf(tag) >= 0);
      });
      rows.innerHTML = list.map(cardHTML).join('');
      empty.hidden = list.length > 0;
      status.textContent = 'SHOWING ' + list.length + ' OF ' + plural(GAMES.length, 'TEARDOWN', 'TEARDOWNS');
    }
    q.addEventListener('input', apply);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        tag = c.getAttribute('data-tag');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        apply();
      });
    });
    apply();

    /* "Browse teardowns" scrolls to the grid instead of changing the route */
    app.querySelector('[data-jump]').addEventListener('click', function (e) {
      e.preventDefault();
      var h = document.getElementById(this.getAttribute('data-jump'));
      h.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      h.focus({ preventScroll: true });
    });

    /* redraw the hero chart when crossing the compact breakpoint */
    function onMQ() { var el = document.getElementById('hero-chart'); if (el) el.innerHTML = heroSVG(shown); }
    listenMQ(onMQ);
    cleanup = function () { unlistenMQ(onMQ); };
    return 'home';
  }

  function barSegs(c, total) {
    var on = total ? Math.round((c / total) * 10) : 0, s = '';
    for (var i = 0; i < 10; i++) s += '<i' + (i < on ? ' class="on"' : '') + '></i>';
    return s;
  }
  function listenMQ(fn) { if (compactMQ.addEventListener) compactMQ.addEventListener('change', fn); else if (compactMQ.addListener) compactMQ.addListener(fn); }
  function unlistenMQ(fn) { if (compactMQ.removeEventListener) compactMQ.removeEventListener('change', fn); else if (compactMQ.removeListener) compactMQ.removeListener(fn); }

  /* ================================================================
     GAME PAGE (one scrolling page, sticky table of contents)
  ================================================================ */
  var SECTIONS = [
    ['overview', 'Overview'], ['loop', 'Core loop'], ['systems', 'Systems'],
    ['feedback', 'Feedback'], ['pacing', 'Pacing'], ['takeaways', 'Takeaways']
  ];
  /* old tab ids that live inside another section */
  var ALIAS = { onboarding: 'onboarding' };

  function secHead(i, id, title, sub) {
    return '<header class="sec-head"><span class="sec-n">' + pad2(i + 1) + '</span>' +
      '<h2 id="h-' + id + '" tabindex="-1">' + esc(title) + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</header>';
  }

  /* --- core loop diagram --- */
  function loopHTML(g) {
    var steps = g.coreLoop.steps, n = steps.length, C = 50, R = 38;
    var HW = 15, HH = 8;     /* approx node half size, in % of the square */
    function ang(i) { return -90 + (i * 360) / n; }
    function pt(a) { var r = (a * Math.PI) / 180; return [C + R * Math.cos(r), C + R * Math.sin(r)]; }
    /* how far along the ring an arc must start to clear a node box */
    function clearance(i, dir) {
      var c = pt(ang(i));
      for (var d = 1; d < 60; d += 0.5) {
        var p = pt(ang(i) + dir * d);
        if (Math.abs(p[0] - c[0]) > HW || Math.abs(p[1] - c[1]) > HH) return d + 2.5;
      }
      return 60;
    }
    var arcs = '';
    for (var i = 0; i < n; i++) {
      var a0 = ang(i) + clearance(i, 1), a1 = ang(i + 1) - clearance((i + 1) % n, -1);
      if (a1 - a0 < 4) continue;
      var p0 = pt(a0), p1 = pt(a1);
      arcs += '<path class="arc" data-i="' + i + '" d="M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' +
        p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + '" marker-end="url(#la)"/>';
    }
    var nodes = steps.map(function (s, k) {
      var p = pt(ang(k));
      return '<button type="button" class="loop-node" data-i="' + k + '" aria-pressed="' + (k === 0) +
        '" style="left:' + p[0].toFixed(2) + '%;top:' + p[1].toFixed(2) + '%"><span class="n">' + pad2(k + 1) + '</span>' + esc(s.label) + '</button>';
    }).join('');
    return '<div class="loop-grid">' +
      '<div class="loop-stage"><div class="loop" role="group" aria-label="Core loop of ' + esc(g.title) + ', ' + n + ' steps running clockwise from the top. Select a step to read about it.">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs>' +
      '<marker id="la" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path class="arrow" d="M0 0L10 5L0 10z"/></marker>' +
      '<marker id="la-on" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path class="arrow-on" d="M0 0L10 5L0 10z"/></marker></defs>' +
      '<circle class="ring" cx="50" cy="50" r="' + R + '"/>' + arcs + '</svg>' +
      '<div class="loop-center" aria-hidden="true"><span class="k" id="lc-k"></span><span class="v" id="lc-v"></span></div>' +
      nodes + '<p class="loop-return" aria-hidden="true">' + icon('loop') + 'Back to 01 ' + esc(steps[0].label) + '</p></div></div>' +
      '<div class="card step-card" id="loop-detail" aria-live="polite"></div></div>' +
      (g.coreLoop.note ? '<div class="callout">' + icon('loop') + '<p>' + esc(g.coreLoop.note) + '</p></div>' : '');
  }
  function initLoop(root, g) {
    var steps = g.coreLoop.steps, n = steps.length;
    var detail = root.querySelector('#loop-detail');
    var nodes = all('.loop-node', root), arcs = all('.arc', root);
    var lk = root.querySelector('#lc-k'), lv = root.querySelector('#lc-v');
    var cur = 0;
    function sel(i) {
      cur = (i + n) % n;
      nodes.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === cur)); });
      arcs.forEach(function (a) {
        var on = Number(a.getAttribute('data-i')) === cur;
        a.classList.toggle('on', on);
        a.setAttribute('marker-end', on ? 'url(#la-on)' : 'url(#la)');
      });
      var s = steps[cur], segs = '';
      for (var k = 0; k < n; k++) segs += '<i' + (k <= cur ? ' class="on"' : '') + '></i>';
      lk.textContent = 'Step ' + pad2(cur + 1) + ' / ' + pad2(n);
      lv.textContent = s.label;
      detail.innerHTML =
        '<div class="step-top"><span class="step-count">STEP ' + pad2(cur + 1) + ' OF ' + pad2(n) + '</span><span class="step-segs" aria-hidden="true">' + segs + '</span></div>' +
        '<h3>' + esc(s.label) + '</h3>' +
        '<dl><div><dt>What happens</dt><dd>' + esc(s.detail) + '</dd></div>' +
        '<div class="feel"><dt>What the player feels</dt><dd>' + esc(s.feeling) + '</dd></div></dl>' +
        '<p class="leads">' + icon(cur === n - 1 ? 'loop' : 'arrow') + '<span>' + (cur === n - 1 ? 'Loops back to' : 'Leads to') + '</span>' +
        '<b>' + pad2((cur + 1) % n + 1) + ' ' + esc(steps[(cur + 1) % n].label) + '</b></p>' +
        '<div class="step-nav"><button type="button" class="btn btn-sm" data-dir="-1">' + icon('back') + 'Previous</button>' +
        '<button type="button" class="btn btn-sm" data-dir="1">Next' + icon('arrow') + '</button></div>';
    }
    nodes.forEach(function (b, k) { b.addEventListener('click', function () { sel(k); }); });
    detail.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dir]');
      if (!b) return;
      var dir = b.getAttribute('data-dir');
      sel(cur + Number(dir));
      var again = detail.querySelector('[data-dir="' + dir + '"]');
      if (again) again.focus();
    });
    sel(0);
  }

  /* --- systems grouped by layer --- */
  function systemsHTML(g) {
    var groups = LAYERS.map(function (l) {
      return { layer: l, items: g.systems.filter(function (s) { return s.layer === l.id; }) };
    });
    /* systems with an unknown layer are still shown */
    var other = g.systems.filter(function (s) { return layerIndex(s.layer) < 0; });
    if (other.length) groups.push({ layer: { id: 'Other', def: '' }, items: other });
    groups = groups.filter(function (x) { return x.items.length; });

    /* one continuous grid: a label tile opens each layer, its systems follow */
    return '<div class="sys-tools"><p class="mono">' + plural(g.systems.length, 'SYSTEM', 'SYSTEMS') + ' · ' + plural(groups.length, 'LAYER', 'LAYERS') + ' · CLICK A CARD TO OPEN IT</p>' +
      '<button type="button" class="btn btn-sm" id="toggle-all" aria-pressed="false">Expand all</button></div>' +
      '<div class="sys-grid">' +
      groups.map(function (x) {
        return '<div class="sys-label"><div class="sys-label-top"><span class="layer-ic" aria-hidden="true">' + icon(x.layer.id) + '</span>' +
          '<span class="count">' + (layerIndex(x.layer.id) >= 0 ? 'L' + (layerIndex(x.layer.id) + 1) + ' · ' : '') + plural(x.items.length, 'SYSTEM', 'SYSTEMS') + '</span></div>' +
          '<h3>' + esc(x.layer.id) + '</h3><p>' + esc(x.layer.def) + '</p></div>' +
          x.items.map(function (s) {
            return '<details class="sys" data-layer="' + esc(s.layer) + '"><summary>' +
              '<span class="sys-top">' + layerDots(s.layer) + esc(s.layer) + '</span>' +
              '<span class="plus" aria-hidden="true">' + icon('plus') + '</span>' +
              '<span class="sys-name">' + esc(s.name) + '</span>' +
              '<span class="sys-what">' + esc(s.what) + '</span></summary>' +
              '<dl><div><dt>What it does</dt><dd>' + esc(s.what) + '</dd></div>' +
              '<div><dt>Why it exists</dt><dd>' + esc(s.why) + '</dd></div>' +
              '<div><dt>Effect on the player</dt><dd>' + esc(s.effect) + '</dd></div></dl>' +
              (problemsOfSystem(s).length ? '<p class="sys-probs"><span>' + icon('problem') + 'Answers</span>' + problemsOfSystem(s).map(function (p) {
                return '<a href="#/problem/' + p.id + '">' + esc(p.name) + '</a>';
              }).join('') + '</p>' : '') + '</details>';
          }).join('');
      }).join('') + '</div>';
  }
  function initSystems(root) {
    var items = all('.sys', root);
    var toggle = root.querySelector('#toggle-all');
    function sync() {
      var open = items.every(function (it) { return it.open; });
      toggle.textContent = open ? 'Collapse all' : 'Expand all';
      toggle.setAttribute('aria-pressed', String(open));
    }
    toggle.addEventListener('click', function () {
      var open = !items.every(function (it) { return it.open; });
      items.forEach(function (it) { it.open = open; });
      sync();
    });
    items.forEach(function (it) { it.addEventListener('toggle', sync); });
  }

  /* --- pacing chart --- */
  function paceSVG(g, sel) {
    var compact = compactMQ.matches;
    var pts = g.pacing.points, n = pts.length;
    var W = compact ? 360 : 800, H = compact ? 230 : 310, L = compact ? 26 : 40, R = compact ? 14 : 30, T = 30, B = compact ? 34 : 62;
    var iw = W - L - R, ih = H - T - B;
    function X(i) { return L + (i * iw) / (n - 1); }
    function Y(v) { return T + (1 - clamp(v, 0, 10) / 10) * ih; }
    var xy = pts.map(function (p, i) { return [X(i), Y(p.v)]; });
    var line = smooth(xy, T, H - B);
    var area = line + ' L' + f1(X(n - 1)) + ' ' + Y(0) + ' L' + f1(X(0)) + ' ' + Y(0) + ' Z';
    var grid = [0, 2.5, 5, 7.5, 10].map(function (v) {
      var major = v % 5 === 0;
      return '<line class="' + (v === 0 ? 'ch-grid' : 'ch-grid-dash') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + f1(Y(v)) + '" y2="' + f1(Y(v)) + '"' + (major ? '' : ' opacity=".5"') + '/>' +
        (major ? '<text class="ch-label" x="' + (L - 8) + '" y="' + f1(Y(v) + 3.5) + '" text-anchor="end">' + v + '</text>' : '');
    }).join('');
    var labels = pts.map(function (p, i) {
      if (compact) return '<text class="xn' + (i === sel ? ' on' : '') + '" data-i="' + i + '" x="' + f1(X(i)) + '" y="' + (H - B + 22) + '" text-anchor="middle">' + pad2(i + 1) + '</text>';
      return '<text class="xl' + (i === sel ? ' on' : '') + '" data-i="' + i + '" text-anchor="middle">' + wrapWords(p.phase, 13).map(function (ln, k) {
        return '<tspan x="' + f1(X(i)) + '" y="' + (H - B + 24 + k * 14) + '">' + esc(ln) + '</tspan>';
      }).join('') + '</text>';
    }).join('');
    var dots = pts.map(function (p, i) {
      var x = f1(X(i)), y = f1(Y(p.v));
      return '<g class="pt" role="button" tabindex="0" data-i="' + i + '" aria-pressed="' + (i === sel) + '" aria-label="' +
        esc(p.phase + ', intensity ' + p.v + ' of 10. ' + (p.note || '')) + '">' +
        '<line class="guide" x1="' + x + '" x2="' + x + '" y1="' + f1(Y(p.v) + 8) + '" y2="' + Y(0) + '"/>' +
        '<circle class="hit" cx="' + x + '" cy="' + y + '" r="' + (compact ? 16 : 20) + '"/>' +
        '<circle class="ring" cx="' + x + '" cy="' + y + '" r="11"/>' +
        '<circle class="dot" cx="' + x + '" cy="' + y + '" r="' + (compact ? 5 : 6) + '"/>' +
        '<text class="vlab" x="' + x + '" y="' + f1(Y(p.v) - 15) + '" text-anchor="middle">' + esc(p.v) + '</text></g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Pacing curve of ' + esc(g.title) + '. Select a point to read about that moment. Use the arrow keys to move between points.">' +
      '<defs><linearGradient id="pace-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="ch-fill-stop-a"/><stop offset="1" class="ch-fill-stop-b"/></linearGradient></defs>' +
      grid + '<path class="area" d="' + area + '"/><path class="pline" d="' + line + '"/>' + labels + dots + '</svg>';
  }
  function paceHTML(g) {
    var pts = g.pacing.points;
    return '<div class="card pace-card"><div class="pace-head"><p>' + esc(g.pacing.label || '') + '</p><span class="mono">INTENSITY 0 CALM → 10 PEAK</span></div>' +
      '<div class="pace" id="pace-chart"></div></div>' +
      '<div class="pace-lower">' +
      '<div class="card pace-detail" id="pace-cap" aria-live="polite"></div>' +
      '<div class="card"><ol class="phases" aria-label="Moments in the curve">' + pts.map(function (p, i) {
        return '<li><button type="button" data-i="' + i + '" aria-pressed="false"><span class="i">' + pad2(i + 1) + '</span><span>' + esc(p.phase) + '</span>' +
          '<span class="bar" aria-hidden="true"><b style="width:' + clamp(p.v, 0, 10) * 10 + '%"></b></span></button></li>';
      }).join('') + '</ol></div></div>';
  }
  function initPacing(root, g) {
    var pts = g.pacing.points, n = pts.length;
    var chart = root.querySelector('#pace-chart');
    var cap = root.querySelector('#pace-cap');
    var list = all('.phases button', root);
    var cur = peakOf(g);
    function draw() {
      chart.innerHTML = paceSVG(g, cur);
      all('.pt', chart).forEach(function (d) {
        var i = Number(d.getAttribute('data-i'));
        d.addEventListener('click', function () { sel(i); });
        d.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(i); }
          else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            sel(clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1));
            chart.querySelector('.pt[data-i="' + cur + '"]').focus();
          }
        });
      });
    }
    function sel(i) {
      cur = i;
      all('.pt', chart).forEach(function (d, k) { d.setAttribute('aria-pressed', String(k === i)); });
      all('.xl, .xn', chart).forEach(function (t) { t.classList.toggle('on', Number(t.getAttribute('data-i')) === i); });
      list.forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      var p = pts[i], m = '';
      for (var k = 1; k <= 10; k++) m += '<i' + (k <= p.v ? ' class="on"' : '') + '></i>';
      cap.innerHTML = '<div class="top"><span class="mono" style="color:var(--text-3)">MOMENT ' + pad2(i + 1) + ' OF ' + pad2(n) + '</span>' +
        '<span class="meter" aria-hidden="true">' + m + '</span></div>' +
        '<h3>' + esc(p.phase) + '</h3><span class="lvl">INTENSITY ' + esc(p.v) + ' / 10' + (i === peakOf(g) ? ' · PEAK OF THE CURVE' : '') + '</span>' +
        '<p>' + esc(p.note || '') + '</p>' +
        '<div class="deltas">' + delta(i - 1, 'From') + delta(i + 1, 'Then') + '</div>';
    }
    /* how intensity changes into and out of the selected moment */
    function delta(j, word) {
      if (j < 0 || j >= n) return '<div class="delta muted"><span class="mono">' + word.toUpperCase() + '</span><b>' + (j < 0 ? 'Start of the curve' : 'End of the curve') + '</b></div>';
      var d = word === 'From' ? pts[cur].v - pts[j].v : pts[j].v - pts[cur].v;
      var sign = d > 0 ? '+' : (d < 0 ? '−' : '±');
      return '<div class="delta"><span class="mono">' + word.toUpperCase() + ' ' + pad2(j + 1) + '</span><b>' + esc(pts[j].phase) + '</b>' +
        '<span class="chg ' + (d > 0 ? 'up' : d < 0 ? 'down' : '') + '">' + sign + Math.abs(d) + '</span></div>';
    }
    list.forEach(function (b, k) { b.addEventListener('click', function () { sel(k); }); });
    draw();
    sel(cur);
    function onMQ() { draw(); sel(cur); }
    listenMQ(onMQ);
    return function () { unlistenMQ(onMQ); };
  }

  /* --- other section bodies --- */
  function overviewHTML(g) {
    return '<div class="ov-grid"><div class="ov-summary"><p>' + esc(g.summary) + '</p></div>' +
      '<aside class="fantasy" aria-labelledby="fantasy-h"><p class="eyebrow" id="fantasy-h"><span class="pip" aria-hidden="true"></span>Player fantasy</p>' +
      '<blockquote>' + esc(g.fantasy) + '</blockquote></aside></div>' +
      (g.facts.length ? '<dl class="facts">' + g.facts.map(function (f) {
        return '<div><dt>' + esc(f.k) + '</dt><dd>' + esc(f.v) + '</dd></div>';
      }).join('') + '</dl>' : '') +
      (g.source && /^Q\d+$/.test(g.source.wikidata || '') ?
        '<p class="src-note">Basic facts from <a href="https://www.wikidata.org/wiki/' + g.source.wikidata + '" rel="noopener">Wikidata</a>' +
        (/^https:\/\/en\.wikipedia\.org\/wiki\//.test(g.source.wikipedia || '') ? ' · <a href="' + esc(g.source.wikipedia) + '" rel="noopener">Wikipedia article</a>' : '') + '</p>' : '') +
      '<div class="card onb" id="s-onboarding">' +
      '<div><h3 id="h-onboarding" tabindex="-1">' + icon('flag') + 'How the game teaches</h3><p>' + esc(g.onboarding.summary) + '</p>' +
      '<ol class="ladder">' + g.onboarding.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
      '<div><h3>' + icon('gauge') + 'Difficulty</h3><p>' + esc(g.onboarding.difficulty || '') + '</p></div>' +
      '</div>';
  }

  var FB = [['visual', 'Visual'], ['audio', 'Audio'], ['mechanical', 'Mechanical']];
  function feedbackHTML(g) {
    return '<div class="fb-grid">' + FB.map(function (c) {
      var items = g.feedback[c[0]];
      return '<section class="card fb" aria-labelledby="fb-' + c[0] + '"><div class="fb-head"><span class="layer-ic" aria-hidden="true">' + icon(c[0]) + '</span>' +
        '<h3 id="fb-' + c[0] + '">' + c[1] + '</h3><span class="count">' + pad2(items.length) + '</span></div>' +
        '<ul>' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></section>';
    }).join('') + '</div>';
  }

  function takeawaysHTML(g) {
    return (g.tensions.length ?
      '<h3 class="sub-h" style="margin-top:0">' + icon('tension') + 'Design tensions<span class="count">' + pad2(g.tensions.length) + '</span></h3>' +
      '<div class="ten-grid">' + g.tensions.map(function (t) {
        return '<div class="ten"><h4>' + esc(t.title) + '</h4><p>' + esc(t.text) + '</p></div>';
      }).join('') + '</div>' : '') +
      '<h3 class="sub-h">' + icon('arrow') + 'What I would take, and how I would adapt it<span class="count">' + pad2(g.takeaways.length) + '</span></h3>' +
      '<ul class="take-grid">' + g.takeaways.map(function (t, i) {
        return '<li><article class="card take" aria-labelledby="tk-' + i + '">' +
          '<div class="take-top">' + (t.project ? '<span class="ptag">' + esc(t.project) + '</span>' : '<span></span>') + '<span class="mono">T' + pad2(i + 1) + '</span></div>' +
          '<h3 id="tk-' + i + '">' + esc(t.feeling) + '</h3>' +
          '<dl><div><dt>It comes from</dt><dd class="src">' + esc(t.source) + '</dd></div>' +
          '<div><dt>How I would adapt it</dt><dd>' + esc(t.adaptation) + '</dd></div></dl>' +
          '<div class="test"><span class="k">' + icon('test') + 'Test question</span><p>' + esc(t.test) + '</p></div>' +
          '</article></li>';
      }).join('') + '</ul>';
  }

  /* who wrote it: the contributor, or the site author */
  function authorChip(g) {
    var a = g.author && typeof g.author.name === 'string' && g.author.name.trim() ? g.author : null;
    var name = a ? a.name.trim() : (META.author || '');
    var link = a ? a.link : META.portfolio;
    if (!name) return '';
    var safe = typeof link === 'string' && /^https:\/\/[^\s"<>]+$/.test(link.trim());
    return '<li class="mchip"><span class="k">By</span>' + (safe ? '<a href="' + esc(link.trim()) + '" rel="noopener">' + esc(name) + '</a>' : esc(name)) + '</li>';
  }

  /* minutes to read every text field of a teardown, at about 220 words a minute */
  function readMins(g) {
    var words = 0;
    (function walk(v) {
      if (typeof v === 'string') { if (!/^(https?:|Q\d+$)/.test(v)) words += v.split(/\s+/).filter(Boolean).length; }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (k !== 'slug' && k !== 'wikidata') walk(v[k]); });
    })(g);
    return Math.max(1, Math.round(words / 220));
  }

  function game(g) {
    document.title = g.title + ' teardown | ' + SITE;
    var idx = GAMES.indexOf(g);
    var prev = GAMES[idx - 1], next = GAMES[idx + 1];
    var pk = g.pacing.points[peakOf(g)];
    var subs = {
      overview: 'What the game is doing, the fantasy it sells, and how it teaches the player.',
      loop: 'The actions the player repeats, in order, and what each one feels like.',
      systems: plural(g.systems.length, 'system', 'systems') + ' grouped by layer. Open one to read what it does, why it exists and its effect on the player.',
      feedback: 'How the game tells the player what is happening, split by channel.',
      pacing: 'How intensity rises and falls across a typical stretch of play.',
      takeaways: 'Where the design pulls in two directions, and what I would adapt for my own projects.'
    };
    var body = {
      overview: overviewHTML, loop: loopHTML, systems: systemsHTML,
      feedback: feedbackHTML, pacing: paceHTML, takeaways: takeawaysHTML
    };

    app.innerHTML =
      '<div class="band"><div class="wrap band-in">' +
      '<div class="band-top"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Teardowns</a>' + icon('chevron') + '<span aria-current="page">' + esc(g.title) + '</span></nav>' +
      '<span class="band-acts"><button type="button" class="btn btn-sm" id="print-btn">' + icon('download') + 'Save as PDF</button>' +
      '<a class="btn btn-sm" href="#/edit/' + encodeURIComponent(g.slug) + '">' + icon('edit') + 'Edit this teardown</a></span></div>' +
      '<div class="band-grid"><div>' +
      '<p class="eyebrow"><span class="pip" aria-hidden="true"></span>Teardown ' + pad2(idx + 1) + ' · ' + esc(g.genre) + '</p>' +
      '<h1>' + esc(g.title) + '</h1>' +
      '<p class="hook">' + esc(g.hook) + '</p>' +
      '<ul class="mchips" aria-label="Details">' +
      '<li class="mchip"><span class="k">Studio</span>' + esc(g.studio) + '</li>' +
      '<li class="mchip"><span class="k">Year</span>' + esc(g.year) + '</li>' +
      '<li class="mchip"><span class="k">Read</span>' + readMins(g) + ' min</li>' +
      authorChip(g) +
      g.tags.map(function (t) { return '<li class="mchip">' + esc(t) + '</li>'; }).join('') +
      '</ul></div>' +
      '<aside class="glance" aria-label="At a glance"><div class="gthumb"><span class="gnum">AT A GLANCE</span>' + thumbSVG(g, 'gl') + '</div>' +
      '<dl><div><dt>Loop steps</dt><dd>' + g.coreLoop.steps.length + '</dd></div>' +
      '<div><dt>Systems</dt><dd>' + g.systems.length + '</dd></div>' +
      '<div><dt>Peak intensity</dt><dd>' + esc(pk.v) + '<small>/ 10</small></dd></div>' +
      '<div><dt>Takeaways</dt><dd>' + g.takeaways.length + '</dd></div></dl></aside>' +
      '</div></div></div>' +

      '<div class="wrap g-layout">' +
      '<nav class="toc" aria-label="On this page"><p class="toc-title">On this page</p><ol>' +
      SECTIONS.map(function (s, i) {
        return '<li><a href="' + gameHref(g, s[0]) + '" data-sec="' + s[0] + '"><span class="n">' + pad2(i + 1) + '</span>' + s[1] + '</a></li>';
      }).join('') + '</ol>' +
      '<div class="toc-progress" aria-hidden="true"><i id="toc-bar"></i></div>' +
      ((prev || next) ? '<div class="toc-foot">' +
        (prev ? '<a href="' + gameHref(prev) + '"><span>Previous</span>' + esc(prev.title) + '</a>' : '') +
        (next ? '<a href="' + gameHref(next) + '"><span>Next</span>' + esc(next.title) + '</a>' : '') + '</div>' : '') +
      '</nav>' +
      '<article class="g-body" aria-label="' + esc(g.title) + ' teardown">' +
      SECTIONS.map(function (s, i) {
        return '<section class="sec" id="s-' + s[0] + '" aria-labelledby="h-' + s[0] + '">' + secHead(i, s[0], s[1], subs[s[0]]) + body[s[0]](g) + '</section>';
      }).join('') + similarHTML(g) +
      ((prev || next) ? '<nav class="pager" aria-label="Other teardowns">' +
        (prev ? '<a href="' + gameHref(prev) + '"><span class="k">' + icon('back') + 'Previous teardown</span><span class="t">' + esc(prev.title) + '</span><span class="h">' + esc(prev.hook) + '</span></a>' : '') +
        (next ? '<a class="next" href="' + gameHref(next) + '"><span class="k">Next teardown' + icon('arrow') + '</span><span class="t">' + esc(next.title) + '</span><span class="h">' + esc(next.hook) + '</span></a>' : '') +
        '</nav>' : '') +
      '</article></div>';

    initLoop(app, g);
    initSystems(app);
    var stopPace = initPacing(app, g);
    var stopSpy = initSpy(g);

    /* print: open every system card first, then put them back */
    var wasOpen = [];
    function beforePrint() { wasOpen = all('.sys', app).map(function (d) { var o = d.open; d.open = true; return o; }); }
    function afterPrint() { all('.sys', app).forEach(function (d, i) { d.open = !!wasOpen[i]; }); }
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
    cleanup = function () {
      stopPace(); stopSpy();
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
    return 'game';
  }

  /* teardowns that share tags, genre words and layers with this one */
  function similarHTML(g) {
    function words(x) { return x.tags.map(function (t) { return t.toLowerCase(); }).concat(String(x.genre).toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 3; })); }
    function layers(x) { var o = {}; x.systems.forEach(function (s) { o[s.layer] = (o[s.layer] || 0) + 1; }); return o; }
    var mine = words(g), ml = layers(g);
    var ranked = GAMES.filter(function (o) { return o !== g; }).map(function (o) {
      var ow = words(o), shared = mine.filter(function (w, i) { return ow.indexOf(w) >= 0 && mine.indexOf(w) === i; });
      var ol = layers(o), overlap = 0;
      LAYERS.forEach(function (l) { overlap += Math.min(ml[l.id] || 0, ol[l.id] || 0); });
      return { g: o, shared: shared, score: shared.length * 3 + overlap / Math.max(1, g.systems.length) };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
    if (!ranked.length) return '';
    return '<section class="similar" aria-labelledby="sim-h"><h2 class="sub-h" id="sim-h">' + icon('arrow') + 'Similar teardowns</h2><ul class="recs">' +
      ranked.map(function (x, i) {
        var tags = x.g.tags.filter(function (t) { return x.shared.indexOf(t.toLowerCase()) >= 0; });
        return '<li><a class="rec" href="' + gameHref(x.g) + '"><span class="rec-thumb gthumb">' + thumbSVG(x.g, 'sm' + i) + '</span>' +
          '<span class="rec-b"><span class="rec-top"><span class="rec-match">' + esc(x.g.genre) + '</span></span><span class="rec-t">' + esc(x.g.title) + '</span>' +
          '<span class="rec-why">' + (tags.length ? 'Also ' + tags.map(function (t) { return t.toLowerCase(); }).join(', ') : esc(x.g.hook)) + '</span></span></a></li>';
      }).join('') + '</ul></section>';
  }

  /* --- table of contents: scroll-spy, progress, smooth jumps --- */
  function initSpy(g) {
    var links = all('.toc a[data-sec]', app);
    var secs = SECTIONS.map(function (s) { return document.getElementById('s-' + s[0]); });
    var ol = app.querySelector('.toc ol');
    var bar = document.getElementById('toc-bar');
    var body = app.querySelector('.g-body');
    var active = -1, ticking = false;

    /* a section counts as current once its top passes the sticky header (+ TOC bar on small screens) */
    function offset() { return (parseFloat(getComputedStyle(secs[0]).scrollMarginTop) || 84) + 40; }
    function update() {
      ticking = false;
      var y = offset(), idx = 0;
      secs.forEach(function (s, i) { if (s.getBoundingClientRect().top - y <= 0) idx = i; });
      var doc = document.documentElement;
      if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 4) idx = secs.length - 1;
      if (idx !== active) {
        active = idx;
        links.forEach(function (a, i) {
          if (i === idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
        /* keep the active chip visible in the horizontal bar on small screens */
        if (ol.scrollWidth > ol.clientWidth) {
          var a = links[idx];
          ol.scrollTo({ left: a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        }
      }
      var r = body.getBoundingClientRect();
      var p = clamp((y - r.top) / Math.max(1, r.height - window.innerHeight + y), 0, 1);
      bar.style.width = (p * 100).toFixed(1) + '%';
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        var id = a.getAttribute('data-sec');
        try { history.replaceState(null, '', gameHref(g, id)); } catch (err) { /* ignore */ }
        goSection(id, true);
      });
    });
    update();
    return function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }

  function goSection(id, animate) {
    var key = ALIAS[id] || id;
    var el = document.getElementById('s-' + key);
    if (!el) return false;
    el.scrollIntoView({ behavior: animate && !reduceMotion.matches ? 'smooth' : 'auto', block: 'start' });
    var h = document.getElementById('h-' + key);
    if (h) h.focus({ preventScroll: true });
    return true;
  }

  /* ================================================================
     PROBLEMS  (find how games solve a design problem)
  ================================================================ */
  function problems() {
    document.title = 'Problems | ' + SITE;
    var withSols = PROBLEMS.map(function (p) { var s = solutionsOf(p.id); return { p: p, sols: s, games: gamesIn(s) }; });
    var tagged = withSols.reduce(function (a, x) { return a + x.sols.length; }, 0);
    var side = '<aside class="glance" aria-label="Problems in numbers"><dl>' +
      '<div><dt>Problems</dt><dd>' + PROBLEMS.length + '</dd></div><div><dt>Solutions</dt><dd>' + tagged + '</dd></div>' +
      '<div><dt>Games</dt><dd>' + GAMES.length + '</dd></div><div><dt>Layers</dt><dd>' + LAYERS.length + '</dd></div></dl></aside>';
    app.innerHTML = bandHTML('Problems', 'For anyone making a game', 'Design problems',
      'Start from the problem you have, not from a game. Each problem gathers the systems that answer it across every teardown, with what they do, why they exist and the effect on the player.', side) +
      '<div class="wrap page-body">' + subnav('problems') + '<div style="height:1.5rem"></div>' +
      (PROBLEMS.length ?
        '<div class="block-head"><div><p class="eyebrow">Library</p><h2 id="pl-h">' + plural(PROBLEMS.length, 'problem', 'problems') + '</h2></div>' +
        '<label class="search"><span class="sr">Search problems</span>' + icon('search') + '<input type="search" id="pq" placeholder="Search problems" autocomplete="off"></label></div>' +
        '<p class="status" id="pstatus" role="status"></p>' +
        '<ul class="pcards" id="prows" aria-labelledby="pl-h"></ul>' +
        '<p id="pempty" class="notice" hidden>No problem matches this search.</p>'
        :
        '<div class="p-empty card"><span class="layer-ic" aria-hidden="true">' + icon('problem') + '</span><div>' +
        '<h2>The problem list is being written</h2>' +
        '<p>Each problem will be a question a designer asks, such as how to make failure feel fair. It will collect the systems from every teardown that answer it, so you can compare solutions from different games side by side.</p>' +
        '<div class="actions"><a class="btn btn-primary" href="#/systems">Browse all systems</a><a class="btn" href="#/">Browse the teardowns</a></div></div></div>') +
      '</div>';
    if (!PROBLEMS.length) return 'problems';

    var q = document.getElementById('pq'), rows = document.getElementById('prows');
    var st = document.getElementById('pstatus'), empty = document.getElementById('pempty');
    function apply() {
      var term = q.value.trim().toLowerCase();
      var list = withSols.filter(function (x) {
        var hay = [x.p.name, x.p.question, x.p.idea].concat(x.sols.map(function (y) { return y.s.name; })).join(' ').toLowerCase();
        return !term || hay.indexOf(term) >= 0;
      });
      rows.innerHTML = list.map(function (x) {
        var layers = [];
        x.sols.forEach(function (y) { if (layers.indexOf(y.s.layer) < 0) layers.push(y.s.layer); });
        return '<li><a class="pcard" href="#/problem/' + x.p.id + '">' +
          '<span class="pcard-top"><span class="layer-ic" aria-hidden="true">' + icon('problem') + '</span>' +
          '<span class="mono">' + plural(x.sols.length, 'SOLUTION', 'SOLUTIONS') + ' · ' + plural(x.games.length, 'GAME', 'GAMES') + '</span></span>' +
          '<h3>' + esc(x.p.name) + '</h3>' + (x.p.question ? '<p>' + esc(x.p.question) + '</p>' : '') +
          '<span class="pcard-games">' + (x.games.length ? x.games.map(function (g) { return '<span class="tag">' + esc(g.title) + '</span>'; }).join('') : '<span class="tag tag-dash">No examples yet</span>') + '</span>' +
          '</a></li>';
      }).join('');
      empty.hidden = list.length > 0;
      st.textContent = 'SHOWING ' + list.length + ' OF ' + plural(PROBLEMS.length, 'PROBLEM', 'PROBLEMS');
    }
    q.addEventListener('input', apply);
    apply();
    return 'problems';
  }

  /* tabs shared by the two "making a game" pages */
  function subnav(cur) {
    return '<nav class="subnav" aria-label="Design library"><a href="#/problems"' + (cur === 'problems' ? ' aria-current="page"' : '') + '>' + icon('problem') + 'Problems</a>' +
      '<a href="#/systems"' + (cur === 'systems' ? ' aria-current="page"' : '') + '>' + icon('System') + 'All systems</a></nav>';
  }

  /* ================================================================
     SYSTEMS LIBRARY  (every system from every teardown)
  ================================================================ */
  var sysLayer = '';
  function systemsLib() {
    document.title = 'All systems | ' + SITE;
    var list = [];
    GAMES.forEach(function (g) { g.systems.forEach(function (s) { list.push({ g: g, s: s }); }); });
    var counts = {};
    list.forEach(function (x) { counts[x.s.layer] = (counts[x.s.layer] || 0) + 1; });
    var max = Math.max.apply(null, LAYERS.map(function (l) { return counts[l.id] || 0; }).concat([1]));
    var side = '<aside class="glance stack" aria-label="Systems per layer"><div class="stack-h"><span>SYSTEMS PER LAYER</span><span>' + list.length + ' TOTAL</span></div><ol>' +
      LAYERS.map(function (l, i) {
        var c = counts[l.id] || 0;
        return '<li><span class="layer-ic" aria-hidden="true">' + icon(l.id) + '</span><span class="nm"><span class="mono">L' + (i + 1) + '</span>' + esc(l.id) + '</span>' +
          '<span class="sbar" aria-hidden="true"><b style="width:' + Math.round((c / max) * 100) + '%"></b></span><span class="v">' + c + '</span></li>';
      }).join('') + '</ol></aside>';
    app.innerHTML = bandHTML('All systems', 'For anyone making a game', 'All systems',
      'Every system from every teardown in one place: what it does, why it exists and its effect on the player. Search for a mechanic or filter by layer, then open the game it comes from.', side) +
      '<div class="wrap page-body">' + subnav('systems') +
      '<div class="block-head" style="margin-top:1.5rem"><div class="chips" role="group" aria-label="Filter by layer">' +
      '<button type="button" class="chip" data-ly="" aria-pressed="' + (!sysLayer) + '">All<span class="n">' + list.length + '</span></button>' +
      LAYERS.map(function (l) { return '<button type="button" class="chip" data-ly="' + esc(l.id) + '" aria-pressed="' + (sysLayer === l.id) + '">' + esc(l.id) + '<span class="n">' + (counts[l.id] || 0) + '</span></button>'; }).join('') +
      '</div><label class="search"><span class="sr">Search systems</span>' + icon('search') + '<input type="search" id="sq" placeholder="Search, e.g. healing or map" autocomplete="off"></label></div>' +
      '<p class="status" id="sstatus" role="status"></p><ul class="sol-grid sl-grid" id="srows"></ul>' +
      '<p id="sempty" class="notice" hidden>No system matches. Clear the search or choose "All".</p></div>';

    var q = document.getElementById('sq'), rows = document.getElementById('srows');
    var st = document.getElementById('sstatus'), empty = document.getElementById('sempty');
    function apply() {
      var term = q.value.trim().toLowerCase();
      var shown = list.filter(function (x) {
        var hay = [x.s.name, x.s.what, x.s.why, x.s.effect, x.g.title].join(' ').toLowerCase();
        return (!sysLayer || x.s.layer === sysLayer) && (!term || hay.indexOf(term) >= 0);
      });
      rows.innerHTML = shown.map(function (x, i) {
        return '<li><article class="card sol" aria-label="' + esc(x.s.name + ' in ' + x.g.title) + '">' +
          '<div class="sol-top"><a class="sol-game" href="' + gameHref(x.g, 'systems') + '"><span class="thumb-sm">' + thumbSVG(x.g, 's' + i) + '</span>' + esc(x.g.title) + '</a>' +
          '<span class="sys-top">' + layerDots(x.s.layer) + esc(x.s.layer) + '</span></div>' +
          '<h3>' + esc(x.s.name) + '</h3>' +
          '<dl><div><dt>What it does</dt><dd>' + esc(x.s.what) + '</dd></div>' +
          '<div><dt>Why it exists</dt><dd>' + esc(x.s.why) + '</dd></div>' +
          '<div><dt>Effect on the player</dt><dd>' + esc(x.s.effect) + '</dd></div></dl>' +
          (problemsOfSystem(x.s).length ? '<p class="sys-probs"><span>' + icon('problem') + 'Answers</span>' + problemsOfSystem(x.s).map(function (p) { return '<a href="#/problem/' + p.id + '">' + esc(p.name) + '</a>'; }).join('') + '</p>' : '') +
          '</article></li>';
      }).join('');
      empty.hidden = shown.length > 0;
      st.textContent = 'SHOWING ' + shown.length + ' OF ' + plural(list.length, 'SYSTEM', 'SYSTEMS') + ' FROM ' + plural(GAMES.length, 'GAME', 'GAMES');
    }
    all('[data-ly]', app).forEach(function (c) {
      c.addEventListener('click', function () {
        sysLayer = c.getAttribute('data-ly');
        all('[data-ly]', app).forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        apply();
      });
    });
    q.addEventListener('input', apply);
    apply();
    return 'problems';
  }

  function problem(p) {
    document.title = p.name + ' | ' + SITE;
    var sols = solutionsOf(p.id), games = gamesIn(sols);
    var idx = PROBLEMS.indexOf(p), prev = PROBLEMS[idx - 1], next = PROBLEMS[idx + 1];
    /* problems that share systems with this one */
    var related = PROBLEMS.filter(function (o) {
      return o !== p && sols.some(function (x) { return (x.s.problems || []).indexOf(o.id) >= 0; });
    });
    var side = '<aside class="glance" aria-label="This problem in numbers"><dl>' +
      '<div><dt>Solutions</dt><dd>' + sols.length + '</dd></div><div><dt>Games</dt><dd>' + games.length + '</dd></div></dl></aside>';
    app.innerHTML =
      '<div class="band"><div class="wrap band-in">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/problems">Problems</a>' + icon('chevron') + '<span aria-current="page">' + esc(p.name) + '</span></nav>' +
      '<div class="band-grid"><div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>Design problem</p><h1>' + esc(p.name) + '</h1>' +
      (p.question ? '<p class="hook">' + esc(p.question) + '</p>' : '') + '</div>' + side + '</div></div></div>' +
      '<div class="wrap page-body">' +
      (p.idea ? '<div class="callout p-idea">' + icon('problem') + '<p>' + esc(p.idea) + '</p></div>' : '') +
      '<section class="block" aria-labelledby="sol-h" style="padding-top:2.5rem"><div class="block-head"><div><p class="eyebrow">How games answer it</p>' +
      '<h2 id="sol-h">' + plural(sols.length, 'solution', 'solutions') + '</h2></div></div>' +
      (sols.length ? '<ul class="sol-grid">' + sols.map(function (x, i) {
        return '<li><article class="card sol" aria-label="' + esc(x.s.name + ' in ' + x.g.title) + '">' +
          '<div class="sol-top"><a class="sol-game" href="' + gameHref(x.g, 'systems') + '"><span class="thumb-sm">' + thumbSVG(x.g, 'p' + i) + '</span>' + esc(x.g.title) + '</a>' +
          '<span class="sys-top">' + layerDots(x.s.layer) + esc(x.s.layer) + '</span></div>' +
          '<h3>' + esc(x.s.name) + '</h3>' +
          '<dl><div><dt>What it does</dt><dd>' + esc(x.s.what) + '</dd></div>' +
          '<div><dt>Why it exists</dt><dd>' + esc(x.s.why) + '</dd></div>' +
          '<div><dt>Effect on the player</dt><dd>' + esc(x.s.effect) + '</dd></div></dl></article></li>';
      }).join('') + '</ul>' : '') +
      (games.length < 2 ? '<p class="notice">' + (games.length ? 'Only one game answers this problem so far.' : 'No teardown answers this problem yet.') +
        ' Add a teardown in the <a href="#/edit">editor</a> and tag its systems with this problem, or <a href="#/contribute">send one to the site</a>.</p>' : '') +
      '</section>' +
      (related.length ? '<section class="block" aria-labelledby="rel-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Often solved together</p><h2 id="rel-h">Related problems</h2></div></div>' +
        '<ul class="rel">' + related.map(function (o) { return '<li><a class="chip" href="#/problem/' + o.id + '">' + icon('problem') + esc(o.name) + '</a></li>'; }).join('') + '</ul></section>' : '') +
      ((prev || next) ? '<nav class="pager" aria-label="Other problems" style="margin-top:3rem">' +
        (prev ? '<a href="#/problem/' + prev.id + '"><span class="k">' + icon('back') + 'Previous problem</span><span class="t">' + esc(prev.name) + '</span></a>' : '') +
        (next ? '<a class="next" href="#/problem/' + next.id + '"><span class="k">Next problem' + icon('arrow') + '</span><span class="t">' + esc(next.name) + '</span></a>' : '') +
        '</nav>' : '') +
      '</div>';
    return 'problems';
  }

  /* ================================================================
     COMPARE
  ================================================================ */
  function bandHTML(crumb, eyebrow, title, text, side) {
    return '<div class="band"><div class="wrap band-in">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Teardowns</a>' + icon('chevron') + '<span aria-current="page">' + esc(crumb) + '</span></nav>' +
      '<div class="band-grid"><div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1>' +
      '<p class="hook">' + esc(text) + '</p></div>' + (side || '') + '</div></div></div>';
  }

  function compare() {
    document.title = 'Compare | ' + SITE;
    if (GAMES.length < 2) {
      app.innerHTML = bandHTML('Compare', 'Compare', 'Compare', 'Comparing needs at least two teardowns.') +
        '<div class="wrap page-body"><p class="notice">Add another teardown in the <a href="#/edit">editor</a> to see the comparison.</p></div>';
      return 'compare';
    }
    var rows = META.compareRows || [];
    /* start with three games side by side; the picker adds the rest */
    var selected = GAMES.slice(0, 3).map(function (g) { return g.slug; });

    app.innerHTML =
      bandHTML('Compare', plural(GAMES.length, 'game', 'games') + ' · ' + plural(rows.length, 'question', 'questions'), 'Compare',
        'The same questions asked of every game. Choose which ones to put side by side.',
        '<aside class="glance" aria-label="Pacing of every game"><div class="gthumb" style="border-bottom:0"><span class="gnum">ALL CURVES</span><div style="padding:1.6rem .5rem .25rem">' + heroSVG(GAMES.slice(0, 3)) + '</div></div></aside>') +
      '<div class="wrap page-body">' +
      '<fieldset class="picker"><legend>Games in the table</legend>' +
      GAMES.map(function (g) {
        return '<label><input type="checkbox" value="' + esc(g.slug) + '"' + (selected.indexOf(g.slug) >= 0 ? ' checked' : '') + '><span class="chip"><span class="box">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + ICON.check + '</svg></span>' + esc(g.title) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<div class="table-wrap" tabindex="0" role="region" aria-label="Comparison table" id="table-wrap"></div>' +
      '<section class="block" aria-labelledby="ins-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Reading</p><h2 id="ins-h">What the comparison shows</h2></div></div>' +
      '<ol class="ins-grid">' + (META.compareInsight || []).map(function (t, i) {
        return '<li class="card ins"><span class="mono">' + pad2(i + 1) + '</span><p>' + esc(t) + '</p></li>';
      }).join('') + '</ol></section></div>';

    var wrap = document.getElementById('table-wrap');
    var boxes = all('.picker input', app);
    function cell(g, key) {
      if (key === 'genre') return g.genre;
      return (g.compare && g.compare[key]) || 'Not filled in yet.';
    }
    function draw() {
      var list = GAMES.filter(function (g) { return selected.indexOf(g.slug) >= 0; });
      wrap.innerHTML = '<table class="cmp"><caption class="sr">Comparison of ' + list.map(function (g) { return esc(g.title); }).join(', ') + '</caption>' +
        '<thead><tr><th scope="col"><span class="q">Question</span></th>' +
        list.map(function (g) {
          return '<th scope="col"><a href="' + gameHref(g) + '"><span class="thumb-sm">' + thumbSVG(g, 't' + GAMES.indexOf(g)) + '</span>' + esc(g.title) + '</a></th>';
        }).join('') +
        '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><th scope="row">' + esc(r.label) + '</th>' +
            list.map(function (g) { return '<td data-label="' + esc(g.title) + '">' + esc(cell(g, r.key)) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
    }
    boxes.forEach(function (b) {
      b.addEventListener('change', function () {
        var now = boxes.filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        if (now.length < 2) { b.checked = true; return; } /* keep at least two games in the table */
        selected = now;
        draw();
      });
    });
    draw();
    return 'compare';
  }

  /* ================================================================
     METHOD
  ================================================================ */
  function method() {
    document.title = 'Method | ' + SITE;
    var anatomy = [
      ['Overview', 'Summary, fantasy, facts and onboarding'],
      ['Core loop', 'Repeated actions and feelings'],
      ['Systems', 'What, why and effect, by layer'],
      ['Feedback', 'Visual, audio and mechanical'],
      ['Pacing', 'Intensity across a stretch of play'],
      ['Takeaways', 'Tensions, adaptations and tests']
    ];
    var counts = {}, total = 0;
    GAMES.forEach(function (g) { g.systems.forEach(function (s) { counts[s.layer] = (counts[s.layer] || 0) + 1; total++; }); });
    var max = Math.max.apply(null, LAYERS.map(function (l) { return counts[l.id] || 0; }).concat([1]));
    var side = '<aside class="glance stack" aria-label="Systems per layer across all teardowns">' +
      '<div class="stack-h"><span>SYSTEMS PER LAYER</span><span>' + total + ' TOTAL</span></div><ol>' +
      LAYERS.map(function (l, i) {
        var c = counts[l.id] || 0;
        return '<li><span class="layer-ic" aria-hidden="true">' + icon(l.id) + '</span><span class="nm"><span class="mono">L' + (i + 1) + '</span>' + esc(l.id) + '</span>' +
          '<span class="sbar" aria-hidden="true"><b style="width:' + Math.round((c / max) * 100) + '%"></b></span><span class="v">' + c + '</span></li>';
      }).join('') + '</ol></aside>';
    app.innerHTML =
      bandHTML('Method', 'Method', 'How a teardown is built',
        'The template behind every teardown: six sections, five layers and five questions, used in the same order for every game.', side) +
      '<div class="wrap page-body">' +
      '<div class="m-intro"><div class="lead"><p>A teardown is not a review and it has no score. It is a way to find out what a game asks the player to do, what it gives back, and why that works, so the useful parts can be adapted to other projects.</p>' +
      '<p style="color:var(--text-2)">Every teardown uses the same six sections in the same order, which is what makes the comparison possible.</p></div>' +
      '<div class="card m-note"><h3>About the diagrams</h3><p>The core loops and pacing curves are my own readings of each game. The pacing values are subjective estimates of intensity, not measurements. No screenshots or assets from the games are used.</p></div></div>' +

      '<section class="block" aria-labelledby="an-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Template</p><h2 id="an-h">Anatomy of a teardown</h2></div></div>' +
      '<ol class="anatomy">' + anatomy.map(function (a) { return '<li>' + a[0] + '<span>' + a[1] + '</span></li>'; }).join('') + '</ol></section>' +

      '<section class="block" aria-labelledby="ly-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Five layers</p><h2 id="ly-h">Every element sits in one layer</h2>' +
      '<p class="sub">Every element of a game is placed in one layer, so mechanics, systems, content, narrative and presentation are never mixed up.</p></div></div>' +
      '<ol class="layers">' + LAYERS.map(function (l, i) {
        return '<li><div class="layer-card"><span class="lnum">L' + (i + 1) + '</span><span class="layer-ic">' + icon(l.id) + '</span>' +
          '<h3>' + esc(l.id) + '</h3><p>' + esc(l.def) + '</p></div></li>';
      }).join('') + '</ol></section>' +

      '<section class="block" aria-labelledby="q-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Lens</p><h2 id="q-h">Five questions</h2></div></div>' +
      '<ol class="q-grid">' +
      '<li>What does the player do most often, and what does the game give back?</li>' +
      '<li>What is scarce, and what decision does that scarcity create?</li>' +
      '<li>What does the player know, and how does the game tell them?</li>' +
      '<li>What does failure cost, and what does the player do next?</li>' +
      '<li>Which sensation could I use in my own project, and which system creates it?</li></ol></section>' +

      '<section class="block" aria-labelledby="cl-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">For classes</p><h2 id="cl-h">Using the method in a class</h2>' +
      '<p class="sub">Every student works with the same sections and layers, so their teardowns can be read and compared the same way.</p></div></div>' +
      '<ol class="pub-steps">' +
      '<li class="card"><span class="mono">01</span><h3>' + icon('teach') + 'Share the method</h3><p>Send this page. It explains the six sections, the five layers and the five questions.</p></li>' +
      '<li class="card"><span class="mono">02</span><h3>' + icon('edit') + 'Students write</h3><p>Each student adds a game in the <a href="#/new">editor</a>, fills in the template and exports it.</p></li>' +
      '<li class="card"><span class="mono">03</span><h3>' + icon('play') + 'Play with notes</h3><p>Before writing, students can log moments in the <a href="#/diary">diary</a> and turn them into a teardown draft.</p></li>' +
      '</ol><p class="notice" style="margin-top:1rem">Class spaces with shared assignments and submissions need user accounts, which this site does not have yet. For now, work is saved in each student\'s browser and shared by exporting it.</p></section>' +
      '</div>';
    return 'method';
  }

  function notFound() {
    document.title = 'Page not found | ' + SITE;
    app.innerHTML = bandHTML('Not found', 'Error 404', 'This page wandered off', 'The address may be old or mistyped. Here are a few places worth going instead.') +
      '<div class="wrap page-body"><div class="actions"><a class="btn btn-primary" href="#/">' + icon('back') + 'Back to the teardowns</a>' +
      '<button type="button" class="btn" id="nf-search">' + icon('search') + 'Search the site</button></div>' +
      '<ul class="nf-list">' + GAMES.slice(0, 3).map(function (g) {
        return '<li><a class="port-card" href="' + gameHref(g) + '"><span><span class="port-name">' + esc(g.title) + '</span>' +
          '<span class="port-sub">' + esc(g.hook) + '</span></span>' + icon('arrow') + '</a></li>';
      }).join('') + '</ul></div>';
    var sb = document.getElementById('nf-search');
    if (sb) sb.addEventListener('click', function () { openSearch(); });
    return 'home';
  }

  /* reading progress on teardown pages */
  var rbar = null, rbarOn = false;
  function paintReadBar() {
    if (!rbarOn) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    rbar.style.transform = 'scaleX(' + (h > 0 ? clamp(window.scrollY / h, 0, 1) : 0) + ')';
  }
  function readBar(on) {
    if (!rbar) {
      rbar = document.createElement('div'); rbar.className = 'readbar'; rbar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(rbar);
      window.addEventListener('scroll', function () { requestAnimationFrame(paintReadBar); }, { passive: true });
      window.addEventListener('resize', paintReadBar);
    }
    rbarOn = on; rbar.hidden = !on;
    if (on) paintReadBar();
  }

  function failed(err) {
    console.error(err);
    app.innerHTML = '<div class="wrap page-body"><h1>Something broke</h1><p class="notice">This page could not be drawn. Check the browser console for details, then <a href="#/">go back to the list</a>.</p></div>';
  }

  /* ---------- router ---------- */
  function parts() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(function (p) {
      try { return decodeURIComponent(p); } catch (e) { return p; }
    });
  }

  function markNav(name) {
    all('.site-nav a').forEach(function (a) {
      if (a.getAttribute('data-route') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* extra views (the editor) register here: EXT['edit'] = function (parts) {...} */
  var EXT = {};
  var leaveGuard = null;     /* returns false to stay on the page (unsaved changes) */
  var lastHash = location.hash;

  var localbar = document.getElementById('localbar');
  function paintLocalBar(name) {
    if (!localbar) return;
    var c = store.counts();
    localbar.hidden = !c.any || name === 'edit';
    if (localbar.hidden) return;
    var bits = [];
    if (c.edited) bits.push(c.edited + ' edited');
    if (c.added) bits.push(c.added + ' added');
    localbar.innerHTML = '<div class="wrap localbar-in"><p>' + icon('alert') +
      '<span>You are seeing changes saved in this browser (' + bits.join(', ') + '). Other visitors see them only after you export data.js and publish it.</span></p>' +
      '<a href="#/edit">Open the editor' + icon('arrow') + '</a></div>';
  }

  function route(moveFocus) {
    var p = parts(), name = 'home', slug = null;

    if (leaveGuard && location.hash !== lastHash && !leaveGuard()) {
      try { history.replaceState(null, '', lastHash || '#/'); } catch (e) { /* ignore */ }
      return;
    }
    /* same teardown, different section: scroll instead of redrawing */
    if (p[0] === 'game' && view.name === 'game' && view.slug === p[1] && document.getElementById('s-overview')) {
      lastHash = location.hash;
      goSection(p[2] || 'overview', true);
      return;
    }
    if (cleanup) { try { cleanup(); } catch (e) { /* ignore */ } cleanup = null; }
    leaveGuard = null;
    lastHash = location.hash;

    try {
      if (EXT[p[0]]) name = EXT[p[0]](p);
      else if (!GAMES.length) {
        app.innerHTML = '<div class="wrap page-body"><h1>No teardowns</h1><p class="notice">No valid teardowns were found. Open the browser console to see what is missing, or add one in the <a href="#/edit">editor</a>.</p></div>';
      } else if (!p[0]) name = home();
      else if (p[0] === 'compare') name = compare();
      else if (p[0] === 'method') name = method();
      else if (p[0] === 'problems') name = problems();
      else if (p[0] === 'systems') name = systemsLib();
      else if (p[0] === 'problem') { var pr = problemOf(p[1]); name = pr ? problem(pr) : notFound(); }
      else if (p[0] === 'game') {
        var g = GAMES.filter(function (x) { return x.slug === p[1]; })[0];
        if (g) { name = game(g); slug = g.slug; } else name = notFound();
      } else name = notFound();
    } catch (err) { failed(err); }

    view = { name: slug ? 'game' : name, slug: slug };
    /* a quiet entrance on every page change, not on redraws */
    app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
    readBar(!!slug);
    reveal();
    markNav(name === 'game' ? 'home' : name);
    paintLocalBar(name);
    setMenu(false);

    if (slug && p[2]) {
      /* deep link to a section (also accepts the old tab ids) */
      requestAnimationFrame(function () { if (!goSection(p[2], false)) window.scrollTo(0, 0); });
    } else if (moveFocus) {
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', function () {
    var p = parts();
    var sameGame = p[0] === 'game' && view.name === 'game' && view.slug === p[1];
    /* cross-fade between pages where the browser can; never while a leave check may ask a question */
    if (document.startViewTransition && !reduceMotion.matches && !leaveGuard && !sameGame) {
      document.documentElement.classList.add('vt-page');
      var t = document.startViewTransition(function () { route(true); });
      t.ready.catch(function () { /* skipped, the page still changed */ });
      t.finished.then(function () { document.documentElement.classList.remove('vt-page'); }, function () { document.documentElement.classList.remove('vt-page'); });
    } else route(true);
  });

  /* ---------- header edge and scroll reveals ---------- */
  var hdr = document.querySelector('.site-header');
  function paintHeader() { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 6); }
  window.addEventListener('scroll', paintHeader, { passive: true });
  paintHeader();

  /* anything that has reached the lower part of the screen, or was scrolled past, is shown */
  var REVEAL = '.tally, .ways-list > li, .cards > li, .layers > li, .teaser, .note, .hi, .block-head, .sec, .recs > li, .shelves > *, .fy > li';
  var rvTick = false;
  function checkReveal() {
    rvTick = false;
    var line = window.innerHeight * 0.92;
    all('.rv:not(.in)', app).forEach(function (el) { if (el.getBoundingClientRect().top < line) el.classList.add('in'); });
  }
  window.addEventListener('scroll', function () { if (!rvTick) { rvTick = true; requestAnimationFrame(checkReveal); } }, { passive: true });
  window.addEventListener('resize', checkReveal);
  function reveal() {
    if (reduceMotion.matches || !window.requestAnimationFrame) return;
    var n = 0;
    all(REVEAL, app).forEach(function (el) {
      if (el.classList.contains('rv')) return;
      /* stagger siblings in the same list */
      var prev = el.previousElementSibling;
      n = prev && prev.classList.contains('rv') ? n + 1 : 0;
      el.style.setProperty('--rv-d', Math.min(n, 6) * 60 + 'ms');
      el.classList.add('rv');
    });
    requestAnimationFrame(function () { requestAnimationFrame(checkReveal); });
  }
  window.addEventListener('beforeprint', function () { all('.rv', app).forEach(function (el) { el.classList.add('in'); }); });

  /* ---------- search everywhere (Ctrl/Cmd + K, or "/") ---------- */
  var PAGES = [['Teardowns', '#/'], ['Design problems', '#/problems'], ['All systems', '#/systems'], ['Compare', '#/compare'],
    ['My diary', '#/diary'], ['My profile', '#/me'], ['Editor', '#/edit'], ['Add a game', '#/new'], ['Method', '#/method'], ['Contribute', '#/contribute']];
  var KIND_ORDER = { Teardown: 0, Problem: 1, System: 2, Page: 3 };
  function searchIndex() {
    var out = PAGES.map(function (p) { return { k: 'Page', t: p[0], s: '', h: p[1], ic: 'arrow' }; });
    GAMES.forEach(function (g) {
      out.push({ k: 'Teardown', t: g.title, s: [g.studio, shortYear(g.year), g.genre].join(' · '), h: gameHref(g), ic: 'play', x: g.tags.join(' ') + ' ' + g.hook });
      g.systems.forEach(function (s) {
        out.push({ k: 'System', t: s.name, s: g.title + ' · ' + s.layer, h: gameHref(g, 'systems'), ic: ICON[s.layer] ? s.layer : 'System', x: s.what });
      });
    });
    PROBLEMS.forEach(function (p) { out.push({ k: 'Problem', t: p.name, s: p.question || '', h: '#/problem/' + p.id, ic: 'problem' }); });
    return out;
  }
  function scoreOf(it, q) {
    var t = it.t.toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    if (t.indexOf(' ' + q) >= 0) return 60;
    if (t.indexOf(q) >= 0) return 50;
    if ((it.s + ' ' + (it.x || '')).toLowerCase().indexOf(q) >= 0) return 20;
    return 0;
  }
  var ck = null, ckOpener = null;
  function openSearch() {
    if (!ck) {
      ck = document.createElement('dialog');
      ck.className = 'cmdk';
      ck.setAttribute('aria-label', 'Search the site');
      ck.innerHTML = '<div class="cmdk-in"><div class="cmdk-top">' + icon('search') +
        '<input id="ck-q" type="text" role="combobox" aria-expanded="true" aria-controls="ck-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search teardowns, systems and pages" aria-label="Search">' +
        '<kbd>Esc</kbd></div><ul id="ck-list" role="listbox" aria-label="Results"></ul>' +
        '<div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span class="ck-count" id="ck-count" role="status"></span></div></div>';
      document.body.appendChild(ck);
      var input = ck.querySelector('#ck-q'), listEl = ck.querySelector('#ck-list'), countEl = ck.querySelector('#ck-count');
      var results = [], active = 0;
      var draw = function () {
        var q = input.value.trim().toLowerCase(), idx = searchIndex();
        results = q ? idx.map(function (it) { return { it: it, sc: scoreOf(it, q) }; }).filter(function (x) { return x.sc > 0; })
          .sort(function (a, b) { return b.sc - a.sc || KIND_ORDER[a.it.k] - KIND_ORDER[b.it.k]; }).slice(0, 12).map(function (x) { return x.it; })
          : idx.filter(function (it) { return it.k === 'Teardown'; }).concat(idx.filter(function (it) { return it.k === 'Page'; }).slice(1, 5));
        active = 0;
        listEl.innerHTML = results.length ? results.map(function (it, i) {
          return '<li role="option" id="ck-o' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '">' +
            '<span class="ck-ic" aria-hidden="true">' + icon(it.ic) + '</span><span class="ck-b"><span class="ck-t">' + esc(it.t) + '</span>' +
            (it.s ? '<span class="ck-s">' + esc(it.s) + '</span>' : '') + '</span><span class="ck-k">' + it.k + '</span></li>';
        }).join('') : '<li class="ck-none">Nothing matches "' + esc(input.value.trim()) + '".</li>';
        input.setAttribute('aria-activedescendant', results.length ? 'ck-o0' : '');
        countEl.textContent = q ? plural(results.length, 'result', 'results') : '';
      };
      var setActive = function (i) {
        if (!results.length) return;
        active = (i + results.length) % results.length;
        all('[role="option"]', listEl).forEach(function (o, k) { o.setAttribute('aria-selected', String(k === active)); });
        var el = document.getElementById('ck-o' + active);
        input.setAttribute('aria-activedescendant', 'ck-o' + active);
        if (el) el.scrollIntoView({ block: 'nearest' });
      };
      var go = function (i) {
        var it = results[i];
        if (!it) return;
        ck.close();
        if (location.hash === it.h) route(false); else location.hash = it.h;
      };
      input.addEventListener('input', draw);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      });
      listEl.addEventListener('click', function (e) { var o = e.target.closest('[data-i]'); if (o) go(Number(o.getAttribute('data-i'))); });
      listEl.addEventListener('mousemove', function (e) { var o = e.target.closest('[data-i]'); if (o && Number(o.getAttribute('data-i')) !== active) setActive(Number(o.getAttribute('data-i'))); });
      ck.addEventListener('click', function (e) { if (e.target === ck) ck.close(); });
      /* back to where the user was; a navigation then moves focus to the new page */
      ck.addEventListener('close', function () { if (ckOpener && document.contains(ckOpener)) { try { ckOpener.focus({ preventScroll: true }); } catch (err) { /* ignore */ } } });
      ck.draw = draw;
    }
    if (ck.open) return;
    ckOpener = document.activeElement;
    setMenu(false);
    ck.querySelector('#ck-q').value = '';
    ck.draw();
    ck.showModal();
    ck.querySelector('#ck-q').focus();
  }
  var searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); openSearch(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openSearch(); }
  });

  /* ---------- small-screen menu ---------- */
  var menuBtn = document.getElementById('menu-btn');
  var siteNav = document.getElementById('site-nav');
  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    document.documentElement.classList.toggle('menu-open', open);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !siteNav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    siteNav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  /* shared with js/editor.js and js/diary.js */
  window.GT = {
    META: META, LAYERS: LAYERS, PROBLEMS: PROBLEMS, ICON: ICON, store: store, validate: validate, clone: clone,
    layerDots: layerDots, smooth: smooth, f1: f1, compactMQ: compactMQ,
    esc: esc, icon: icon, pad2: pad2, plural: plural, all: all, clamp: clamp, shortYear: shortYear,
    thumbSVG: thumbSVG, bandHTML: bandHTML, gameHref: gameHref, reduceMotion: reduceMotion,
    view: function (name, fn) { EXT[name] = fn; },
    onLeave: function (fn) { cleanup = fn; },
    guard: function (fn) { leaveGuard = fn; },
    syncHash: function () { lastHash = location.hash; },
    rerender: function () { route(false); }
  };

  /* start after js/editor.js has registered its views */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { route(false); });
  else route(false);
})();
