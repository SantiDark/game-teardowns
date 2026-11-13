/* ------------------------------------------------------------------
   Game Teardowns - taste profile
   Routes:  #/me            your profile: favorites, taste, recommendations
            #/me/edit       build or change it
            #/u/<code>      someone's shared profile, and how well you match

   The profile is saved only in this browser (localStorage "gt-profile").
   Favorites are looked up on Wikidata when you press Search. Their
   genres are read as six design traits, which rank the teardowns and
   compare two people. A shared link carries the profile itself, so no
   server is involved.
------------------------------------------------------------------- */
(function () {
  'use strict';

  var GT = window.GT;
  if (!GT || !GT.ed) return;
  var esc = GT.esc, icon = GT.icon, pad2 = GT.pad2, plural = GT.plural, all = GT.all, clone = GT.clone, ed = GT.ed;
  var app = document.getElementById('app');
  var SITE = 'Game Teardowns';
  var KEY = 'gt-profile';
  var MAX = 4;

  var CATS = [
    { id: 'games', name: 'Games', one: 'game', types: ['Q7889'], ph: 'For example: Hollow Knight', sub: 'P178', ic: 'play' },
    { id: 'movies', name: 'Movies', one: 'movie', types: ['Q11424'], ph: 'For example: Alien', sub: 'P57', ic: 'Presentation' },
    { id: 'series', name: 'Series', one: 'series', types: ['Q5398426', 'Q1259759', 'Q581714'], ph: 'For example: Dark', sub: 'P170', ic: 'teach' },
    { id: 'songs', name: 'Songs', one: 'song', types: ['Q7366', 'Q134556'], ph: 'For example: Bohemian Rhapsody', sub: 'P175', ic: 'audio' }
  ];
  /* six design traits; genres and tags are read through simple keyword rules */
  var TRAITS = [
    { id: 'tension', name: 'Tension', who: 'Thrill seeker', d: 'Fear, suspense and pressure',
      re: /horror|thriller|surviv|suspense|mystery|crime|noir|psycholog|stealth|gothic|apocalyp|zombie|slasher|industrial|doom/ },
    { id: 'challenge', name: 'Challenge', who: 'Challenger', d: 'Mastery and hard-won wins',
      re: /souls|roguelike|roguelite|platform|precision|difficult|rhythm|sport|racing|fighting|competitive|bullet hell|shoot 'em up|metroidvania|hardcore|punk|metal/ },
    { id: 'story', name: 'Story', who: 'Storyteller', d: 'Characters, drama and choices',
      re: /drama|romance|narrative|role-playing|\brpg\b|visual novel|biograph|coming-of-age|choice|adventure|interactive|singer-songwriter|folk|soul|ballad|emo|teen|family|anime|musical|historical/ },
    { id: 'discovery', name: 'Discovery', who: 'Explorer', d: 'Wonder, worlds and mysteries',
      re: /science fiction|sci-fi|fantasy|explor|open world|metroidvania|adventure|documentary|space|mystery|surreal|ambient|post-rock|psychedel|dream|level design|sandbox|myth/ },
    { id: 'strategy', name: 'Strategy', who: 'Strategist', d: 'Planning and clever solutions',
      re: /strateg|tactic|puzzle|deckbuild|card|turn-based|heist|detective|chess|simulation|management|city-building|4x|political|legal|courtroom/ },
    { id: 'action', name: 'Action', who: 'Adrenaline chaser', d: 'Speed, impact and adrenaline',
      re: /action|shooter|fighting|martial arts|war\b|superhero|hack and slash|beat 'em up|melee|combat|spy|disaster|electronic|edm|drum and bass|dubstep|hip hop|rap\b|rock|metal|punk|dance|trap|sport|racing/ }
  ];
  var ACCENTS = [['orange', 'Orange'], ['violet', 'Violet'], ['blue', 'Blue'], ['teal', 'Teal'], ['green', 'Green'], ['rose', 'Rose']];

  /* ---------- storage ---------- */
  function blank() { return { v: 1, name: '', bio: '', accent: 'orange', favs: { games: [], movies: [], series: [], songs: [] } }; }
  function read() {
    try {
      var p = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (p && typeof p === 'object' && typeof p.name === 'string') {
        var b = blank();
        p.favs = p.favs && typeof p.favs === 'object' ? p.favs : {};
        CATS.forEach(function (c) { if (!Array.isArray(p.favs[c.id])) p.favs[c.id] = []; p.favs[c.id] = p.favs[c.id].filter(function (x) { return x && typeof x.label === 'string'; }).slice(0, MAX); });
        if (!ACCENTS.some(function (a) { return a[0] === p.accent; })) p.accent = b.accent;
        if (typeof p.bio !== 'string') p.bio = '';
        return p;
      }
    } catch (e) { /* blocked or broken storage */ }
    return null;
  }
  var PROFILE = read();
  function write(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
  }
  function applyAccent(a) {
    if (a && a !== 'orange') document.documentElement.setAttribute('data-accent', a);
    else document.documentElement.removeAttribute('data-accent');
  }
  applyAccent(PROFILE && PROFILE.accent);

  /* ---------- helpers ---------- */
  function filled(s) { return typeof s === 'string' && s.trim() !== ''; }
  function hash(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function initials(n) {
    var w = String(n || '').trim().split(/\s+/).filter(Boolean);
    return ((w[0] || '?').charAt(0) + (w.length > 1 ? w[w.length - 1].charAt(0) : '')).toUpperCase();
  }
  function zero() { var v = {}; TRAITS.forEach(function (t) { v[t.id] = 0; }); return v; }
  function traitsOf(words) {
    var v = zero();
    (words || []).forEach(function (w) {
      var s = String(w).toLowerCase();
      TRAITS.forEach(function (t) { if (t.re.test(s)) v[t.id] += 1; });
    });
    return v;
  }
  function sum(v) { return TRAITS.reduce(function (a, t) { return a + v[t.id]; }, 0); }
  function norm(v) { var s = sum(v), o = zero(); if (s) TRAITS.forEach(function (t) { o[t.id] = v[t.id] / s; }); return o; }
  function add(a, b) { TRAITS.forEach(function (t) { a[t.id] += b[t.id]; }); return a; }
  function cosine(a, b) {
    var d = 0, x = 0, y = 0;
    TRAITS.forEach(function (t) { d += a[t.id] * b[t.id]; x += a[t.id] * a[t.id]; y += b[t.id] * b[t.id]; });
    return x && y ? d / Math.sqrt(x * y) : 0;
  }
  function itemVec(it) { return norm(traitsOf(it.genres || [])); }
  function profileVec(p) {
    var v = zero();
    CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { add(v, itemVec(it)); }); });
    return v;
  }
  /* shares that add up to 100 */
  function percents(v) {
    var s = sum(v), out = {}, left = 100, rows = [];
    if (!s) { TRAITS.forEach(function (t) { out[t.id] = 0; }); return out; }
    TRAITS.forEach(function (t) { var x = (v[t.id] / s) * 100; out[t.id] = Math.floor(x); left -= out[t.id]; rows.push([t.id, x - Math.floor(x)]); });
    rows.sort(function (a, b) { return b[1] - a[1]; }).slice(0, left).forEach(function (r) { out[r[0]] += 1; });
    return out;
  }
  function ranked(pc) { return TRAITS.slice().sort(function (a, b) { return pc[b.id] - pc[a.id]; }); }
  function gameVec(g) { return norm(traitsOf(g.tags.concat([g.genre]))); }
  function count(p) { return CATS.reduce(function (a, c) { return a + p.favs[c.id].length; }, 0); }
  function catOf(id) { return CATS.filter(function (c) { return c.id === id; })[0]; }

  /* ---------- generated art (original, from a hash of the name or title) ---------- */
  var avN = 0;
  function avatarSVG(name, cls) {
    var h = hash(name), kind = h % 3, art = '', clip = 'avc' + (avN++);
    if (kind === 0) for (var i = 0; i < 4; i++) art += '<circle cx="' + (18 + (h >>> (i * 3)) % 64) + '" cy="' + (18 + (h >>> (i * 4 + 2)) % 64) + '" r="' + (14 + i * 9) + '" class="av-line"/>';
    else if (kind === 1) for (var j = -100; j < 100; j += 14) art += '<line x1="' + j + '" y1="0" x2="' + (j + 100) + '" y2="100" class="av-line"/>';
    else for (var x = 10; x < 100; x += 16) for (var y = 10; y < 100; y += 16) art += '<circle cx="' + x + '" cy="' + y + '" r="' + (1.4 + ((h >>> ((x + y) % 24)) % 3)) + '" class="av-dot"/>';
    return '<svg class="avatar-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<defs><clipPath id="' + clip + '"><rect width="100" height="100" rx="26"/></clipPath></defs>' +
      '<rect width="100" height="100" rx="26" class="av-bg"/><g clip-path="url(#' + clip + ')">' + art + '</g>' +
      '<text x="50" y="53" class="av-txt" text-anchor="middle" dominant-baseline="middle">' + esc(initials(name)) + '</text></svg>';
  }
  function posterSVG(title) {
    var h = hash(title), k = h % 4, s = '';
    if (k === 0) { for (var i = 0; i < 5; i++) s += '<circle cx="' + (60 + ((h >>> i) % 30) - 15) + '" cy="' + (64 + ((h >>> (i + 3)) % 30) - 15) + '" r="' + (10 + i * 12) + '" class="ps-line"/>'; }
    else if (k === 1) { for (var y = 12; y < 160; y += 11) s += '<rect x="' + (10 + (h >>> (y % 20)) % 40) + '" y="' + y + '" width="' + (30 + (h >>> (y % 17)) % 70) + '" height="4" rx="2" class="ps-fill"/>'; }
    else if (k === 2) { s = '<path d="M0 ' + (90 + h % 30) + ' Q60 ' + (40 + h % 40) + ' 120 ' + (80 + (h >>> 4) % 40) + ' V160 H0Z" class="ps-fill"/><circle cx="' + (30 + (h >>> 6) % 60) + '" cy="' + (30 + (h >>> 8) % 20) + '" r="12" class="ps-sun"/>'; }
    else { for (var gx = 0; gx < 4; gx++) for (var gy = 0; gy < 5; gy++) if ((h >>> (gx * 5 + gy)) & 1) s += '<rect x="' + (8 + gx * 27) + '" y="' + (8 + gy * 29) + '" width="23" height="25" rx="5" class="ps-fill"/>'; }
    return '<svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  /* hexagonal radar of the six traits; "other" draws a second profile on top */
  function radarSVG(pc, other, label) {
    var cx = 160, cy = 132, R = 92, n = TRAITS.length;
    var max = Math.max.apply(null, TRAITS.map(function (t) { return Math.max(pc[t.id], other ? other[t.id] : 0); }).concat([1]));
    function pt(i, r) { var a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    function poly(fn) { return TRAITS.map(function (t, i) { var p = pt(i, fn(t)); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
    var grid = [0.25, 0.5, 0.75, 1].map(function (k) { return '<polygon class="rd-grid" points="' + poly(function () { return R * k; }) + '"/>'; }).join('');
    var axes = TRAITS.map(function (t, i) { var p = pt(i, R); return '<line class="rd-grid" x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; }).join('');
    function shape(v, cls) { return '<polygon class="' + cls + '" points="' + poly(function (t) { return R * (0.06 + 0.94 * v[t.id] / max); }) + '"/>'; }
    var labels = TRAITS.map(function (t, i) {
      var p = pt(i, R + 20), anchor = Math.abs(p[0] - cx) < 8 ? 'middle' : (p[0] > cx ? 'start' : 'end');
      return '<text class="rd-label" x="' + p[0].toFixed(1) + '" y="' + (p[1] + (i === 0 ? -4 : i === 3 ? 12 : 4)).toFixed(1) + '" text-anchor="' + anchor + '">' + t.name.toUpperCase() +
        '<tspan class="rd-v" dx="5">' + pc[t.id] + '</tspan></text>';
    }).join('');
    return '<svg class="radar" viewBox="-34 0 388 270" role="img" aria-label="' + esc(label) + '">' + grid + axes +
      (other ? shape(other, 'rd-other') : '') + shape(pc, 'rd-shape') + labels + '</svg>';
  }

  /* ---------- Wikidata ---------- */
  var WD = 'https://www.wikidata.org/w/api.php?format=json&origin=*&';
  function getJSON(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function label(e) {
    if (!e || !e.labels) return '';
    if (e.labels.en) return e.labels.en.value;
    var k = Object.keys(e.labels)[0];
    return k ? e.labels[k].value : '';
  }
  function ids(e, P) {
    var out = [];
    ((e.claims || {})[P] || []).forEach(function (c) {
      var v = c.rank !== 'deprecated' && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
      if (v && v.id && out.indexOf(v.id) < 0) out.push(v.id);
    });
    return out;
  }
  function year(e) {
    var best = '';
    ['P577', 'P580'].forEach(function (P) {
      ((e.claims || {})[P] || []).forEach(function (c) {
        var v = c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
        if (v && typeof v.time === 'string' && v.time.charAt(0) === '+') { var y = v.time.slice(1, 5); if (!best || y < best) best = y; }
      });
    });
    return best;
  }
  function search(q, cat) {
    var filter = ' haswbstatement:' + cat.types.map(function (t) { return 'P31=' + t; }).join('|');
    return getJSON(WD + 'action=query&list=search&srnamespace=0&srlimit=6&srsearch=' + encodeURIComponent(q + filter)).then(function (d) {
      var qs = ((d.query && d.query.search) || []).map(function (s) { return s.title; }).filter(function (x) { return /^Q\d+$/.test(x); });
      if (!qs.length) return [];
      return getJSON(WD + 'action=wbgetentities&props=labels%7Cdescriptions%7Cclaims&languages=en&languagefallback=1&ids=' + encodeURIComponent(qs.join('|'))).then(function (d2) {
        var items = qs.map(function (x) { return (d2.entities || {})[x]; }).filter(function (e) { return e && !e.missing; }).map(function (e) {
          return { id: e.id, label: label(e) || e.id, desc: (e.descriptions && e.descriptions.en && e.descriptions.en.value) || '', year: year(e), gq: ids(e, 'P136').slice(0, 6), sq: ids(e, cat.sub).slice(0, 2) };
        });
        var refs = [];
        items.forEach(function (it) { it.gq.concat(it.sq).forEach(function (x) { if (refs.indexOf(x) < 0) refs.push(x); }); });
        if (!refs.length) return items.map(finish({}));
        return getJSON(WD + 'action=wbgetentities&props=labels&languages=en&languagefallback=1&ids=' + encodeURIComponent(refs.slice(0, 50).join('|'))).then(function (d3) {
          var map = {};
          Object.keys(d3.entities || {}).forEach(function (x) { map[x] = label(d3.entities[x]); });
          return items.map(finish(map));
        });
      });
    });
    function finish(map) {
      return function (it) {
        return {
          id: it.id, label: it.label, desc: it.desc, year: it.year,
          sub: it.sq.map(function (x) { return map[x]; }).filter(Boolean).join(', '),
          genres: it.gq.map(function (x) { return map[x]; }).filter(Boolean)
            .filter(function (s) { return !/^video game( with|$)/i.test(s); }),
          gq: it.gq
        };
      };
    }
  }
  /* games that share genres with the favorite games, most linked first */
  function similarGames(p) {
    var genres = [], skip = [];
    p.favs.games.forEach(function (it) { (it.gq || []).forEach(function (q) { if (genres.indexOf(q) < 0) genres.push(q); }); if (it.id) skip.push(it.id); });
    if (!genres.length) return Promise.resolve(null);
    var sparql = 'SELECT ?g ?gLabel (COUNT(DISTINCT ?gen) AS ?shared) (SAMPLE(?links) AS ?l) (MIN(YEAR(?d)) AS ?y) ' +
      '(GROUP_CONCAT(DISTINCT ?genLabel; separator="|") AS ?gens) WHERE { ' +
      'VALUES ?gen { ' + genres.slice(0, 12).map(function (q) { return 'wd:' + q; }).join(' ') + ' } ' +
      '?g wdt:P31 wd:Q7889; wdt:P136 ?gen; wikibase:sitelinks ?links. FILTER(?links >= 25) ' +
      (skip.length ? 'FILTER(?g NOT IN (' + skip.map(function (q) { return 'wd:' + q; }).join(', ') + ')) ' : '') +
      'OPTIONAL { ?g wdt:P577 ?d } ?gen rdfs:label ?genLabel. FILTER(LANG(?genLabel) = "en") ' +
      'SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } ' +
      'GROUP BY ?g ?gLabel ORDER BY DESC(?shared) DESC(?l) LIMIT 10';
    return getJSON('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql)).then(function (d) {
      return ((d.results && d.results.bindings) || []).map(function (b) {
        return {
          id: b.g.value.split('/').pop(), label: b.gLabel.value, year: b.y ? b.y.value : '',
          shared: Number(b.shared.value), genres: (b.gens ? b.gens.value.split('|') : []).filter(function (s) { return !/^video game( with|$)/i.test(s); })
        };
      }).filter(function (x) { return /^Q\d+$/.test(x.id) && !/^Q\d+$/.test(x.label); });
    });
  }

  /* ---------- sharing (the profile travels inside the link) ---------- */
  function encode(p) {
    var pc = percents(profileVec(p)), f = {};
    CATS.forEach(function (c) { f[c.id] = p.favs[c.id].map(function (it) { return [it.label, it.year || '', it.sub || '']; }); });
    var json = JSON.stringify({ v: 1, n: p.name, b: p.bio, a: p.accent, t: TRAITS.map(function (t) { return pc[t.id]; }), f: f });
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(code) {
    try {
      var s = String(code).replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      var o = JSON.parse(decodeURIComponent(escape(atob(s))));
      var str = function (x, n) { return typeof x === 'string' ? x.slice(0, n) : ''; };
      if (!o || typeof o !== 'object' || !filled(o.n)) return null;
      var out = { name: str(o.n, 60), bio: str(o.b, 160), accent: ACCENTS.some(function (a) { return a[0] === o.a; }) ? o.a : 'orange', pc: {}, favs: {} };
      TRAITS.forEach(function (t, i) { var x = Array.isArray(o.t) ? Number(o.t[i]) : 0; out.pc[t.id] = isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : 0; });
      CATS.forEach(function (c) {
        var list = o.f && Array.isArray(o.f[c.id]) ? o.f[c.id] : [];
        out.favs[c.id] = list.slice(0, MAX).filter(Array.isArray).map(function (r) { return { label: str(r[0], 120), year: str(r[1], 8), sub: str(r[2], 120) }; }).filter(function (x) { return x.label; });
      });
      return out;
    } catch (e) { return null; }
  }
  function shareURL(p) { return location.href.split('#')[0] + '#/u/' + encode(p); }

  /* ---------- header button ---------- */
  var meBtn = document.getElementById('me-btn');
  function paintMe(on) {
    if (!meBtn) return;
    if (PROFILE && filled(PROFILE.name)) {
      meBtn.innerHTML = avatarSVG(PROFILE.name, 'av-mini');
      meBtn.setAttribute('aria-label', 'My profile: ' + PROFILE.name);
      meBtn.classList.add('has-av');
    } else {
      meBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>';
      meBtn.setAttribute('aria-label', 'My profile');
      meBtn.classList.remove('has-av');
    }
    if (on) meBtn.setAttribute('aria-current', 'page'); else meBtn.removeAttribute('aria-current');
  }
  paintMe(false);
  window.addEventListener('hashchange', function () { paintMe(/^#\/me(\/|$)/.test(location.hash)); });

  /* ---------- shared pieces of the views ---------- */
  function tileHTML(it, i) {
    var meta = [it.year, it.sub].filter(filled).join(' · ');
    return '<li class="tile"><span class="tile-art">' + posterSVG(it.label) + '<span class="tile-n">' + pad2(i + 1) + '</span></span>' +
      '<span class="tile-b"><span class="tile-t">' + esc(it.label) + '</span>' + (meta ? '<span class="tile-s">' + esc(meta) + '</span>' : '') +
      (it.genres && it.genres.length ? '<span class="tile-g">' + it.genres.slice(0, 2).map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('') + '</span>' : '') +
      '</span></li>';
  }
  function shelvesHTML(favs, mine) {
    return CATS.map(function (c) {
      var list = favs[c.id] || [];
      return '<section class="shelf" aria-labelledby="sh-' + c.id + '"><div class="shelf-h"><span class="layer-ic" aria-hidden="true">' + icon(c.ic) + '</span>' +
        '<h3 id="sh-' + c.id + '">' + c.name + '</h3><span class="mono">' + list.length + ' / ' + MAX + '</span></div>' +
        (list.length ? '<ol class="tiles">' + list.map(tileHTML).join('') + '</ol>'
          : '<p class="rep-empty">' + (mine ? 'No ' + c.name.toLowerCase() + ' yet. <a href="#/me/edit">Add some</a>.' : 'None shared.') + '</p>') + '</section>';
    }).join('');
  }
  function archetype(pc) {
    var r = ranked(pc);
    if (!pc[r[0].id]) return { title: 'Taste not read yet', line: 'Add favorites from the search to see your taste.' };
    return { title: 'The ' + r[0].who, line: pc[r[1].id] ? 'with a taste for ' + r[1].name.toLowerCase() : r[0].d };
  }
  function traitBars(pc) {
    return '<ol class="tbars">' + ranked(pc).map(function (t) {
      return '<li><span class="nm">' + t.name + '<small>' + t.d + '</small></span><span class="sbar" aria-hidden="true"><b style="width:' + pc[t.id] + '%"></b></span><span class="v">' + pc[t.id] + '%</span></li>';
    }).join('') + '</ol>';
  }
  /* teardowns ranked by how well their tags match a taste */
  function libraryRecs(vec, favs) {
    var favTitles = [];
    CATS.forEach(function (c) { (favs[c.id] || []).forEach(function (it) { favTitles.push(ed.slugify(it.label)); }); });
    return GT.store.games().map(function (g) {
      var gv = gameVec(g), score = cosine(vec, gv), because = null, best = 0;
      CATS.forEach(function (c) {
        (favs[c.id] || []).forEach(function (it) {
          if (!it.genres) return;
          var s = cosine(itemVec(it), gv);
          if (s > best) { best = s; because = it.label; }
        });
      });
      var shared = TRAITS.filter(function (t) { return vec[t.id] > 0 && gv[t.id] > 0; }).sort(function (a, b) { return gv[b.id] - gv[a.id]; }).slice(0, 2);
      return { g: g, score: score, because: because, shared: shared, fav: favTitles.indexOf(g.slug) >= 0 || favTitles.indexOf(ed.slugify(g.title)) >= 0 };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; });
  }
  function recCardHTML(x, i) {
    return '<li><a class="rec" href="' + GT.gameHref(x.g) + '"><span class="rec-thumb gthumb">' + GT.thumbSVG(x.g, 'rc' + i) + '</span>' +
      '<span class="rec-b"><span class="rec-top"><span class="rec-match">' + Math.round(x.score * 100) + '% match</span>' +
      (x.fav ? '<span class="badge b-edit">In your favorites</span>' : '') + '</span>' +
      '<span class="rec-t">' + esc(x.g.title) + '</span>' +
      '<span class="rec-why">' + (x.because ? 'Because you like ' + esc(x.because) : 'Matches your taste') +
      (x.shared.length ? ' · ' + x.shared.map(function (t) { return t.name.toLowerCase(); }).join(' and ') : '') + '</span></span></a></li>';
  }

  /* ================================================================
     MY PROFILE  #/me
  ================================================================ */
  function me() {
    document.title = 'My profile | ' + SITE;
    PROFILE = read();
    if (!PROFILE || !filled(PROFILE.name)) {
      app.innerHTML = '<div class="pf-band"><div class="wrap pf-empty">' +
        '<div class="pf-empty-art" aria-hidden="true">' + ['Story', 'Tension', 'Discovery', 'Strategy'].map(function (t, i) {
          return '<span class="pf-chip c' + i + '">' + t + '</span>';
        }).join('') + avatarSVG('You', 'av-xl') + '</div>' +
        '<div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>Taste profile · saved in this browser</p>' +
        '<h1>What you love says how you play</h1>' +
        '<p class="hook">Pick your four favorite games, movies, series and songs. Their genres become a taste profile across six design traits, which finds the teardowns that fit you and the games worth trying next. Share the link to see how well your tastes match a friend\'s.</p>' +
        '<div class="actions"><a class="btn btn-primary" href="#/me/edit">' + icon('plus') + 'Create my profile</a><a class="btn" href="#/">Browse teardowns</a></div></div></div></div>';
      return 'me';
    }
    var p = PROFILE, vec = profileVec(p), pc = percents(vec), arc = archetype(pc), n = count(p);
    var recs = libraryRecs(vec, p.favs);
    app.innerHTML =
      '<div class="pf-band"><div class="wrap pf-hero">' +
      '<div class="pf-id">' + avatarSVG(p.name, 'av-xl') +
      '<div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(arc.title) + '</p>' +
      '<h1 id="page-h">' + esc(p.name) + '</h1>' +
      '<p class="pf-arc">' + esc(arc.line) + '</p>' + (filled(p.bio) ? '<p class="hook">' + esc(p.bio) + '</p>' : '') +
      '<div class="actions"><a class="btn" href="#/me/edit">' + icon('edit') + 'Edit profile</a><a class="btn" href="#pf-share" id="to-share">' + icon('external') + 'Share</a></div>' +
      '<p class="pf-stats mono">' + plural(n, 'FAVORITE', 'FAVORITES') + ' · ' + CATS.map(function (c) { return p.favs[c.id].length + ' ' + c.name.toUpperCase(); }).join(' · ') + '</p></div></div>' +
      '<figure class="card pf-radar">' + radarSVG(pc, null, 'Your taste across six traits: ' + TRAITS.map(function (t) { return t.name + ' ' + pc[t.id] + '%'; }).join(', ')) +
      '<figcaption>Read from the genres of your favorites</figcaption></figure></div></div>' +

      '<div class="wrap page-body">' +
      '<section class="block" aria-labelledby="fv-h" style="padding-top:0"><div class="block-head"><div><p class="eyebrow">Favorites</p><h2 id="fv-h">What you love</h2></div>' +
      '<a class="text-link" href="#/me/edit">Change favorites' + icon('arrow') + '</a></div>' +
      '<div class="shelves">' + shelvesHTML(p.favs, true) + '</div></section>' +

      '<section class="block" aria-labelledby="tr-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Taste</p><h2 id="tr-h">Your six traits</h2>' +
      '<p class="sub">Each favorite\'s genres are read as design traits. The share of each trait shows what you tend to look for, in any medium.</p></div></div>' +
      '<div class="card pf-traits">' + traitBars(pc) + '</div></section>' +

      '<section class="block" aria-labelledby="rc-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Recommended</p><h2 id="rc-h">Teardowns that fit your taste</h2></div></div>' +
      (recs.length ? '<ul class="recs">' + recs.slice(0, 6).map(recCardHTML).join('') + '</ul>'
        : '<p class="notice">Add favorites with the search, so their genres can be read, and recommendations will appear here.</p>') +
      '<div class="card pf-more"><div><h3>' + icon('search') + 'Games to try next</h3><p>Games that share genres with your favorite games, looked up on Wikidata. Nothing is sent until you press the button.</p></div>' +
      '<button type="button" class="btn btn-primary" id="pf-find"' + (p.favs.games.some(function (it) { return it.gq && it.gq.length; }) ? '' : ' disabled') + '>' + icon('search') + 'Find games</button>' +
      (p.favs.games.some(function (it) { return it.gq && it.gq.length; }) ? '' : '<p class="fld-h">Add a favorite game from the search first.</p>') +
      '</div><p class="wd-msg" id="pf-msg" role="status"></p><ul class="sims" id="pf-sims"></ul></section>' +

      '<section class="block" id="pf-share" aria-labelledby="sr-h" style="padding-top:3rem;scroll-margin-top:5rem"><div class="block-head"><div><p class="eyebrow">Share</p><h2 id="sr-h">Compare tastes with a friend</h2>' +
      '<p class="sub">Send this link. Whoever opens it sees your card and how much their taste matches yours. The link contains your name, bio and favorites, nothing else.</p></div></div>' +
      '<div class="card pf-link"><label class="fld-l" for="pf-url">Your profile link</label><div class="wd-row"><input class="inp mono-inp" id="pf-url" readonly value="' + esc(shareURL(p)) + '">' +
      '<button type="button" class="btn btn-primary" id="pf-copy">Copy link</button></div><p class="wd-msg" id="pf-copied" role="status"></p>' +
      '<a class="text-link" href="#/u/' + encode(p) + '">Preview what others see' + icon('arrow') + '</a></div></section>' +
      '</div>';

    document.getElementById('to-share').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('pf-share').scrollIntoView({ behavior: GT.reduceMotion.matches ? 'auto' : 'smooth' });
      document.getElementById('pf-url').focus({ preventScroll: true });
    });
    document.getElementById('pf-copy').addEventListener('click', function () {
      var input = document.getElementById('pf-url'), out = document.getElementById('pf-copied');
      var done = function () { out.textContent = 'Link copied.'; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(input.value).then(done, function () { input.select(); out.textContent = 'Select the link and copy it.'; });
      else { input.select(); try { document.execCommand('copy'); done(); } catch (e) { out.textContent = 'Select the link and copy it.'; } }
    });
    var find = document.getElementById('pf-find');
    find.addEventListener('click', function () {
      var msg = document.getElementById('pf-msg'), list = document.getElementById('pf-sims');
      msg.textContent = 'Looking up games that share genres with your favorites…';
      find.disabled = true; list.innerHTML = '';
      similarGames(p).then(function (games) {
        if (!games || !games.length) { msg.textContent = 'No similar games were found. Try adding other favorite games.'; return; }
        msg.textContent = plural(games.length, 'game', 'games') + ' found, most shared genres first.';
        list.innerHTML = games.map(function (x, i) {
          var inDiary = GT.diary && GT.diary.find(x.label, x.id);
          return '<li class="sim"><span class="sim-n mono">' + pad2(i + 1) + '</span><span class="sim-b"><span class="sim-t">' + esc(x.label) + (x.year ? ' <span class="muted">' + esc(x.year) + '</span>' : '') + '</span>' +
            '<span class="sim-g">' + x.genres.slice(0, 3).map(function (g) { return '<span class="tag">' + esc(g) + '</span>'; }).join('') + '</span></span>' +
            '<span class="sim-a">' + (inDiary ? '<a class="btn btn-sm" href="#/diary/' + encodeURIComponent(inDiary.id) + '">' + icon('diary') + 'In your diary</a>'
              : '<button type="button" class="btn btn-sm" data-want="' + i + '">' + icon('plus') + 'Want to play</button>') +
            '<a class="btn btn-sm" href="https://www.wikidata.org/wiki/' + x.id + '" target="_blank" rel="noopener" aria-label="' + esc(x.label) + ' on Wikidata (new tab)">' + icon('external') + '</a></span></li>';
        }).join('');
        list.onclick = function (e) {
          var b = e.target.closest('[data-want]');
          if (!b || !GT.diary) return;
          var x = games[Number(b.getAttribute('data-want'))];
          var id = GT.diary.add({ title: x.label, studio: '', year: x.year, genre: x.genres.slice(0, 2).map(ed.cap).join(' / '), source: { wikidata: x.id } }, 'planned');
          if (!id) { msg.textContent = 'This browser did not allow saving to the diary.'; return; }
          var a = document.createElement('a');
          a.className = 'btn btn-sm'; a.href = '#/diary/' + encodeURIComponent(id); a.innerHTML = icon('diary') + 'In your diary';
          b.replaceWith(a); a.focus();
          msg.textContent = x.label + ' was added to your diary as "Want to play".';
        };
      }).catch(function () {
        msg.textContent = 'Could not reach Wikidata. Check the connection and try again.';
      }).then(function () { find.disabled = false; });
    });
    return 'me';
  }

  /* ================================================================
     EDIT  #/me/edit
  ================================================================ */
  function edit() {
    document.title = 'Edit my profile | ' + SITE;
    var p = read() || blank();
    var isNew = !filled(p.name);
    app.innerHTML =
      '<div class="band"><div class="wrap band-in"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/me">My profile</a>' + icon('chevron') + '<span aria-current="page">Edit</span></nav>' +
      '<div class="band-grid"><div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>Saved in this browser as you type</p>' +
      '<h1>' + (isNew ? 'Create your profile' : 'Edit your profile') + '</h1>' +
      '<p class="hook">Search each favorite so its genres can be read. Up to four of each.</p></div>' +
      '<aside class="glance pf-preview" aria-label="Preview"><div class="pf-preview-in" id="pf-prev"></div></aside></div></div></div>' +
      '<div class="wrap page-body"><div class="pe-grid">' +
      '<section class="card pe-card" aria-labelledby="ab-h"><h2 id="ab-h">About you</h2><div class="fgrid">' +
      '<div class="fld"><label class="fld-l" for="pe-name">Name<span class="req" aria-hidden="true">*</span></label><input class="inp" id="pe-name" maxlength="60" autocomplete="nickname" value="' + esc(p.name) + '"></div>' +
      '<div class="fld"><label class="fld-l" for="pe-bio">Short bio</label><textarea class="inp" id="pe-bio" rows="2" maxlength="140" placeholder="What you play and why">' + esc(p.bio) + '</textarea>' +
      '<p class="fld-h"><span id="pe-bio-n">' + p.bio.length + '</span> / 140</p></div>' +
      '<fieldset class="fld accents"><legend class="fld-l">Accent color</legend><p class="fld-h">It colors the whole site for you.</p><div class="sw-row">' +
      ACCENTS.map(function (a) {
        return '<label class="sw acc-' + a[0] + '"><input type="radio" name="pe-acc" value="' + a[0] + '"' + (p.accent === a[0] ? ' checked' : '') + '><span><i aria-hidden="true"></i>' + a[1] + '</span></label>';
      }).join('') + '</div></fieldset></div></section>' +
      CATS.map(function (c) {
        return '<section class="card pe-card" aria-labelledby="pc-' + c.id + '"><div class="pe-head"><span class="layer-ic" aria-hidden="true">' + icon(c.ic) + '</span>' +
          '<h2 id="pc-' + c.id + '">Favorite ' + c.name.toLowerCase() + '</h2><span class="mono" id="pn-' + c.id + '"></span></div>' +
          '<ol class="pe-list" id="pl-' + c.id + '"></ol>' +
          '<form class="wd-form" id="pf-' + c.id + '" novalidate role="search"><label class="fld-l" for="pq-' + c.id + '">Search ' + c.name.toLowerCase() + '</label>' +
          '<div class="wd-row"><input class="inp" type="search" id="pq-' + c.id + '" autocomplete="off" placeholder="' + esc(c.ph) + '">' +
          '<button class="btn" type="submit">' + icon('search') + 'Search</button></div></form>' +
          '<p class="wd-msg" id="pm-' + c.id + '" role="status"></p><ul class="wd-res" id="pr-' + c.id + '"></ul></section>';
      }).join('') +
      '</div><div class="pe-foot"><p class="wd-msg" id="pe-msg" role="status"></p>' +
      '<a class="btn btn-primary" href="#/me" id="pe-done">' + icon('check') + 'See my profile</a>' +
      (isNew ? '' : '<button type="button" class="btn btn-sm btn-danger" id="pe-del">' + icon('trash') + 'Delete profile</button>') + '</div></div>';

    var msg = document.getElementById('pe-msg');
    function save() {
      p.updated = new Date().toISOString();
      if (!filled(p.name)) { msg.textContent = 'Add your name so the profile can be saved.'; paintPreview(); return; }
      if (!write(p)) { msg.textContent = 'This browser did not allow saving. Storage may be full or blocked.'; return; }
      PROFILE = p; msg.textContent = 'Saved.'; paintMe(false); paintPreview();
    }
    function paintPreview() {
      var pc = percents(profileVec(p)), arc = archetype(pc);
      document.getElementById('pf-prev').innerHTML = avatarSVG(p.name || '?', 'av-lg') +
        '<div><p class="pf-prev-n">' + esc(p.name || 'Your name') + '</p><p class="pf-prev-a">' + esc(arc.title) + '</p>' +
        '<p class="mono">' + plural(count(p), 'FAVORITE', 'FAVORITES') + '</p></div>';
    }
    function paintList(c) {
      var list = p.favs[c.id];
      document.getElementById('pn-' + c.id).textContent = list.length + ' / ' + MAX;
      document.getElementById('pl-' + c.id).innerHTML = list.map(function (it, i) {
        return '<li class="pe-item"><span class="pe-art" aria-hidden="true">' + posterSVG(it.label) + '</span><span class="pe-b"><span class="pe-t">' + esc(it.label) + '</span>' +
          '<span class="pe-s">' + esc([it.year, it.sub].filter(filled).join(' · ') || 'Added as typed') + '</span>' +
          (it.genres && it.genres.length ? '<span class="pe-g">' + esc(it.genres.slice(0, 3).join(', ')) + '</span>' : '<span class="pe-g muted">No genres, so it does not count toward your taste</span>') + '</span>' +
          '<button type="button" class="ib" data-rm="' + c.id + '" data-i="' + i + '" aria-label="Remove ' + esc(it.label) + '">' + icon('trash') + '</button></li>';
      }).join('');
      var form = document.getElementById('pf-' + c.id);
      form.hidden = list.length >= MAX;
      document.getElementById('pm-' + c.id).textContent = list.length >= MAX ? 'Four ' + c.name.toLowerCase() + ' chosen. Remove one to add another.' : '';
      if (list.length >= MAX) document.getElementById('pr-' + c.id).innerHTML = '';
    }

    document.getElementById('pe-name').addEventListener('input', function (e) { p.name = e.target.value.trim(); save(); });
    document.getElementById('pe-bio').addEventListener('input', function (e) { p.bio = e.target.value; document.getElementById('pe-bio-n').textContent = p.bio.length; save(); });
    all('input[name="pe-acc"]', app).forEach(function (r) {
      r.addEventListener('change', function () { p.accent = r.value; applyAccent(p.accent); save(); });
    });
    CATS.forEach(function (c) {
      var form = document.getElementById('pf-' + c.id), q = document.getElementById('pq-' + c.id);
      var res = document.getElementById('pr-' + c.id), m = document.getElementById('pm-' + c.id);
      var found = [], token = 0;
      function addItem(it) {
        if (p.favs[c.id].length >= MAX) return;
        if (p.favs[c.id].some(function (x) { return (it.id && x.id === it.id) || ed.slugify(x.label) === ed.slugify(it.label); })) { m.textContent = it.label + ' is already in your list.'; return; }
        p.favs[c.id].push(it);
        res.innerHTML = ''; q.value = '';
        paintList(c); save();
        m.textContent = it.label + ' added.' + (form.hidden ? ' Four ' + c.name.toLowerCase() + ' chosen. Remove one to add another.' : '');
        if (!form.hidden) q.focus();
      }
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var term = q.value.trim();
        if (term.length < 2) { m.textContent = 'Type at least two letters.'; return; }
        var my = ++token;
        m.textContent = 'Searching Wikidata…'; res.innerHTML = '';
        search(term, c).then(function (items) {
          if (my !== token) return;
          found = items;
          m.textContent = items.length ? 'Choose one, or add it as typed.' : 'Nothing found. You can add it as typed, without genres.';
          res.innerHTML = items.map(function (it, i) {
            var meta = [it.year, it.sub].filter(filled).join(' · ');
            return '<li><button type="button" class="wd-item" data-pick="' + i + '"><span class="t">' + esc(it.label) + '</span>' +
              (meta ? '<span class="m">' + esc(meta) + '</span>' : '') + (it.genres.length ? '<span class="d">' + esc(it.genres.slice(0, 3).join(', ')) + '</span>' : '') + '</button></li>';
          }).join('') + '<li><button type="button" class="wd-item wd-typed" data-typed="1"><span class="t">Add "' + esc(term) + '" as typed</span><span class="d">Without genres, so it will not shape your taste.</span></button></li>';
        }).catch(function () { if (my === token) m.textContent = 'Could not reach Wikidata. Check the connection and try again.'; });
      });
      res.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick], [data-typed]');
        if (!b) return;
        if (b.hasAttribute('data-typed')) addItem({ id: '', label: q.value.trim(), year: '', sub: '', genres: [], gq: [] });
        else { var it = found[Number(b.getAttribute('data-pick'))]; addItem({ id: it.id, label: it.label, year: it.year, sub: it.sub, genres: it.genres, gq: it.gq }); }
      });
      document.getElementById('pl-' + c.id).addEventListener('click', function (e) {
        var b = e.target.closest('[data-rm]');
        if (!b) return;
        var it = p.favs[c.id].splice(Number(b.getAttribute('data-i')), 1)[0];
        paintList(c); save();
        m.textContent = it.label + ' removed.';
        q.focus();
      });
      paintList(c);
    });
    var del = document.getElementById('pe-del');
    if (del) del.addEventListener('click', function () {
      if (!confirm('Delete your profile and favorites from this browser? This cannot be undone.')) return;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      PROFILE = null; applyAccent(null); paintMe(false);
      location.hash = '#/me';
    });
    paintPreview();
    /* after the router has moved focus to the page */
    if (isNew) setTimeout(function () { var el = document.getElementById('pe-name'); if (el) el.focus(); }, 0);
    return 'me';
  }

  /* ================================================================
     SHARED PROFILE  #/u/<code>
  ================================================================ */
  function shared(code) {
    var o = decode(code);
    if (!o) {
      document.title = 'Profile not found | ' + SITE;
      app.innerHTML = '<div class="wrap page-body"><h1>This profile link does not work</h1><p class="notice">The link may be cut short. Ask for it again, or <a href="#/me">create your own profile</a>.</p></div>';
      return 'me';
    }
    document.title = o.name + ' | ' + SITE;
    var mine = read(), myPc = mine && filled(mine.name) ? percents(profileVec(mine)) : null;
    var self = mine && mine.name === o.name && encode(mine) === code;
    var match = myPc ? Math.round(cosine(o.pc, myPc) * 100) : null;
    var arc = archetype(o.pc);
    var common = [];
    if (mine) CATS.forEach(function (c) {
      (o.favs[c.id] || []).forEach(function (it) {
        if (mine.favs[c.id].some(function (x) { return ed.slugify(x.label) === ed.slugify(it.label); })) common.push(it.label);
      });
    });
    var vec = zero(); TRAITS.forEach(function (t) { vec[t.id] = o.pc[t.id]; });
    var recs = libraryRecs(vec, {});
    app.innerHTML =
      '<div class="pf-band acc-' + o.accent + '"><div class="wrap pf-hero">' +
      '<div class="pf-id">' + avatarSVG(o.name, 'av-xl') +
      '<div><p class="eyebrow"><span class="pip" aria-hidden="true"></span>' + esc(arc.title) + '</p><h1 id="page-h">' + esc(o.name) + '</h1>' +
      '<p class="pf-arc">' + esc(arc.line) + '</p>' + (filled(o.bio) ? '<p class="hook">' + esc(o.bio) + '</p>' : '') + '</div></div>' +
      '<figure class="card pf-radar">' + radarSVG(o.pc, (!self && myPc) || null, o.name + '\'s taste' + (myPc && !self ? ' compared with yours' : '') + ': ' +
        TRAITS.map(function (t) { return t.name + ' ' + o.pc[t.id] + '%'; }).join(', ')) +
      '<figcaption>' + (myPc && !self ? '<span class="lg lg-a"></span>' + esc(o.name) + ' <span class="lg lg-b"></span>You' : 'Read from the genres of their favorites') + '</figcaption></figure></div></div>' +
      '<div class="wrap page-body">' +
      (self ? '<p class="notice">This is how others see your profile.</p>' :
        match !== null ? '<div class="card pf-match"><span class="pf-match-v">' + match + '<small>%</small></span><div><h2>Taste match</h2><p>' +
          (match >= 80 ? 'You look for the same things.' : match >= 55 ? 'You share a good part of your taste.' : match >= 30 ? 'Some overlap, and a lot to discover from each other.' : 'Very different tastes. Good for recommendations.') +
          (common.length ? ' You both love ' + common.slice(0, 3).map(esc).join(', ') + '.' : '') + '</p></div></div>'
          : '<div class="card pf-match"><span class="pf-match-v">?</span><div><h2>How well do you match?</h2><p>Create your own profile to compare your taste with ' + esc(o.name) + '\'s.</p>' +
            '<a class="btn btn-primary" href="#/me/edit">' + icon('plus') + 'Create my profile</a></div></div>') +
      '<section class="block" aria-labelledby="sf-h" style="padding-top:2.5rem"><div class="block-head"><div><p class="eyebrow">Favorites</p><h2 id="sf-h">What ' + esc(o.name) + ' loves</h2></div></div>' +
      '<div class="shelves">' + shelvesHTML(o.favs, false) + '</div></section>' +
      (recs.length ? '<section class="block" aria-labelledby="sr2-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">For their taste</p><h2 id="sr2-h">Teardowns ' + esc(o.name) + ' might like</h2></div></div>' +
        '<ul class="recs">' + recs.slice(0, 3).map(recCardHTML).join('') + '</ul></section>' : '') +
      '</div>';
    return 'me';
  }

  GT.view('me', function (p) { return p[1] === 'edit' ? edit() : me(); });
  GT.view('u', function (p) { return shared(p[1] || ''); });
})();
