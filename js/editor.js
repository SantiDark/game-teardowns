/* ------------------------------------------------------------------
   Game Teardowns - editor
   Routes:  #/edit             every teardown, export, discard
            #/edit/<slug>      form for one teardown
            #/new              add a game (Wikidata lookup or blank)

   Changes are kept in this browser (see the content store in app.js).
   Export writes a complete js/data.js to publish them.
   The only outside service is Wikidata (and the Wikipedia intro of the
   chosen game), contacted only when the user presses Search.
------------------------------------------------------------------- */
(function () {
  'use strict';

  var GT = window.GT;
  if (!GT) return;
  var esc = GT.esc, icon = GT.icon, pad2 = GT.pad2, plural = GT.plural, all = GT.all, store = GT.store, clone = GT.clone;
  var META = GT.META, LAYERS = GT.LAYERS;
  var SITE = 'Game Teardowns';
  var app = document.getElementById('app');
  var CMP = (META.compareRows || []).filter(function (r) { return r.key !== 'genre'; });
  var flash = '';            /* message shown once on the next editor list render */

  /* ---------- helpers ---------- */
  function getP(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setP(o, p, v) {
    var ks = p.split('.'), cur = o;
    for (var i = 0; i < ks.length - 1; i++) {
      if (cur[ks[i]] == null || typeof cur[ks[i]] !== 'object') cur[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      cur = cur[ks[i]];
    }
    cur[ks[ks.length - 1]] = v;
  }
  function fid(p) { return 'f-' + p.replace(/\./g, '-'); }
  function filled(s) { return typeof s === 'string' && s.trim() !== ''; }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  }
  function taken(slug, except) {
    return store.entries().some(function (e) { return e.game && e.game.slug === slug && slug !== except; });
  }
  function uniqueSlug(base, except) {
    var s = base, n = 2;
    while (taken(s, except)) s = base + '-' + n++;
    return s;
  }
  function canThumb(g) {
    var pts = g && g.pacing && g.pacing.points;
    return Array.isArray(pts) && pts.length >= 2 && pts.every(function (q) { return q && typeof q.v === 'number' && isFinite(q.v); });
  }
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: (type || 'text/javascript') + ';charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function band(crumbs, eyebrow, title, text, side) {
    return '<div class="band"><div class="wrap band-in">' +
      '<nav class="crumbs" aria-label="Breadcrumb">' + crumbs + '</nav>' +
      '<div class="band-grid"><div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(eyebrow) + '</p>' +
      '<h1 id="page-h">' + esc(title) + '</h1>' + (text ? '<p class="hook">' + text + '</p>' : '') + '</div>' + (side || '') + '</div></div></div>';
  }
  function crumb(here, mid) {
    return '<a href="#/">Teardowns</a>' + icon('chevron') +
      (mid ? '<a href="#/edit">Editor</a>' + icon('chevron') : '') + '<span aria-current="page">' + esc(here) + '</span>';
  }

  /* ---------- authorship, sharing and import ---------- */
  /* drop an empty author, keep only the parts that have text */
  function tidy(g) {
    var c = clone(g);
    if (c.author) {
      var n = String(c.author.name || '').trim(), l = String(c.author.link || '').trim();
      if (!n && !l) delete c.author;
      else c.author = l ? { name: n, link: l } : { name: n };
    }
    return c;
  }
  /* the public repository that receives submissions, from META.repo */
  var REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(META.repo || '') ? META.repo.replace(/\/$/, '') : '';
  function pack(g, pretty) {
    return JSON.stringify({ format: 'game-teardown', version: 1, teardown: tidy(g) }, null, pretty ? 2 : 0);
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* not allowed */ }
      ta.remove();
      if (ok) resolve(); else reject(new Error('copy blocked'));
    });
  }
  /* a new GitHub issue, with the teardown inside when the address is short enough */
  function issueURL(g, inline) {
    var t = tidy(g), edit = store.isPublished(t.slug);
    var title = (edit ? 'Teardown edit: ' : 'New teardown: ') + t.title;
    var body = '**Game:** ' + t.title + (t.year ? ' (' + t.year + ')' : '') + '\n' +
      '**Written by:** ' + ((t.author && t.author.name) || '(not given)') + '\n' +
      (edit ? '**Type:** changes to the published teardown\n' : '') + '\n' +
      (inline ? 'The teardown:\n\n```json\n' + pack(t) + '\n```\n'
        : 'The teardown was copied to my clipboard. It is pasted below, between the two lines of backticks:\n\n```json\n\n```\n');
    return REPO + '/issues/new?title=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(body);
  }
  /* read teardowns from a file or pasted text: a submission file, a bare teardown, or a list */
  function parseImport(text) {
    var obj;
    try { obj = JSON.parse(String(text).trim()); }
    catch (e) {
      var a = text.indexOf('{'), b = text.lastIndexOf('}');
      if (a < 0 || b < a) throw new Error('No teardown was found in this text.');
      try { obj = JSON.parse(text.slice(a, b + 1)); } catch (e2) { throw new Error('The text is not a valid teardown file. Copy all of it, from the first { to the last }.'); }
    }
    var list = Array.isArray(obj) ? obj
      : (obj && obj.format === 'game-teardown') ? [obj.teardown]
      : (obj && Array.isArray(obj.teardowns)) ? obj.teardowns : [obj];
    list = list.filter(function (g) { return g && typeof g === 'object' && !Array.isArray(g) && typeof g.title === 'string' && g.title.trim(); });
    if (!list.length) throw new Error('The text does not contain a teardown with a title.');
    return list;
  }

  /* ---------- the empty template ---------- */
  function blankGame() {
    var compare = {};
    CMP.forEach(function (r) { compare[r.key] = ''; });
    return {
      slug: '', title: '', studio: '', year: '', genre: '', tags: [], hook: '',
      compare: compare, summary: '', fantasy: '', facts: [],
      coreLoop: { note: '', steps: [step(), step(), step()] },
      systems: [system()],
      feedback: { visual: [], audio: [], mechanical: [] },
      onboarding: { summary: '', steps: [], difficulty: '' },
      pacing: { label: '', points: [point(), point(), point()] },
      tensions: [], takeaways: []
    };
  }
  function step() { return { label: '', detail: '', feeling: '' }; }
  function system() { return { name: '', layer: LAYERS[0].id, what: '', why: '', effect: '' }; }
  function point() { return { phase: '', v: '', note: '' }; }

  /* fill in any missing part, so older or hand-written entries open in the form */
  function normalize(g) {
    var b = blankGame();
    Object.keys(b).forEach(function (k) { if (g[k] == null) g[k] = b[k]; });
    ['coreLoop', 'feedback', 'onboarding', 'pacing', 'compare'].forEach(function (k) {
      if (typeof g[k] !== 'object' || Array.isArray(g[k])) g[k] = b[k];
      Object.keys(b[k]).forEach(function (kk) { if (g[k][kk] == null) g[k][kk] = b[k][kk]; });
    });
    ['tags', 'facts', 'systems', 'tensions', 'takeaways'].forEach(function (k) { if (!Array.isArray(g[k])) g[k] = []; });
    ['coreLoop.steps', 'pacing.points', 'onboarding.steps', 'feedback.visual', 'feedback.audio', 'feedback.mechanical'].forEach(function (p) {
      if (!Array.isArray(getP(g, p))) setP(g, p, []);
    });
    return g;
  }

  /* ---------- form schema (paths are dotted, list items add an index) ---------- */
  var SCHEMA = [
    { id: 'basics', title: 'Basics', sub: 'The name, the studio and the one-line hook shown on the cards.', fields: [
      { t: 'text', k: 'title', label: 'Title', req: 1 },
      { t: 'slug', k: 'slug', label: 'Address' },
      { t: 'text', k: 'studio', label: 'Studio', req: 1 },
      { t: 'text', k: 'year', label: 'Year', req: 1, half: 1 },
      { t: 'text', k: 'genre', label: 'Genre', req: 1, half: 1 },
      { t: 'text', k: 'author.name', label: 'Written by', half: 1, help: 'Your name, shown on the teardown. Leave it empty for teardowns by ' + (META.author || 'the site author') + '.' },
      { t: 'text', k: 'author.link', label: 'Author link', half: 1, ph: 'https://', help: 'Optional. A portfolio or profile page.' },
      { t: 'tags', k: 'tags', label: 'Tags', help: 'Separate them with commas. They become the filters on the home page.' },
      { t: 'area', k: 'hook', label: 'Hook', rows: 2, req: 1, help: 'One sentence about the main idea of the design.' }
    ] },
    { id: 'overview', title: 'Overview', sub: 'What the game does and what the player gets to feel.', fields: [
      { t: 'area', k: 'summary', label: 'Summary', rows: 6, req: 1 },
      { t: 'area', k: 'fantasy', label: 'Player fantasy', rows: 2, req: 1 },
      { t: 'list', k: 'facts', label: 'Key facts', item: 'Fact', make: { k: '', v: '' }, fields: [
        { t: 'text', k: 'k', label: 'Name', half: 1, ph: 'Perspective' },
        { t: 'text', k: 'v', label: 'Value', half: 1 }
      ] }
    ] },
    { id: 'onboarding', title: 'Onboarding and difficulty', sub: 'How the game teaches the player, and how hard it is.', fields: [
      { t: 'area', k: 'onboarding.summary', label: 'How the game teaches', rows: 3 },
      { t: 'strs', k: 'onboarding.steps', label: 'Teaching steps', item: 'Step' },
      { t: 'area', k: 'onboarding.difficulty', label: 'Difficulty', rows: 3 }
    ] },
    { id: 'loop', title: 'Core loop', sub: 'Three to eight steps, in the order the player repeats them.', fields: [
      { t: 'area', k: 'coreLoop.note', label: 'How the loop repeats', rows: 2 },
      { t: 'list', k: 'coreLoop.steps', label: 'Steps', item: 'Step', min: 3, max: 8, make: step(), fields: [
        { t: 'text', k: 'label', label: 'Name', req: 1 },
        { t: 'area', k: 'detail', label: 'What happens', rows: 2 },
        { t: 'area', k: 'feeling', label: 'What the player feels', rows: 2 }
      ] }
    ] },
    { id: 'systems', title: 'Systems', sub: 'Each system sits in one of the five layers.', fields: [
      { t: 'list', k: 'systems', label: 'Systems', item: 'System', min: 1, make: system(), fields: [
        { t: 'text', k: 'name', label: 'Name', req: 1, half: 1 },
        { t: 'select', k: 'layer', label: 'Layer', half: 1 },
        { t: 'area', k: 'what', label: 'What it does', rows: 2 },
        { t: 'area', k: 'why', label: 'Why it exists', rows: 2 },
        { t: 'area', k: 'effect', label: 'Effect on the player', rows: 2 }
      ].concat(GT.PROBLEMS.length ? [{ t: 'checks', k: 'problems', label: 'Design problems it answers', help: 'Shown on the Problems page next to systems from other games.' }] : []) }
    ] },
    { id: 'feedback', title: 'Feedback', sub: 'How the game tells the player what is happening.', fields: [
      { t: 'strs', k: 'feedback.visual', label: 'Visual', item: 'Visual cue' },
      { t: 'strs', k: 'feedback.audio', label: 'Audio', item: 'Audio cue' },
      { t: 'strs', k: 'feedback.mechanical', label: 'Mechanical', item: 'Mechanical cue' }
    ] },
    { id: 'pacing', title: 'Pacing', sub: 'At least three moments. Intensity goes from 0 (calm) to 10 (peak).', fields: [
      { t: 'area', k: 'pacing.label', label: 'What the curve represents', rows: 2, help: 'Say that it is your own reading, not a measurement.' },
      { t: 'list', k: 'pacing.points', label: 'Moments', item: 'Moment', min: 3, make: point(), fields: [
        { t: 'text', k: 'phase', label: 'Name', req: 1, half: 1 },
        { t: 'num', k: 'v', label: 'Intensity (0 to 10)', req: 1, half: 1 },
        { t: 'area', k: 'note', label: 'What happens here', rows: 2 }
      ] }
    ] },
    { id: 'compare', title: 'Comparison answers', sub: 'Short answers shown side by side on the Compare page.', fields:
      CMP.map(function (r) { return { t: 'area', k: 'compare.' + r.key, label: r.label, rows: 2 }; })
    },
    { id: 'takeaways', title: 'Takeaways', sub: 'Where the design pulls in two directions, and what to adapt.', fields: [
      { t: 'list', k: 'tensions', label: 'Design tensions', item: 'Tension', make: { title: '', text: '' }, fields: [
        { t: 'text', k: 'title', label: 'Title' },
        { t: 'area', k: 'text', label: 'Text', rows: 3 }
      ] },
      { t: 'list', k: 'takeaways', label: 'Takeaways', item: 'Takeaway', make: { feeling: '', source: '', adaptation: '', project: '', test: '' }, fields: [
        { t: 'text', k: 'feeling', label: 'Sensation to keep' },
        { t: 'text', k: 'project', label: 'Project tag', half: 1, ph: 'ROADS' },
        { t: 'text', k: 'source', label: 'It comes from', half: 1 },
        { t: 'area', k: 'adaptation', label: 'How I would adapt it', rows: 3 },
        { t: 'area', k: 'test', label: 'Test question', rows: 2 }
      ] }
    ] }
  ];
  var LISTS = {};
  SCHEMA.forEach(function (s) { s.fields.forEach(function (f) { if (f.t === 'list' || f.t === 'strs') LISTS[f.k] = f; }); });

  /* ---------- checks, with the field each problem points to ---------- */
  function check(g, slugBefore) {
    var out = [];
    function add(msg, p) { out.push({ msg: msg, p: p || '' }); }
    [['title', 'Add a title'], ['studio', 'Add the studio'], ['year', 'Add the year'], ['genre', 'Add the genre'],
     ['hook', 'Write the hook'], ['summary', 'Write the summary'], ['fantasy', 'Describe the player fantasy']].forEach(function (x) {
      if (!filled(g[x[0]])) add(x[1], x[0]);
    });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug || '')) add('Fix the address: lowercase letters, numbers and single hyphens only', 'slug');
    else if (taken(g.slug, slugBefore)) add('Another teardown already uses this address', 'slug');
    if (g.author && filled(g.author.link) && !/^https:\/\/[^\s"<>]+$/.test(g.author.link.trim())) add('The author link must start with https://', 'author.link');

    var steps = (g.coreLoop && g.coreLoop.steps) || [];
    if (steps.length < 3 || steps.length > 8) add('The core loop needs 3 to 8 steps (it has ' + steps.length + ')', 'add:coreLoop.steps');
    steps.forEach(function (s, i) { if (!filled(s.label)) add('Name loop step ' + (i + 1), 'coreLoop.steps.' + i + '.label'); });

    if (!g.systems || !g.systems.length) add('Add at least one system', 'add:systems');
    (g.systems || []).forEach(function (s, i) { if (!filled(s.name)) add('Name system ' + (i + 1), 'systems.' + i + '.name'); });

    var pts = (g.pacing && g.pacing.points) || [];
    if (pts.length < 3) add('The pacing curve needs at least 3 moments (it has ' + pts.length + ')', 'add:pacing.points');
    pts.forEach(function (q, i) {
      if (!filled(q.phase)) add('Name pacing moment ' + (i + 1), 'pacing.points.' + i + '.phase');
      if (typeof q.v !== 'number' || !isFinite(q.v) || q.v < 0 || q.v > 10) add('Set the intensity of moment ' + (i + 1) + ' (0 to 10)', 'pacing.points.' + i + '.v');
    });
    /* anything else the site itself would reject */
    if (!out.length) GT.validate(g).forEach(function (m) { add(m); });
    return out;
  }

  /* ================================================================
     WIKIDATA
  ================================================================ */
  var WD = 'https://www.wikidata.org/w/api.php?format=json&origin=*&';
  var PROPS = [['dev', 'P178'], ['pub', 'P123'], ['genre', 'P136'], ['platform', 'P400'], ['mode', 'P404'],
               ['engine', 'P408'], ['series', 'P179'], ['director', 'P57'], ['composer', 'P86']];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function getJSON(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function labelOf(e) {
    if (!e || !e.labels) return '';
    if (e.labels.en) return e.labels.en.value;
    var k = Object.keys(e.labels)[0];
    return k ? e.labels[k].value : '';
  }
  function claimIds(e, P) {
    var seen = [];
    ((e.claims || {})[P] || []).forEach(function (c) {
      var v = c.rank !== 'deprecated' && c.mainsnak && c.mainsnak.snaktype === 'value' && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
      if (v && v.id && seen.indexOf(v.id) < 0) seen.push(v.id);
    });
    return seen;
  }
  function firstDate(e) {
    var best = null;
    ((e.claims || {}).P577 || []).forEach(function (c) {
      var v = c.rank !== 'deprecated' && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
      if (!v || typeof v.time !== 'string' || v.time.charAt(0) === '-') return;
      var t = v.time.replace(/^\+/, '');
      if (!best || t < best.t) best = { t: t, p: v.precision };
    });
    if (!best) return null;
    var y = best.t.slice(0, 4), m = Number(best.t.slice(5, 7)), d = Number(best.t.slice(8, 10));
    var text = best.p >= 11 && d && m ? d + ' ' + MONTHS[m - 1] + ' ' + y : (best.p >= 10 && m ? MONTHS[m - 1] + ' ' + y : y);
    return { year: y, text: text };
  }
  function labels(ids) {
    var map = {}, chunks = [];
    for (var i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
    return Promise.all(chunks.map(function (c) {
      return getJSON(WD + 'action=wbgetentities&props=labels&languages=en&languagefallback=1&ids=' + encodeURIComponent(c.join('|')))
        .then(function (d) { Object.keys(d.entities || {}).forEach(function (id) { map[id] = labelOf(d.entities[id]); }); });
    })).then(function () { return map; });
  }
  /* search video games (instance of Q7889) and read the facts of each result */
  function wdSearch(q) {
    return getJSON(WD + 'action=query&list=search&srnamespace=0&srlimit=8&srsearch=' + encodeURIComponent(q + ' haswbstatement:P31=Q7889'))
      .then(function (d) {
        var ids = ((d.query && d.query.search) || []).map(function (s) { return s.title; }).filter(function (id) { return /^Q\d+$/.test(id); });
        if (!ids.length) return [];
        return getJSON(WD + 'action=wbgetentities&props=labels%7Cdescriptions%7Cclaims%7Csitelinks%2Furls&sitefilter=enwiki&languages=en&languagefallback=1&ids=' + encodeURIComponent(ids.join('|')))
          .then(function (d2) {
            var items = ids.map(function (id) { return (d2.entities || {})[id]; }).filter(function (e) { return e && !e.missing; }).map(function (e) {
              var it = { id: e.id, label: labelOf(e) || e.id, description: (e.descriptions && e.descriptions.en && e.descriptions.en.value) || '', date: firstDate(e), ref: {} };
              var sl = e.sitelinks && e.sitelinks.enwiki;
              it.wiki = sl && /^https:\/\/en\.wikipedia\.org\/wiki\//.test(sl.url || '') ? sl.url : '';
              it.wikiTitle = sl ? sl.title : '';
              PROPS.forEach(function (pr) { it.ref[pr[0]] = claimIds(e, pr[1]); });
              return it;
            });
            var refs = [];
            items.forEach(function (it) { PROPS.forEach(function (pr) { it.ref[pr[0]].forEach(function (x) { if (refs.indexOf(x) < 0) refs.push(x); }); }); });
            return labels(refs).then(function (map) {
              items.forEach(function (it) {
                PROPS.forEach(function (pr) { it[pr[0]] = it.ref[pr[0]].map(function (x) { return map[x]; }).filter(Boolean); });
                /* Wikidata also files some content descriptors as genres ("video game with ...") */
                it.genre = it.genre.filter(function (s) { return !/^video game( with|$)/i.test(s); }).map(function (s) { return s.replace(/ video game$/i, ''); });
                it.mode = it.mode.map(function (s) { return cap(s.replace(/ video game$/i, '').replace(/ game$/i, '')); });
              });
              return items;
            });
          });
      });
  }
  function wikiIntro(title) {
    return getJSON('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')))
      .then(function (d) { return typeof d.extract === 'string' ? d.extract : ''; });
  }
  function joinList(a, max) {
    return a.length <= max ? a.join(', ') : a.slice(0, max).join(', ') + ' and ' + (a.length - max) + ' more';
  }
  function infoBasics(it) {
    return {
      title: it.label,
      studio: (it.dev.length ? it.dev : it.pub).slice(0, 3).join(' / '),
      year: it.date ? it.date.year : '',
      genre: it.genre.slice(0, 2).map(cap).join(' / ')
    };
  }
  function infoFacts(it) {
    return [['Publisher', it.pub], ['Released', it.date ? [it.date.text] : []], ['Platforms', it.platform], ['Modes', it.mode],
            ['Engine', it.engine], ['Series', it.series], ['Director', it.director], ['Composer', it.composer]]
      .filter(function (x) { return x[1] && x[1].length; })
      .map(function (x) { return { k: x[0], v: joinList(x[1], 6) }; });
  }
  /* copy the facts into a teardown. With keep=true, fields that already have text are not touched. */
  function applyInfo(g, it, keep) {
    var n = 0, b = infoBasics(it);
    Object.keys(b).forEach(function (k) {
      if (b[k] && (!keep || !filled(g[k]))) { g[k] = b[k]; n++; }
    });
    if (!g.tags.length && it.genre.length) { g.tags = it.genre.slice(0, 3).map(cap); n++; }
    infoFacts(it).forEach(function (f) {
      var has = g.facts.some(function (x) { return String(x.k || '').toLowerCase() === f.k.toLowerCase(); });
      if (!has) { g.facts.push(f); n++; }
    });
    if (!keep || !g.source) g.source = it.wiki ? { wikidata: it.id, wikipedia: it.wiki } : { wikidata: it.id };
    return n;
  }

  function wdHTML(px) {
    return '<form class="wd-form" id="' + px + '-wd" role="search" novalidate>' +
      '<label class="fld-l" for="' + px + '-q">Game title</label>' +
      '<div class="wd-row"><input class="inp" type="search" id="' + px + '-q" autocomplete="off" spellcheck="false" placeholder="For example: Hollow Knight">' +
      '<button class="btn btn-primary" type="submit">' + icon('search') + 'Search</button></div></form>' +
      '<p class="wd-msg" id="' + px + '-msg" role="status"></p>' +
      '<ul class="wd-res" id="' + px + '-res"></ul><div id="' + px + '-pick"></div>';
  }
  function initWD(root, px, useLabel, onUse) {
    var form = root.querySelector('#' + px + '-wd'), q = root.querySelector('#' + px + '-q');
    var msg = root.querySelector('#' + px + '-msg'), res = root.querySelector('#' + px + '-res'), pick = root.querySelector('#' + px + '-pick');
    var token = 0, list = [], shown = null;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var term = q.value.trim();
      if (term.length < 2) { msg.textContent = 'Type at least two letters of the title.'; q.focus(); return; }
      var my = ++token;
      msg.textContent = 'Searching Wikidata…';
      res.innerHTML = ''; pick.innerHTML = ''; shown = null;
      form.setAttribute('aria-busy', 'true');
      wdSearch(term).then(function (items) {
        if (my !== token) return;
        list = items;
        msg.textContent = items.length ? plural(items.length, 'game', 'games') + ' found. Choose one to see its facts.'
          : 'No video game found with that title. Try the English title, or fewer words.';
        res.innerHTML = items.map(function (it, i) {
          var m = [it.date ? it.date.year : '', it.dev[0] || it.pub[0] || ''].filter(Boolean).join(' · ');
          return '<li><button type="button" class="wd-item" data-wi="' + i + '" aria-pressed="false">' +
            '<span class="t">' + esc(it.label) + '</span>' + (m ? '<span class="m">' + esc(m) + '</span>' : '') +
            (it.description ? '<span class="d">' + esc(it.description) + '</span>' : '') + '</button></li>';
        }).join('');
      }).catch(function () {
        if (my === token) msg.textContent = 'Could not reach Wikidata. Check the internet connection and try again.';
      }).then(function () { if (my === token) form.removeAttribute('aria-busy'); });
    });
    res.addEventListener('click', function (e) {
      var b = e.target.closest('[data-wi]');
      if (!b) return;
      all('[data-wi]', res).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      show(list[Number(b.getAttribute('data-wi'))]);
    });
    function show(it) {
      shown = it;
      var b = infoBasics(it);
      var rows = [['Studio', b.studio], ['Year', b.year], ['Genre', b.genre]].filter(function (x) { return x[1]; })
        .map(function (x) { return { k: x[0], v: x[1] }; }).concat(infoFacts(it));
      var dup = store.entries().filter(function (e) {
        return e.game && ((e.game.source && e.game.source.wikidata === it.id) || slugify(e.game.title) === slugify(it.label));
      })[0];
      pick.innerHTML = '<div class="wd-card">' +
        '<div class="wd-card-h"><h3>' + esc(it.label) + '</h3>' +
        '<a class="wd-id" href="https://www.wikidata.org/wiki/' + it.id + '" target="_blank" rel="noopener">' + it.id + icon('external') + '<span class="sr"> (opens Wikidata in a new tab)</span></a></div>' +
        (rows.length ? '<dl class="wd-dl">' + rows.map(function (r) { return '<div><dt>' + esc(r.k) + '</dt><dd>' + esc(r.v) + '</dd></div>'; }).join('') + '</dl>'
          : '<p class="muted">Wikidata has no facts for this game yet.</p>') +
        '<div class="wd-ref" id="' + px + '-ref"></div>' +
        (dup ? '<p class="wd-dup">' + icon('alert') + '<span>This game is already in the library as <a href="#/edit/' + encodeURIComponent(dup.game.slug) + '">' + esc(dup.game.title || dup.game.slug) + '</a>.</span></p>' : '') +
        '<button type="button" class="btn btn-primary" id="' + px + '-use">' + esc(useLabel) + icon('arrow', 'ic-arrow') + '</button></div>';
      msg.textContent = 'Showing the facts for ' + it.label + '.';
      pick.querySelector('#' + px + '-use').addEventListener('click', function () { onUse(it, msg); });
      var ref = pick.querySelector('#' + px + '-ref');
      if (it.wikiTitle) {
        ref.innerHTML = '<p class="wd-ref-k">Loading the Wikipedia intro…</p>';
        wikiIntro(it.wikiTitle).then(function (t) {
          if (shown !== it) return;
          ref.innerHTML = t ? '<p class="wd-ref-k">Wikipedia intro · for reference, not copied</p><p>' + esc(t.length > 700 ? t.slice(0, 700).replace(/\s+\S*$/, '') + '…' : t) + '</p>' +
            '<a href="' + esc(it.wiki) + '" target="_blank" rel="noopener">Read the article' + icon('external') + '<span class="sr"> (opens Wikipedia in a new tab)</span></a>' : '';
        }).catch(function () { if (shown === it) ref.innerHTML = ''; });
      }
    }
  }

  /* ================================================================
     EDITOR LIST  #/edit
  ================================================================ */
  function editHome() {
    document.title = 'Editor | ' + SITE;
    var c = store.counts();
    var side = '<aside class="glance ed-glance" aria-label="Changes in this browser"><dl>' +
      '<div><dt>On the site</dt><dd>' + c.live + '</dd></div><div><dt>Drafts</dt><dd>' + c.drafts + '</dd></div>' +
      '<div><dt>Edited here</dt><dd>' + c.edited + '</dd></div><div><dt>Added here</dt><dd>' + c.added + '</dd></div></dl>' +
      '<div class="ed-glance-acts"><button class="btn btn-sm btn-primary" id="ed-export" type="button">' + icon('download') + 'Export data.js</button>' +
      '<button class="btn btn-sm" id="ed-discard" type="button"' + (c.any ? '' : ' disabled') + '>' + icon('undo') + 'Discard all changes</button></div></aside>';

    app.innerHTML = band(crumb('Editor'), 'Editor · saved in this browser', 'Edit teardowns',
      'Change any teardown or add a new game. Changes are saved only in this browser, so other visitors do not see them until you export <code>data.js</code> and publish it.', side) +
      '<div class="wrap page-body">' +
      '<p class="ed-flash" id="ed-msg" role="status">' + esc(flash) + '</p>' +
      '<div class="block-head"><div><p class="eyebrow">Library</p><h2 id="ed-list-h" tabindex="-1">All teardowns</h2></div>' +
      '<a class="btn btn-primary" href="#/new">' + icon('plus') + 'Add a game</a></div>' +
      '<ul class="ed-list" aria-labelledby="ed-list-h">' + store.entries().map(rowHTML).join('') + '</ul>' +
      '<section class="block" aria-labelledby="imp-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Import</p>' +
      '<h2 id="imp-h">Load a teardown someone sent</h2><p class="sub">A file downloaded from the editor, or the text of a submission on GitHub. It is added to this browser for you to review before publishing.</p></div>' +
      '<a class="text-link" href="#/contribute">How contributions work' + icon('arrow') + '</a></div>' +
      '<form class="card imp" id="imp-form" novalidate><div class="imp-grid">' +
      '<div class="fld"><label class="fld-l" for="imp-file">File</label><input class="inp" type="file" id="imp-file" accept=".json,.txt,application/json,text/plain"></div>' +
      '<div class="fld"><label class="fld-l" for="imp-text">Or paste the text</label><textarea class="inp" id="imp-text" rows="3" spellcheck="false" placeholder="{&quot;format&quot;: &quot;game-teardown&quot;, …}"></textarea></div>' +
      '</div><div class="imp-foot"><button class="btn btn-primary" type="submit">' + icon('download') + 'Import</button>' +
      '<p class="wd-msg" id="imp-msg" role="status"></p></div></form></section>' +
      '<section class="block" aria-labelledby="pub-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Publish</p>' +
      '<h2 id="pub-h">Make the changes public</h2></div></div><ol class="pub-steps">' +
      '<li class="card"><span class="mono">01</span><h3>' + icon('download') + 'Export</h3><p>Download <code>data.js</code>. It holds every teardown that is ready. Drafts are left out.</p></li>' +
      '<li class="card"><span class="mono">02</span><h3>' + icon('Content') + 'Replace</h3><p>Put it in the <code>js</code> folder of the project, in place of the old <code>data.js</code>.</p></li>' +
      '<li class="card"><span class="mono">03</span><h3>' + icon('arrow') + 'Publish</h3><p>Commit and push, or upload it on GitHub. Then press "Discard all changes" here so this browser shows the published version.</p></li>' +
      '</ol></section></div>';
    flash = '';

    var msg = document.getElementById('ed-msg');
    document.getElementById('ed-export').addEventListener('click', function () {
      download('data.js', store.exportJS());
      var n = store.counts();
      msg.textContent = 'Downloaded data.js with ' + plural(n.live, 'teardown', 'teardowns') + '.' +
        (n.drafts ? ' ' + plural(n.drafts, 'draft was', 'drafts were') + ' left out until ' + (n.drafts === 1 ? 'it is' : 'they are') + ' complete.' : '');
    });
    document.getElementById('ed-discard').addEventListener('click', function () {
      if (!confirm('Discard every change saved in this browser? This cannot be undone. Export data.js first if you want to keep them.')) return;
      after(store.discardAll(), 'All local changes were discarded. You are seeing the published teardowns.');
    });
    app.querySelector('.ed-list').addEventListener('click', function (e) {
      var r = e.target.closest('[data-restore]'), d = e.target.closest('[data-delete]');
      if (r) {
        var s1 = r.getAttribute('data-restore'), t1 = (store.entry(s1).game.title || s1);
        if (confirm('Restore "' + t1 + '" to the published version? Your edits to it will be lost.')) after(store.restore(s1), '"' + t1 + '" was restored to the published version.');
      } else if (d) {
        var s2 = d.getAttribute('data-delete'), t2 = (store.entry(s2).game.title || s2);
        if (confirm('Delete "' + t2 + '"? This cannot be undone.')) after(store.remove(s2), '"' + t2 + '" was deleted.');
      }
    });
    /* import teardowns from a file or pasted text */
    var impMsg = document.getElementById('imp-msg');
    document.getElementById('imp-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var file = document.getElementById('imp-file').files[0], pasted = document.getElementById('imp-text').value;
      if (!file && !pasted.trim()) { impMsg.textContent = 'Choose a file or paste the text first.'; return; }
      (file ? file.text() : Promise.resolve(pasted)).then(function (text) {
        var list;
        try { list = parseImport(text); } catch (err) { impMsg.textContent = err.message; return; }
        var done = [], failed = false;
        list.forEach(function (raw) {
          if (failed) return;
          var g = normalize(clone(raw)), note = '';
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug || '')) g.slug = slugify(g.title) || 'imported-teardown';
          var old = null;
          if (taken(g.slug)) {
            var other = store.entry(g.slug).game;
            if (confirm('"' + (other.title || g.slug) + '" is already in the library at the address "' + g.slug + '".\n\nOK: replace it with the imported version' +
              (store.isPublished(g.slug) ? ' (you can restore the published one later)' : '') + '.\nCancel: import it as a separate copy.')) old = g.slug;
            else { g.slug = uniqueSlug(g.slug); note = ' as a copy at "' + g.slug + '"'; }
          }
          if (!store.save(tidy(g), old)) { failed = true; return; }
          done.push({ slug: g.slug, title: g.title, note: old ? ' (replaced)' : note });
        });
        if (failed && !done.length) { impMsg.textContent = 'This browser did not allow saving. Storage may be full or blocked.'; return; }
        if (done.length === 1 && !failed) { location.hash = '#/edit/' + encodeURIComponent(done[0].slug); return; }
        after(true, 'Imported ' + done.map(function (x) { return '"' + x.title + '"' + x.note; }).join(', ') + '.' + (failed ? ' The rest could not be saved: storage is full or blocked.' : ''));
      }, function () { impMsg.textContent = 'The file could not be read.'; });
    });

    function after(ok, text) {
      if (!ok) { msg.textContent = 'This browser did not allow the change. Storage may be full or blocked.'; return; }
      flash = text;
      GT.rerender();
      var h = document.getElementById('ed-list-h');
      if (h) h.focus();
    }
    return 'edit';
  }

  function rowHTML(e, i) {
    var g = e.game || {}, s = g.slug || '', title = g.title || 'Untitled teardown', n = check(g, s).length;
    var badge = { base: ['Published', 'b-pub'], edited: ['Edited here', 'b-edit'], added: ['Added here', 'b-add'] }[e.origin];
    var meta = [g.studio, g.year ? GT.shortYear(g.year) : '', g.genre].filter(filled);
    var enc = encodeURIComponent(s);
    return '<li class="ed-row">' +
      '<div class="ed-thumb gthumb">' + (canThumb(g) ? GT.thumbSVG(g, 'ed' + i) : '<span class="ed-ph">No curve yet</span>') + '</div>' +
      '<div class="ed-info">' +
      (meta.length ? '<p class="gmeta">' + meta.map(esc).join('<span class="sep" aria-hidden="true"></span>') + '</p>' : '') +
      '<h3>' + esc(title) + '</h3>' +
      '<p class="ed-st"><span class="badge ' + badge[1] + '">' + badge[0] + '</span>' +
      (n ? '<span class="badge b-draft">' + icon('alert') + 'Draft · ' + plural(n, 'thing', 'things') + ' to fix</span>' : '') + '</p></div>' +
      '<div class="ed-acts">' +
      '<a class="btn btn-sm" href="#/edit/' + enc + '">' + icon('edit') + 'Edit<span class="sr"> ' + esc(title) + '</span></a>' +
      (!n && !e.problems.length ? '<a class="btn btn-sm" href="#/game/' + enc + '">View<span class="sr"> ' + esc(title) + '</span></a>' : '') +
      (e.origin === 'edited' ? '<button type="button" class="btn btn-sm" data-restore="' + esc(s) + '">' + icon('undo') + 'Restore<span class="sr"> the published version of ' + esc(title) + '</span></button>' : '') +
      (e.origin === 'added' ? '<button type="button" class="btn btn-sm btn-danger" data-delete="' + esc(s) + '">' + icon('trash') + 'Delete<span class="sr"> ' + esc(title) + '</span></button>' : '') +
      '</div></li>';
  }

  /* ================================================================
     ADD A GAME  #/new
  ================================================================ */
  function newGame() {
    document.title = 'Add a game | ' + SITE;
    app.innerHTML = band(crumb('Add a game', true), 'Editor · new teardown', 'Add a game',
      'Look the game up on Wikidata to fill in the studio, year, genre, platforms and other facts, or start from a blank template. The analysis itself (loop, systems, pacing and takeaways) is yours to write.') +
      '<div class="wrap page-body"><div class="new-grid">' +
      '<section class="card new-card" aria-labelledby="wd-h"><div class="new-head"><span class="layer-ic" aria-hidden="true">' + icon('search') + '</span>' +
      '<div><h2 id="wd-h">Look it up on Wikidata</h2><p>Free, open data about games. Nothing is sent until you press Search.</p></div></div>' +
      wdHTML('nw') + '</section>' +
      '<div class="new-side">' +
      '<section class="card new-card" aria-labelledby="blank-h"><h2 id="blank-h">Start blank</h2>' +
      '<p>An empty template with three loop steps, one system and three pacing moments.</p>' +
      '<button type="button" class="btn" id="new-blank">' + icon('plus') + 'Start blank</button><p class="wd-msg" id="blank-msg" role="status"></p></section>' +
      '<section class="card new-card" aria-labelledby="fill-h"><h2 id="fill-h">What Wikidata fills in</h2><ul class="fill-list">' +
      '<li>' + icon('check') + 'Title, studio, year and genre</li>' +
      '<li>' + icon('check') + 'Tags taken from the genres</li>' +
      '<li>' + icon('check') + 'Key facts: publisher, release date, platforms, modes, engine, series, director and composer</li>' +
      '<li>' + icon('check') + 'A link to the Wikidata entry and the Wikipedia article</li></ul>' +
      '<p class="muted">Everything can be changed in the editor. The Wikipedia intro is shown for reference only and is not copied.</p></section>' +
      '</div></div></div>';

    function create(g, msg) {
      if (!store.save(g, null)) { msg.textContent = 'This browser did not allow saving. Storage may be full or blocked (for example in a private window).'; return; }
      location.hash = '#/edit/' + encodeURIComponent(g.slug);
    }
    document.getElementById('new-blank').addEventListener('click', function () {
      var g = blankGame();
      g.slug = uniqueSlug('new-teardown');
      create(g, document.getElementById('blank-msg'));
    });
    initWD(app, 'nw', 'Create a teardown from this game', function (it, msg) {
      var g = blankGame();
      applyInfo(g, it, false);
      g.slug = uniqueSlug(slugify(g.title) || 'new-teardown');
      create(g, msg);
    });
    return 'edit';
  }

  /* ================================================================
     FORM  #/edit/<slug>
  ================================================================ */
  function fieldHTML(f, path, g, locked) {
    var v = getP(g, path), id = fid(path);
    var req = f.req ? '<span class="req" aria-hidden="true">*</span>' : '';
    var help = f.help, hid = id + '-h';
    if (f.t === 'slug') help = locked ? 'Published teardowns keep their address so existing links keep working.' : 'Used in the link: #/game/address. Lowercase letters, numbers and hyphens.';
    var common = ' id="' + id + '" data-p="' + path + '"' + (help ? ' aria-describedby="' + hid + '"' : '') + (f.req ? ' aria-required="true"' : '') +
      (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '');
    var ctl;
    if (f.t === 'checks') {
      var on = Array.isArray(v) ? v : [];
      return '<fieldset class="fld checks"' + (help ? ' aria-describedby="' + hid + '"' : '') + '><legend class="fld-l">' + esc(f.label) + '</legend>' +
        '<div class="check-list">' + GT.PROBLEMS.map(function (pr) {
          return '<label class="check"><input type="checkbox" data-t="checks" data-p="' + path + '" value="' + esc(pr.id) + '"' + (on.indexOf(pr.id) >= 0 ? ' checked' : '') + '>' +
            '<span>' + esc(pr.name) + '</span></label>';
        }).join('') + '</div>' + (help ? '<p class="fld-h" id="' + hid + '">' + esc(help) + '</p>' : '') + '</fieldset>';
    }
    if (f.t === 'area') ctl = '<textarea class="inp" rows="' + (f.rows || 3) + '"' + common + '>' + esc(v) + '</textarea>';
    else if (f.t === 'select') {
      var ids = LAYERS.map(function (l) { return l.id; });
      if (v && ids.indexOf(v) < 0) ids.push(v);
      ctl = '<select class="inp"' + common + '>' + ids.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
    } else if (f.t === 'num') ctl = '<input class="inp" type="number" inputmode="decimal" min="0" max="10" step="0.5" data-t="num"' + common + ' value="' + esc(v) + '">';
    else if (f.t === 'tags') ctl = '<input class="inp" type="text" data-t="tags"' + common + ' value="' + esc((v || []).join(', ')) + '">';
    else if (f.t === 'slug') ctl = '<input class="inp mono-inp" type="text" data-t="slug" spellcheck="false" autocapitalize="off" autocomplete="off"' + common + (locked ? ' readonly' : '') + ' value="' + esc(v) + '">';
    else ctl = '<input class="inp" type="text"' + common + ' value="' + esc(v) + '">';
    return '<div class="fld' + (f.half ? ' half' : '') + '"><label class="fld-l" for="' + id + '">' + esc(f.label) + req + '</label>' + ctl +
      (help ? '<p class="fld-h" id="' + hid + '">' + esc(help) + '</p>' : '') + '</div>';
  }
  function tool(act, path, i, f, off) {
    var what = f.item + ' ' + (i + 1);
    var lab = { up: 'Move ' + what + ' up', down: 'Move ' + what + ' down', remove: 'Remove ' + what }[act];
    return '<button type="button" class="ib" data-act="' + act + '" data-list="' + path + '" data-i="' + i + '" aria-label="' + esc(lab) + '" title="' + esc(lab) + '"' + (off ? ' disabled' : '') + '>' +
      icon(act === 'remove' ? 'trash' : act) + '</button>';
  }
  function listHTML(f, g) {
    var path = f.k, arr = getP(g, path) || [], n = arr.length, id = fid(path);
    var full = f.max && n >= f.max;
    var items = arr.map(function (it, i) {
      var tools = '<span class="rep-tools">' + tool('up', path, i, f, i === 0) + tool('down', path, i, f, i === n - 1) +
        tool('remove', path, i, f, f.min && n <= f.min) + '</span>';
      if (f.t === 'strs') {
        var sid = fid(path + '.' + i);
        return '<li class="rep-item rep-str"><span class="rep-n" aria-hidden="true">' + pad2(i + 1) + '</span>' +
          '<label class="sr" for="' + sid + '">' + esc(f.item + ' ' + (i + 1)) + '</label>' +
          '<textarea class="inp" rows="1" id="' + sid + '" data-p="' + path + '.' + i + '">' + esc(it) + '</textarea>' + tools + '</li>';
      }
      return '<li class="rep-item"><div class="rep-head"><span class="rep-n">' + esc(f.item) + ' ' + pad2(i + 1) + '</span>' + tools + '</div>' +
        '<div class="fgrid">' + f.fields.map(function (sf) { return fieldHTML(sf, path + '.' + i + '.' + sf.k, g); }).join('') + '</div></li>';
    }).join('');
    var range = f.max ? f.min + ' TO ' + f.max : (f.min ? 'AT LEAST ' + f.min : '');
    return '<div class="fld rep-wrap" data-listwrap="' + path + '" role="group" aria-labelledby="' + id + '-l">' +
      '<div class="rep-top"><span class="fld-l" id="' + id + '-l">' + esc(f.label) + '</span><span class="rep-count">' + n + (range ? ' · ' + range : '') + '</span></div>' +
      (n ? '<ol class="rep' + (f.t === 'strs' ? ' rep-strs' : '') + '">' + items + '</ol>' : '<p class="rep-empty">Nothing here yet.</p>') +
      '<button type="button" class="btn btn-sm rep-add" id="add-' + id + '" data-act="add" data-list="' + path + '"' + (full ? ' disabled' : '') + '>' +
      icon('plus') + (full ? 'Maximum of ' + f.max + ' reached' : 'Add ' + f.item.toLowerCase()) + '</button></div>';
  }
  function formHTML(g, locked) {
    return SCHEMA.map(function (s, i) {
      return '<section class="card ed-sec" id="es-' + s.id + '" aria-labelledby="esh-' + s.id + '">' +
        '<header class="ed-sec-head"><span class="sec-n">' + pad2(i + 1) + '</span><div><h2 id="esh-' + s.id + '" tabindex="-1">' + esc(s.title) + '</h2>' +
        (s.sub ? '<p>' + esc(s.sub) + '</p>' : '') + '</div></header>' +
        '<div class="fgrid">' + s.fields.map(function (f) {
          return (f.t === 'list' || f.t === 'strs') ? listHTML(f, g) : fieldHTML(f, f.k, g, locked && f.t === 'slug');
        }).join('') + '</div></section>';
    }).join('');
  }

  function editGame(slug) {
    var e = store.entry(slug);
    if (!e) {
      document.title = 'Not found | ' + SITE;
      app.innerHTML = band(crumb('Not found', true), 'Editor', 'Not found', 'There is no teardown at this address in this browser.') +
        '<div class="wrap page-body"><a class="btn btn-primary" href="#/edit">' + icon('back') + 'Back to the editor</a></div>';
      return 'edit';
    }
    var origSlug = slug, origin = e.origin, locked = store.isPublished(slug);
    var draft = normalize(clone(e.game)), dirty = false, timer = null;
    var autoSlug = origin === 'added' && draft.slug === uniqueSlug(slugify(draft.title) || 'new-teardown', origSlug);
    var originText = { base: 'Published teardown', edited: 'Published teardown · edited here', added: 'Added in this browser' }[origin];

    document.title = 'Edit ' + (draft.title || 'teardown') + ' | ' + SITE;
    app.innerHTML =
      '<div class="band ed-band"><div class="wrap band-in">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/edit">Editor</a>' + icon('chevron') + '<span aria-current="page" id="ed-crumb">' + esc(draft.title || 'Untitled teardown') + '</span></nav>' +
      '<p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(originText) + '</p>' +
      '<h1 id="ed-h">' + esc(draft.title || 'Untitled teardown') + '</h1></div></div>' +
      '<div class="wrap ed-layout">' +
      '<nav class="toc ed-toc" aria-label="Form sections"><p class="toc-title">Sections</p><ol>' +
      SCHEMA.map(function (s, i) {
        return '<li><a href="#/edit/' + encodeURIComponent(origSlug) + '" data-goto="' + s.id + '"><span class="n">' + pad2(i + 1) + '</span>' + esc(s.title) + '</a></li>';
      }).join('') + '</ol></nav>' +
      '<form class="ed-form" id="ed-form" novalidate aria-labelledby="ed-h">' + formHTML(draft, locked) + '</form>' +
      '<aside class="ed-side" aria-label="Status and actions">' +
      '<div class="card ed-card" id="ed-status"></div>' +
      '<div class="ed-bar"><p class="ed-dirty" id="ed-dirty" hidden>' + icon('alert') + 'Unsaved changes</p>' +
      '<p class="ed-say" id="ed-say" role="status"></p>' +
      '<div class="ed-bar-btns"><button type="submit" form="ed-form" class="btn btn-primary" id="ed-save">' + icon('save') + 'Save</button>' +
      '<a class="btn" id="ed-view" href="#/game/' + encodeURIComponent(origSlug) + '">View</a></div>' +
      '<p class="ed-kbd">Ctrl + S also saves.</p></div>' +
      '<div class="card ed-card"><div class="ed-card-h"><span>Pacing preview</span></div><div class="gthumb ed-prev" id="ed-thumb"></div></div>' +
      '<details class="card ed-card ed-wd"><summary>' + icon('search') + 'Fill in facts from Wikidata</summary>' +
      '<p class="muted">Adds missing basics and key facts. Fields that already have text are not changed.</p>' + wdHTML('ew') + '</details>' +
      '<div class="card ed-card ed-share"><div class="ed-card-h"><span>Share</span></div>' +
      '<p class="muted">' + (REPO ? 'Send this teardown to the site for review, or keep a copy as a file.' : 'Keep a copy as a file. Sending to the site opens once the site has a public repository.') + '</p>' +
      '<div class="ed-share-btns">' + (REPO ? '<button type="button" class="btn btn-sm btn-primary" id="ed-send">' + icon('arrow') + 'Send to the site</button>' : '') +
      '<button type="button" class="btn btn-sm" id="ed-file">' + icon('download') + 'Download file</button></div>' +
      '<div class="ed-share-out" id="ed-share-out" role="status"></div>' +
      (REPO ? '<a class="text-link ed-share-help" href="#/contribute">How sending works' + icon('arrow') + '</a>' : '') + '</div>' +
      '<div class="ed-more">' +
      '<button type="button" class="btn btn-sm" id="ed-revert">' + icon('undo') + 'Undo unsaved changes</button>' +
      (origin === 'edited' ? '<button type="button" class="btn btn-sm" id="ed-restore">' + icon('undo') + 'Restore published version</button>' : '') +
      (origin === 'added' ? '<button type="button" class="btn btn-sm btn-danger" id="ed-delete">' + icon('trash') + 'Delete teardown</button>' : '') +
      '</div></aside></div>';

    var form = document.getElementById('ed-form');
    var say = document.getElementById('ed-say'), dirtyEl = document.getElementById('ed-dirty');
    var statusEl = document.getElementById('ed-status'), thumbEl = document.getElementById('ed-thumb'), viewEl = document.getElementById('ed-view');

    function markDirty() { dirty = true; dirtyEl.hidden = false; say.textContent = ''; }
    function schedule() { clearTimeout(timer); timer = setTimeout(paint, 150); }
    function paint() {
      var probs = check(draft, origSlug), n = probs.length;
      var t = draft.title || 'Untitled teardown';
      document.getElementById('ed-h').textContent = t;
      document.getElementById('ed-crumb').textContent = t;
      statusEl.innerHTML = n ?
        '<div class="ed-state warn">' + icon('alert') + '<div><h2>' + plural(n, 'thing', 'things') + ' to fix</h2>' +
        '<p>Until then it is saved as a draft and hidden from the site.</p></div></div>' +
        '<ul class="ed-probs">' + probs.slice(0, 8).map(function (q) {
          return '<li><button type="button" data-focus="' + esc(q.p) + '">' + esc(q.msg) + '</button></li>';
        }).join('') + (n > 8 ? '<li class="more">and ' + (n - 8) + ' more</li>' : '') + '</ul>'
        : '<div class="ed-state ok">' + icon('check') + '<div><h2>Ready to show</h2><p>Every required part is filled in.</p></div></div>';
      thumbEl.innerHTML = canThumb(draft) ? GT.thumbSVG(draft, 'edp') : '<span class="ed-ph">Give at least two moments an intensity to see the curve.</span>';
      var live = store.entry(origSlug);
      viewEl.hidden = !(live && !live.problems.length);
    }
    function rerenderForm() {
      form.innerHTML = formHTML(draft, locked);
      paint();
    }
    function focusPath(p) {
      if (!p) return;
      var el = p.indexOf('add:') === 0 ? document.getElementById('add-' + fid(p.slice(4))) : document.getElementById(fid(p));
      if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: GT.reduceMotion.matches ? 'auto' : 'smooth' });
      el.focus({ preventScroll: true });
    }

    form.addEventListener('input', function (ev) {
      var el = ev.target, p = el.getAttribute('data-p');
      if (!p) return;
      var t = el.getAttribute('data-t'), v = el.value;
      if (t === 'num') v = v === '' ? '' : Number(v);
      else if (t === 'tags') v = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      else if (t === 'checks') v = all('[data-p="' + p + '"]:checked', form).map(function (c) { return c.value; });
      else if (t === 'slug') autoSlug = false;
      setP(draft, p, v);
      if (p === 'title' && autoSlug) {
        draft.slug = uniqueSlug(slugify(v) || 'new-teardown', origSlug);
        var si = document.getElementById(fid('slug'));
        if (si) si.value = draft.slug;
      }
      markDirty(); schedule();
    });
    /* the layer select fires change, not input, in some browsers */
    form.addEventListener('change', function (ev) {
      if (ev.target.tagName === 'SELECT') { setP(draft, ev.target.getAttribute('data-p'), ev.target.value); markDirty(); schedule(); }
    });
    form.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act'), path = b.getAttribute('data-list'), i = Number(b.getAttribute('data-i')), f = LISTS[path];
      var arr = getP(draft, path);
      if (!Array.isArray(arr)) { arr = []; setP(draft, path, arr); }
      var next = null;
      if (act === 'add') {
        arr.push(clone(f.t === 'strs' ? '' : f.make));
        next = fid(path + '.' + (arr.length - 1) + (f.t === 'strs' ? '' : '.' + f.fields[0].k));
      } else if (act === 'remove') {
        var it = arr[i], has = typeof it === 'string' ? filled(it) : Object.keys(it || {}).some(function (k) { return filled(String(it[k])); });
        if (has && !confirm('Remove ' + f.item.toLowerCase() + ' ' + (i + 1) + '?')) return;
        arr.splice(i, 1);
        next = 'add-' + fid(path);
      } else {
        var j = act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        next = { act: act, i: j };
      }
      var wrap = form.querySelector('[data-listwrap="' + path + '"]');
      wrap.outerHTML = listHTML(f, draft);
      if (typeof next === 'string') { var el = document.getElementById(next); if (el) el.focus(); }
      else {
        var mv = form.querySelector('[data-list="' + path + '"][data-act="' + next.act + '"][data-i="' + next.i + '"]');
        if (mv && mv.disabled) mv = form.querySelector('[data-list="' + path + '"][data-act="' + (next.act === 'up' ? 'down' : 'up') + '"][data-i="' + next.i + '"]');
        if (mv) mv.focus();
      }
      markDirty(); schedule();
    });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); save(); });
    statusEl.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-focus]');
      if (b) focusPath(b.getAttribute('data-focus'));
    });

    function save() {
      clearTimeout(timer);
      var probs = check(draft, origSlug);
      if (probs.some(function (q) { return q.p === 'slug'; })) {
        paint(); say.textContent = 'Not saved. Fix the address first.'; focusPath('slug'); return;
      }
      if (!store.save(tidy(draft), origSlug)) {
        say.textContent = 'Not saved. This browser did not allow it: storage may be full or blocked (for example in a private window).';
        return;
      }
      dirty = false; dirtyEl.hidden = true;
      if (draft.slug !== origSlug) {
        origSlug = draft.slug;
        try { history.replaceState(null, '', '#/edit/' + encodeURIComponent(origSlug)); } catch (err) { /* ignore */ }
        GT.syncHash();
        viewEl.href = '#/game/' + encodeURIComponent(origSlug);
      }
      paint();
      say.textContent = probs.length
        ? 'Saved as a draft. It stays hidden from the site until ' + plural(probs.length, 'problem is', 'problems are') + ' fixed.'
        : 'Saved. The site shows this version in this browser.';
    }

    /* section links, with the current section highlighted */
    var toc = all('.ed-toc a', app);
    toc.forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var id = a.getAttribute('data-goto');
        document.getElementById('es-' + id).scrollIntoView({ behavior: GT.reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        document.getElementById('esh-' + id).focus({ preventScroll: true });
      });
    });
    var ticking = false;
    function spy() {
      ticking = false;
      var idx = 0;
      SCHEMA.forEach(function (s, i) {
        var el = document.getElementById('es-' + s.id);
        if (el && el.getBoundingClientRect().top < 140) idx = i;
      });
      if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) idx = SCHEMA.length - 1;
      toc.forEach(function (a, i) { if (i === idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }
    window.addEventListener('scroll', onScroll, { passive: true });

    document.getElementById('ed-revert').addEventListener('click', function () {
      if (dirty && !confirm('Undo every change since the last save?')) return;
      var cur = store.entry(origSlug);
      draft = normalize(clone(cur ? cur.game : draft));
      autoSlug = origin === 'added' && draft.slug === uniqueSlug(slugify(draft.title) || 'new-teardown', origSlug);
      dirty = false; dirtyEl.hidden = true;
      rerenderForm();
      say.textContent = 'Back to the last saved version.';
    });
    var restoreBtn = document.getElementById('ed-restore');
    if (restoreBtn) restoreBtn.addEventListener('click', function () {
      if (!confirm('Restore the published version of this teardown? Your edits to it will be lost.')) return;
      if (!store.restore(origSlug)) { say.textContent = 'This browser did not allow the change.'; return; }
      dirty = false;
      GT.rerender();
    });
    var deleteBtn = document.getElementById('ed-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', function () {
      if (!confirm('Delete "' + (draft.title || 'this teardown') + '"? This cannot be undone.')) return;
      if (!store.remove(origSlug)) { say.textContent = 'This browser did not allow the change.'; return; }
      dirty = false;
      flash = '"' + (draft.title || 'Untitled teardown') + '" was deleted.';
      location.hash = '#/edit';
    });

    initWD(app, 'ew', 'Add these facts', function (it, msg) {
      var n = applyInfo(draft, it, true);
      if (autoSlug) draft.slug = uniqueSlug(slugify(draft.title) || 'new-teardown', origSlug);
      rerenderForm(); markDirty();
      msg.textContent = n ? 'Added ' + plural(n, 'field', 'fields') + ' from Wikidata. Save to keep them.' : 'Nothing new to add: those fields already have text.';
    });

    /* share: a file, or a GitHub issue for the site's repository */
    var shareOut = document.getElementById('ed-share-out');
    document.getElementById('ed-file').addEventListener('click', function () {
      download('teardown-' + (draft.slug || 'draft') + '.json', pack(draft, true), 'application/json');
      shareOut.innerHTML = '<p>Downloaded <code>teardown-' + esc(draft.slug || 'draft') + '.json</code>' + (dirty ? ', with your unsaved changes' : '') + '.</p>';
    });
    var sendBtn = document.getElementById('ed-send');
    if (sendBtn) sendBtn.addEventListener('click', function () {
      var probs = check(draft, origSlug);
      if (dirty) { shareOut.innerHTML = '<p class="warn">Save first, so the version you send is the one you keep.</p>'; return; }
      if (probs.length) { shareOut.innerHTML = '<p class="warn">Fix the ' + plural(probs.length, 'thing', 'things') + ' listed above first. Only complete teardowns can be sent.</p>'; return; }
      if (!filled(draft.author && draft.author.name)) {
        shareOut.innerHTML = '<p class="warn">Add your name in "Written by" (Basics), so the teardown can credit you.</p>';
        focusPath('author.name'); return;
      }
      function ready(url, text) {
        shareOut.innerHTML = '<p>' + text + '</p><a class="btn btn-sm btn-primary" href="' + esc(url) + '" target="_blank" rel="noopener">' + icon('external') +
          'Open GitHub<span class="sr"> (new tab)</span></a><p class="fld-h">You need a free GitHub account. Nothing is published until it is reviewed.</p>';
        shareOut.querySelector('a').focus();
      }
      var inline = issueURL(draft, true);
      if (inline.length <= 7500) { ready(inline, 'Ready. The teardown is already inside the GitHub message: check it, then press "Submit new issue".'); return; }
      copyText(pack(draft)).then(function () {
        ready(issueURL(draft, false), 'The teardown is long, so it was copied to your clipboard. In the GitHub message, paste it between the two lines of backticks, then press "Submit new issue".');
      }, function () {
        download('teardown-' + draft.slug + '.json', pack(draft, true), 'application/json');
        ready(issueURL(draft, false), 'This browser blocked copying, so the file was downloaded instead. Open it, copy all of it and paste it in the GitHub message.');
      });
    });

    function onKey(ev) {
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === 's' || ev.key === 'S')) { ev.preventDefault(); save(); }
    }
    function onUnload(ev) { if (dirty) { ev.preventDefault(); ev.returnValue = ''; } }
    document.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onUnload);
    GT.guard(function () { return !dirty || confirm('This teardown has unsaved changes. Leave without saving?'); });
    GT.onLeave(function () {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('scroll', onScroll);
    });

    paint();
    spy();
    return 'edit';
  }

  /* ================================================================
     CONTRIBUTE  #/contribute
  ================================================================ */
  function contribute() {
    document.title = 'Contribute | ' + SITE;
    function steps(list) {
      return '<ol class="pub-steps">' + list.map(function (s, i) {
        return '<li class="card"><span class="mono">' + pad2(i + 1) + '</span><h3>' + icon(s[0]) + esc(s[1]) + '</h3><p>' + s[2] + '</p></li>';
      }).join('') + '</ol>';
    }
    app.innerHTML = band(crumb('Contribute'), 'Open to everyone', 'Contribute a teardown',
      'Write a teardown of a game you know well, or improve one that is already here. Every submission is reviewed by ' + esc(META.author || 'the author') +
      ' before it is published, and it shows your name.') +
      '<div class="wrap page-body">' +
      (REPO ? '' : '<p class="notice">' + icon('alert') + ' Sending is not open yet: the site does not have its public repository set. You can already write a teardown in the editor and download it as a file.</p>') +
      '<section class="block" aria-labelledby="c1-h" style="padding-top:1rem"><div class="block-head"><div><p class="eyebrow">For contributors</p><h2 id="c1-h">Send a teardown</h2></div>' +
      '<a class="btn btn-primary" href="#/new">' + icon('plus') + 'Start a teardown</a></div>' +
      steps([
        ['edit', 'Write', 'Add a game in the <a href="#/new">editor</a>, or start from your <a href="#/diary">diary</a> notes. To improve an existing teardown, open it and press "Edit this teardown". Put your name in "Written by".'],
        ['arrow', 'Send', 'When the teardown is complete and saved, press "Send to the site" in the editor. GitHub opens with the teardown in a new message. You need a free GitHub account.'],
        ['check', 'Review', 'The teardown is read before it goes live. Questions and suggested changes are posted in the same GitHub thread. Once it is published, it shows your name and link.']
      ]) + '</section>' +
      '<section class="block" aria-labelledby="c2-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Before sending</p><h2 id="c2-h">What a good teardown has</h2></div></div>' +
      '<ul class="guide">' + [
        ['Your own analysis, in your own words.', 'Quotes from reviews, wikis or videos are not teardowns.'],
        ['No screenshots or game assets.', 'The site draws every diagram from the data, so none are needed.'],
        ['Pacing that says it is a reading.', 'Intensity values are your estimate of a typical stretch of play, not a measurement.'],
        ['Systems placed in one layer each.', 'Mechanic, System, Content, Narrative or Presentation, as the <a href="#/method">method</a> explains.'],
        ['One teardown per game.', 'If the game is already here, propose changes to it instead of a new one.']
      ].map(function (x) { return '<li class="card">' + icon('check') + '<div><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div></li>'; }).join('') + '</ul></section>' +
      '<section class="block" aria-labelledby="c3-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">For the maintainer</p><h2 id="c3-h">Publish a submission</h2></div></div>' +
      steps([
        ['download', 'Import', 'Copy the text from the GitHub message (or download the attached file) and load it in <a href="#/edit">Editor</a>, Import.'],
        ['edit', 'Review', 'Read it in the editor and on its page. Fix small things, or ask for changes in the GitHub thread.'],
        ['arrow', 'Publish', 'Export data.js, replace js/data.js and push. Then close the GitHub thread and discard the local changes.']
      ]) + '</section></div>';
    return 'contribute';
  }

  /* shared with js/diary.js */
  GT.ed = { blankGame: blankGame, slugify: slugify, uniqueSlug: uniqueSlug, wdHTML: wdHTML, initWD: initWD, applyInfo: applyInfo, cap: cap, canThumb: canThumb };

  GT.view('edit', function (p) { return p[1] ? editGame(p[1]) : editHome(); });
  GT.view('new', newGame);
  GT.view('contribute', contribute);
})();
