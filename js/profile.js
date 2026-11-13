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
    { id: 'songs', name: 'Songs', one: 'song', types: ['Q105543609', 'Q7366', 'Q134556'], ph: 'For example: Bohemian Rhapsody', sub: 'P175', ic: 'audio' }
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
      return getJSON(WD + 'action=wbgetentities&props=labels%7Cdescriptions%7Cclaims%7Csitelinks&sitefilter=enwiki&languages=en&languagefallback=1&ids=' + encodeURIComponent(qs.join('|'))).then(function (d2) {
        var items = qs.map(function (x) { return (d2.entities || {})[x]; }).filter(function (e) { return e && !e.missing; }).map(function (e) {
          return { id: e.id, label: label(e) || e.id, desc: (e.descriptions && e.descriptions.en && e.descriptions.en.value) || '', year: year(e),
            gq: ids(e, 'P136').slice(0, 6), sq: ids(e, cat.sub).slice(0, 2), wiki: e.sitelinks && e.sitelinks.enwiki ? e.sitelinks.enwiki.title : '' };
        });
        /* a song with no genres borrows the genres of its artist */
        var needArtist = cat.id === 'songs' ? items.filter(function (it) { return !it.gq.length && it.sq.length; }) : [];
        var artistIds = [];
        needArtist.forEach(function (it) { it.sq.forEach(function (a) { if (artistIds.indexOf(a) < 0) artistIds.push(a); }); });
        var artistsP = artistIds.length ? getJSON(WD + 'action=wbgetentities&props=claims&ids=' + encodeURIComponent(artistIds.join('|'))).then(function (d) {
          needArtist.forEach(function (it) {
            var gs = [];
            it.sq.forEach(function (a) { var e = (d.entities || {})[a]; if (e) ids(e, 'P136').forEach(function (g) { if (gs.indexOf(g) < 0) gs.push(g); }); });
            it.gq = gs.slice(0, 4);
          });
        }).catch(function () { /* genres stay empty */ }) : Promise.resolve();
        return artistsP.then(function () {
        var refs = [];
        items.forEach(function (it) { it.gq.concat(it.sq).forEach(function (x) { if (refs.indexOf(x) < 0) refs.push(x); }); });
        var labelsP = refs.length ? getJSON(WD + 'action=wbgetentities&props=labels&languages=en&languagefallback=1&ids=' + encodeURIComponent(refs.slice(0, 50).join('|'))).then(function (d3) {
          var map = {};
          Object.keys(d3.entities || {}).forEach(function (x) { map[x] = label(d3.entities[x]); });
          return map;
        }) : Promise.resolve({});
        /* a missing cover never blocks the results */
        var coversP = imagesFor(items.map(function (it) { return it.wiki; })).catch(function () { return {}; });
        return Promise.all([labelsP, coversP]).then(function (r) { return items.map(finish(r[0], r[1])); });
        });
      });
    });
    function finish(map, covers) {
      return function (it) {
        return {
          id: it.id, label: it.label, desc: it.desc, year: it.year,
          sub: it.sq.map(function (x) { return map[x]; }).filter(Boolean).join(', '),
          genres: it.gq.map(function (x) { return map[x]; }).filter(Boolean)
            .filter(function (s) { return !/^video game( with|$)/i.test(s); }),
          gq: it.gq, sq: it.sq, wiki: it.wiki, img: covers[it.wiki] || ''
        };
      };
    }
  }

  /* ---------- covers: the lead image of the English Wikipedia article ---------- */
  function cleanImg(u) {
    u = String(u || '').split('?')[0];
    return /^https:\/\/(upload|thumb)\.wikimedia\.org\/[^\s"'<>]+$/.test(u) ? u : '';
  }
  /* article titles -> image URL, in one request (any license, so posters and box art are included) */
  function imagesFor(titles) {
    titles = titles.filter(filled).slice(0, 50);
    if (!titles.length) return Promise.resolve({});
    return getJSON('https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=480&pilicense=any&redirects=1&format=json&origin=*&titles=' +
      encodeURIComponent(titles.join('|'))).then(function (d) {
      var q = d.query || {}, back = {}, out = {};
      (q.normalized || []).concat(q.redirects || []).forEach(function (m) { back[m.to] = back[m.from] || m.from; });
      Object.keys(q.pages || {}).forEach(function (k) {
        var pg = q.pages[k], img = pg.thumbnail ? cleanImg(pg.thumbnail.source) : '';
        if (!img) return;
        out[pg.title] = img;
        var t = pg.title;
        while (back[t] && !out[back[t]]) { out[back[t]] = img; t = back[t]; }
      });
      return out;
    });
  }
  /* fill in covers for favorites saved before covers existed */
  function backfillCovers(p) {
    var need = [];
    CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { if (it.id && !it.img && !it.noImg) need.push(it); }); });
    if (!need.length) return Promise.resolve(false);
    return getJSON(WD + 'action=wbgetentities&props=sitelinks&sitefilter=enwiki&ids=' + encodeURIComponent(need.map(function (it) { return it.id; }).slice(0, 50).join('|'))).then(function (d) {
      need.forEach(function (it) { var e = (d.entities || {})[it.id]; it.wiki = e && e.sitelinks && e.sitelinks.enwiki ? e.sitelinks.enwiki.title : ''; });
      return imagesFor(need.map(function (it) { return it.wiki; }));
    }).then(function (covers) {
      need.forEach(function (it) { it.img = covers[it.wiki] || ''; if (!it.img) it.noImg = true; });
      return true;
    });
  }

  /* ---------- recommendations across media ----------
     Four sources, each a SPARQL query on Wikidata:
       games    games that share genres with your favorite games
       watch    games based on, or set in the same franchise as, your movies and series
       mood     games in genres that match the genres of your movies and series
       music    games scored by your favorite artists, or by composers working in your music genres */
  var SOURCES = [
    { id: 'games', name: 'Like your games', ic: 'play' },
    { id: 'watch', name: 'From what you watch', ic: 'Presentation' },
    { id: 'mood', name: 'Same mood as your shows', ic: 'tension' },
    { id: 'music', name: 'Music you would like', ic: 'audio' }
  ];
  var MOODS = ['horror', 'science fiction', 'fantasy', 'mystery', 'detective', 'thriller', 'crime', 'war', 'western', 'comedy', 'romance',
    'superhero', 'cyberpunk', 'post-apocalyptic', 'survival', 'noir', 'heist', 'space', 'zombie', 'psychological', 'stealth'];
  function vals(list) { return list.map(function (q) { return 'wd:' + q; }).join(' '); }
  function sparql(q) { return getJSON('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q)); }
  var TAIL = 'OPTIONAL { ?art schema:about ?g; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?title } ' +
    'OPTIONAL { ?g wdt:P577 ?d } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?g rdfs:label ?gLabel. ?fav rdfs:label ?favLabel. } } ';
  function rows(d, src, why) {
    return ((d.results && d.results.bindings) || []).map(function (b) {
      return {
        id: b.g.value.split('/').pop(), label: b.gLabel ? b.gLabel.value : '', year: b.y ? b.y.value : '', src: src,
        wiki: b.wt ? b.wt.value : '', favId: b.fav ? b.fav.value.split('/').pop() : '',
        because: b.favLabel && !/^Q\d+$/.test(b.favLabel.value) ? b.favLabel.value : '', why: why(b)
      };
    }).filter(function (x) { return /^Q\d+$/.test(x.id) && x.label && !/^Q\d+$/.test(x.label); });
  }
  function recQueries(p) {
    var skip = [], out = {};
    CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { if (it.id) skip.push(it.id); }); });
    var notFav = skip.length ? 'FILTER(?g NOT IN (' + skip.map(function (q) { return 'wd:' + q; }).join(', ') + ')) ' : '';
    var games = p.favs.games.filter(function (it) { return it.id && it.gq && it.gq.length; });
    var screen = p.favs.movies.concat(p.favs.series).filter(function (it) { return it.id; });
    var songs = p.favs.songs.filter(function (it) { return it.id; });

    if (games.length) out.games = sparql('SELECT ?g ?gLabel ?fav ?favLabel (SAMPLE(?title) AS ?wt) (MIN(YEAR(?d)) AS ?y) (SAMPLE(?l) AS ?links) (COUNT(DISTINCT ?gen) AS ?shared) WHERE { ' +
      'VALUES (?fav ?gen) { ' + games.map(function (it) { return it.gq.slice(0, 6).map(function (g) { return '(wd:' + it.id + ' wd:' + g + ')'; }).join(' '); }).join(' ') + ' } ' +
      '?g wdt:P31 wd:Q7889; wdt:P136 ?gen; wikibase:sitelinks ?l. FILTER(?l >= 25) ' + notFav + TAIL +
      'GROUP BY ?g ?gLabel ?fav ?favLabel ORDER BY DESC(?shared) DESC(?links) LIMIT 24').then(function (d) {
      return rows(d, 'games', function (b) { return Number(b.shared.value) > 1 ? b.shared.value + ' genres in common' : 'A genre in common'; });
    });

    if (screen.length) out.watch = sparql('SELECT ?g ?gLabel ?fav ?favLabel (SAMPLE(?title) AS ?wt) (MIN(YEAR(?d)) AS ?y) (SAMPLE(?l) AS ?links) (SAMPLE(?how) AS ?hw) WHERE { ' +
      'VALUES ?fav { ' + vals(screen.map(function (it) { return it.id; })) + ' } ' +
      '{ ?g wdt:P144 ?fav. BIND("based" AS ?how) } UNION { ?fav wdt:P8345 ?fr. ?g wdt:P8345 ?fr. BIND("franchise" AS ?how) } UNION { ?fav wdt:P1434 ?u. ?g wdt:P1434 ?u. BIND("universe" AS ?how) } ' +
      '?g wdt:P31 wd:Q7889; wikibase:sitelinks ?l. ' + notFav + TAIL +
      'GROUP BY ?g ?gLabel ?fav ?favLabel ORDER BY DESC(?links) LIMIT 16').then(function (d) {
      return rows(d, 'watch', function (b) { return b.hw && b.hw.value === 'based' ? 'Based on it' : 'Same world'; });
    });

    /* moods: words in the genres of movies and series, matched to video game genres by name */
    var words = [];
    screen.forEach(function (it) {
      (it.genres || []).forEach(function (g) {
        MOODS.forEach(function (m) { if (String(g).toLowerCase().indexOf(m) >= 0 && !words.some(function (w) { return w.m === m; })) words.push({ m: m, fav: it }); });
      });
    });
    if (words.length) out.mood = Promise.all(words.slice(0, 4).map(function (w) {
      return getJSON(WD + 'action=query&list=search&srnamespace=0&srlimit=3&srsearch=' + encodeURIComponent(w.m + ' haswbstatement:P31=Q659563')).then(function (d) {
        return { w: w, qs: ((d.query && d.query.search) || []).map(function (s) { return s.title; }).filter(function (x) { return /^Q\d+$/.test(x); }) };
      });
    })).then(function (found) {
      var pairs = [];
      found.forEach(function (f) { f.qs.forEach(function (q) { pairs.push('(wd:' + f.w.fav.id + ' wd:' + q + ' "' + f.w.m + '")'); }); });
      if (!pairs.length) return [];
      return sparql('SELECT ?g ?gLabel ?fav ?favLabel (SAMPLE(?m) AS ?mm) (SAMPLE(?title) AS ?wt) (MIN(YEAR(?d)) AS ?y) (SAMPLE(?l) AS ?links) WHERE { ' +
        'VALUES (?fav ?gen ?m) { ' + pairs.join(' ') + ' } ?g wdt:P31 wd:Q7889; wdt:P136 ?gen; wikibase:sitelinks ?l. FILTER(?l >= 30) ' + notFav + TAIL +
        'GROUP BY ?g ?gLabel ?fav ?favLabel ORDER BY DESC(?links) LIMIT 16').then(function (d) {
        return rows(d, 'mood', function (b) { return ed.cap(b.mm ? b.mm.value : 'similar') + ' mood'; });
      });
    });

    if (songs.length) {
      var gpairs = [], artists = [];
      songs.forEach(function (it) {
        (it.gq || []).slice(0, 4).forEach(function (g) { gpairs.push('(wd:' + it.id + ' wd:' + g + ')'); });
        (it.sq || []).forEach(function (a) { artists.push('(wd:' + it.id + ' wd:' + a + ')'); });
      });
      /* the order is fixed (optimizer off): start from the favorite's genres, go down to subgenres, then composers, then games */
      if (gpairs.length || artists.length) out.music = sparql('SELECT ?g ?gLabel ?fav ?favLabel ?c ?cLabel (SAMPLE(?how) AS ?hw) (SAMPLE(?title) AS ?wt) (MIN(YEAR(?d)) AS ?y) (SAMPLE(?l) AS ?links) WHERE { ' +
        'hint:Query hint:optimizer "None". ' +
        '{ VALUES (?fav ?c) { ' + (artists.join(' ') || '(wd:Q1 wd:Q1)') + ' } ?g wdt:P86 ?c. BIND("artist" AS ?how) } UNION ' +
        '{ VALUES (?fav ?mg) { ' + (gpairs.join(' ') || '(wd:Q1 wd:Q1)') + ' } ?gen wdt:P279? ?mg. ?c wdt:P136 ?gen. ?g wdt:P86 ?c. BIND("genre" AS ?how) } ' +
        '?g wdt:P31 wd:Q7889. ?g wikibase:sitelinks ?l. FILTER(?l >= 15) ' + notFav +
        TAIL.replace('?fav rdfs:label ?favLabel.', '?fav rdfs:label ?favLabel. ?c rdfs:label ?cLabel.') +
        'GROUP BY ?g ?gLabel ?fav ?favLabel ?c ?cLabel ORDER BY DESC(?hw = "artist") DESC(?links) LIMIT 24').then(function (d) {
        return rows(d, 'music', function (b) { return (b.hw && b.hw.value === 'artist' ? 'Scored by ' : 'Music by ') + (b.cLabel ? b.cLabel.value : 'a composer you may like'); })
          .filter(function (x) { return !/^Q\d+$/.test(x.why.replace(/^(Scored|Music) by /, '')); });
      });
    }
    return out;
  }
  /* run every source, keep one entry per game, then add covers */
  function findForMe(p, onSource) {
    var qs = recQueries(p), keys = Object.keys(qs), seen = {}, all = [];
    if (!keys.length) return Promise.resolve(null);
    /* a slow source is dropped after 25 seconds instead of holding up the others */
    function limit(pr) {
      return Promise.race([pr, new Promise(function (resolve, reject) { setTimeout(function () { reject(new Error('timeout')); }, 25000); })]);
    }
    return Promise.all(keys.map(function (k) {
      return limit(qs[k]).then(function (list) {
        list.forEach(function (x) { if (!seen[x.id + x.src]) { seen[x.id + x.src] = 1; all.push(x); } });
        if (onSource) onSource(k, true);
      }, function (err) {
        console.warn('[Game Teardowns] Recommendations from "' + k + '" did not arrive: ' + (err && err.message));
        if (onSource) onSource(k, false);
      });
    })).then(function () {
      /* the favorite behind each pick, named from the profile itself */
      var names = {};
      CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { if (it.id) names[it.id] = it.label; }); });
      all.forEach(function (x) { if (names[x.favId]) x.because = names[x.favId]; });
      /* at most 6 per source, one game per source */
      var bySrc = {}, once = {};
      all.forEach(function (x) {
        if (once[x.src + x.id]) return;
        once[x.src + x.id] = 1;
        (bySrc[x.src] = bySrc[x.src] || []).push(x);
      });
      /* variety: at most two per composer (music) or per favorite (the rest) before repeating one */
      function varied(list, key) {
        var seen = {}, first = [], rest = [];
        list.forEach(function (x) { var k = key(x); seen[k] = (seen[k] || 0) + 1; (seen[k] <= 2 ? first : rest).push(x); });
        return first.concat(rest).slice(0, 6);
      }
      var picked = [];
      SOURCES.forEach(function (s) {
        varied(bySrc[s.id] || [], s.id === 'music' ? function (x) { return x.why; } : function (x) { return x.favId; }).forEach(function (x) { picked.push(x); });
      });
      return imagesFor(picked.map(function (x) { return x.wiki; })).catch(function () { return {}; }).then(function (covers) {
        picked.forEach(function (x) { x.img = covers[x.wiki] || ''; });
        return picked;
      });
    });
  }

  /* ---------- sharing (the profile travels inside the link) ---------- */
  function encode(p) {
    var pc = percents(profileVec(p)), f = {};
    CATS.forEach(function (c) { f[c.id] = p.favs[c.id].map(function (it) { return [it.label, it.year || '', it.sub || '', it.img || '']; }); });
    var json = JSON.stringify({ v: 1, n: p.name, b: p.bio, a: p.accent, t: TRAITS.map(function (t) { return pc[t.id]; }), f: f, bn: bannerImg(p) });
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
        out.favs[c.id] = list.slice(0, MAX).filter(Array.isArray).map(function (r) { return { label: str(r[0], 120), year: str(r[1], 8), sub: str(r[2], 120), img: cleanImg(str(r[3], 400)) }; }).filter(function (x) { return x.label; });
      });
      out.banner = cleanImg(str(o.bn, 400));
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

  /* ---------- covers and banner ---------- */
  /* the generated poster stays underneath, so a cover that fails to load leaves the pattern */
  function coverHTML(it) {
    var src = cleanImg(it && it.img);
    return posterSVG(it.label) + (src ? '<img class="cover" src="' + esc(src) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : '');
  }
  function itemKey(it) { return it.id || 'l:' + it.label; }
  /* banner: "auto" uses the first favorite with a cover, "none" uses the pattern, otherwise a chosen favorite */
  function bannerImg(p) {
    if (p.banner === 'none') return '';
    var list = [];
    CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { if (cleanImg(it.img)) list.push(it); }); });
    var pick = p.banner && p.banner !== 'auto' ? list.filter(function (it) { return itemKey(it) === p.banner; })[0] : null;
    return cleanImg((pick || list[0] || {}).img);
  }
  function bandOpen(img, extra) {
    return '<div class="pf-band' + (img ? ' has-cover' : '') + (extra ? ' ' + extra : '') + '">' +
      (img ? '<div class="pf-cover" aria-hidden="true" style="background-image:url(\'' + esc(img) + '\')"></div>' : '');
  }

  /* ---------- shared pieces of the views ---------- */
  function tileHTML(it, i) {
    var meta = [it.year, it.sub].filter(filled).join(' · ');
    return '<li class="tile' + (i === 0 ? ' is-top' : '') + '"><span class="tile-art">' + coverHTML(it) + '<span class="tile-n">' + (i === 0 ? '★ ' : '') + pad2(i + 1) + '</span></span>' +
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
    var cached = p.recs && Array.isArray(p.recs.items) ? p.recs : null;
    var canFind = CATS.some(function (c) { return p.favs[c.id].some(function (it) { return it.id; }); });
    app.innerHTML =
      bandOpen(bannerImg(p)) + '<div class="wrap pf-hero">' +
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
      '</section>' +

      '<section class="block" aria-labelledby="fy-h" style="padding-top:3rem"><div class="block-head"><div><p class="eyebrow">Picked for you</p>' +
      '<h2 id="fy-h">Games from everything you love</h2>' +
      '<p class="sub">Games like your games, games based on what you watch, games with the mood of your movies and series, and games with music like the songs you love. Looked up on Wikidata only when you press the button.</p></div>' +
      '<button type="button" class="btn btn-primary" id="pf-find"' + (canFind ? '' : ' disabled') + '>' + icon('search') + (cached ? 'Look again' : 'Find games for me') + '</button></div>' +
      (canFind ? '' : '<p class="notice">Add favorites from the search first, so there is something to start from.</p>') +
      '<div class="chips fy-srcs" id="fy-srcs" role="group" aria-label="Show games by reason"' + (cached ? '' : ' hidden') + '></div>' +
      '<p class="wd-msg" id="pf-msg" role="status">' + (cached ? 'Last looked up on ' + esc(new Date(cached.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '.' : '') + '</p>' +
      '<ul class="fy" id="fy"></ul></section>' +

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
    /* ---- picked for you ---- */
    var find = document.getElementById('pf-find'), msg = document.getElementById('pf-msg');
    var fy = document.getElementById('fy'), srcs = document.getElementById('fy-srcs');
    var items = cached ? cached.items : [], filter = '';
    function srcOf(id) { return SOURCES.filter(function (s) { return s.id === id; })[0]; }
    function drawChips(state) {
      srcs.hidden = false;
      srcs.innerHTML = '<button type="button" class="chip" data-src="" aria-pressed="' + (!filter) + '">All<span class="n">' + items.length + '</span></button>' +
        SOURCES.map(function (s) {
          var n = items.filter(function (x) { return x.src === s.id; }).length, st = state && state[s.id];
          return '<button type="button" class="chip" data-src="' + s.id + '" aria-pressed="' + (filter === s.id) + '"' + (n ? '' : ' disabled') + '>' + icon(s.ic) + s.name +
            '<span class="n">' + (st === 'wait' ? '…' : n) + '</span></button>';
        }).join('');
    }
    function drawCards() {
      var shown = items.filter(function (x) { return !filter || x.src === filter; });
      fy.innerHTML = shown.map(function (x) {
        var i = items.indexOf(x), inDiary = GT.diary && GT.diary.find(x.label, x.id), s = srcOf(x.src);
        return '<li class="fy-card" data-src="' + x.src + '"><span class="fy-art">' + coverHTML(x) + '<span class="fy-src">' + icon(s.ic) + esc(s.name) + '</span></span>' +
          '<span class="fy-b"><span class="fy-t">' + esc(x.label) + (x.year ? ' <span class="muted">' + esc(x.year) + '</span>' : '') + '</span>' +
          '<span class="fy-why">' + esc(x.why) + '</span>' +
          (x.because ? '<span class="fy-bc">Because you like <b>' + esc(x.because) + '</b></span>' : '') +
          '<span class="fy-a">' + (inDiary ? '<a class="btn btn-sm" href="#/diary/' + encodeURIComponent(inDiary.id) + '">' + icon('diary') + 'In your diary</a>'
            : '<button type="button" class="btn btn-sm" data-want="' + i + '">' + icon('plus') + 'Want to play</button>') +
          '<a class="btn btn-sm" href="https://www.wikidata.org/wiki/' + x.id + '" target="_blank" rel="noopener" aria-label="' + esc(x.label) + ' on Wikidata (opens in a new tab)">' + icon('external') + '</a></span></span></li>';
      }).join('');
    }
    srcs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-src]');
      if (!b || b.disabled) return;
      filter = b.getAttribute('data-src');
      all('[data-src]', srcs).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      drawCards();
    });
    fy.addEventListener('click', function (e) {
      var b = e.target.closest('[data-want]');
      if (!b || !GT.diary) return;
      var x = items[Number(b.getAttribute('data-want'))];
      var id = GT.diary.add({ title: x.label, studio: '', year: x.year, genre: '', source: { wikidata: x.id } }, 'planned');
      if (!id) { msg.textContent = 'This browser did not allow saving to the diary.'; return; }
      var a = document.createElement('a');
      a.className = 'btn btn-sm'; a.href = '#/diary/' + encodeURIComponent(id); a.innerHTML = icon('diary') + 'In your diary';
      b.replaceWith(a); a.focus();
      msg.textContent = x.label + ' was added to your diary as "Want to play".';
    });
    find.addEventListener('click', function () {
      var state = {};
      Object.keys(recQueries(p)).forEach(function (k) { state[k] = 'wait'; });
      find.disabled = true; filter = '';
      msg.textContent = 'Looking up games for you on Wikidata. This can take a few seconds…';
      items = []; drawChips(state); fy.innerHTML = '';
      findForMe(p, function (k, ok) { state[k] = ok ? 'done' : 'fail'; }).then(function (list) {
        items = list || [];
        if (!items.length) { msg.textContent = 'Nothing was found this time. Try other favorites, chosen from the search.'; srcs.hidden = true; return; }
        var failed = Object.keys(state).filter(function (k) { return state[k] === 'fail'; });
        p.recs = { at: new Date().toISOString(), items: items };
        write(p);
        msg.textContent = plural(items.length, 'game', 'games') + ' found.' + (failed.length ? ' One source did not answer, try again later for more.' : '');
        drawChips(); drawCards();
      }).catch(function () {
        msg.textContent = 'Could not reach Wikidata. Check the connection and try again.';
      }).then(function () { find.disabled = !canFind; find.innerHTML = icon('search') + 'Look again'; });
    });
    if (cached) { drawChips(); drawCards(); }

    /* favorites saved before covers existed get theirs now */
    backfillCovers(p).then(function (changed) {
      if (changed && write(p) && location.hash === '#/me') GT.rerender();
    }, function () { /* covers are optional */ });
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
      }).join('') + '</div></fieldset>' +
      '<fieldset class="fld banners"><legend class="fld-l">Banner</legend><p class="fld-h">The image behind your name. Covers come from the Wikipedia article of each favorite.</p>' +
      '<div class="bn-row" id="pe-banner"></div></fieldset></div></section>' +
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
    function paintBanner() {
      var opts = [['auto', 'Automatic', ''], ['none', 'Pattern only', '']];
      CATS.forEach(function (c) { p.favs[c.id].forEach(function (it) { if (cleanImg(it.img)) opts.push([itemKey(it), it.label, it.img]); }); });
      var cur = p.banner || 'auto';
      if (!opts.some(function (o) { return o[0] === cur; })) cur = 'auto';
      document.getElementById('pe-banner').innerHTML = opts.map(function (o) {
        return '<label class="bn"><input type="radio" name="pe-bn" value="' + esc(o[0]) + '"' + (o[0] === cur ? ' checked' : '') + '>' +
          '<span class="bn-art">' + (o[2] ? '<img src="' + esc(cleanImg(o[2])) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : (o[0] === 'none' ? posterSVG(p.name || 'pattern') : icon('star'))) + '</span>' +
          '<span class="bn-t">' + esc(o[1]) + '</span></label>';
      }).join('');
    }
    document.getElementById('pe-banner').addEventListener('change', function (e) {
      if (e.target.name === 'pe-bn') { p.banner = e.target.value; save(); }
    });
    function paintList(c) {
      var list = p.favs[c.id];
      document.getElementById('pn-' + c.id).textContent = list.length + ' / ' + MAX;
      document.getElementById('pl-' + c.id).innerHTML = list.map(function (it, i) {
        return '<li class="pe-item"><span class="pe-art" aria-hidden="true">' + coverHTML(it) + '</span><span class="pe-b"><span class="pe-t">' +
          (i === 0 && list.length > 1 ? '<span class="pe-top">★ Top</span>' : '') + esc(it.label) + '</span>' +
          '<span class="pe-s">' + esc([it.year, it.sub].filter(filled).join(' · ') || 'Added as typed') + '</span>' +
          (it.genres && it.genres.length ? '<span class="pe-g">' + esc(it.genres.slice(0, 3).join(', ')) + '</span>' : '<span class="pe-g muted">No genres, so it does not count toward your taste</span>') + '</span>' +
          '<span class="rep-tools">' +
          '<button type="button" class="ib" data-mv="-1" data-i="' + i + '" aria-label="Move ' + esc(it.label) + ' up"' + (i === 0 ? ' disabled' : '') + '>' + icon('up') + '</button>' +
          '<button type="button" class="ib" data-mv="1" data-i="' + i + '" aria-label="Move ' + esc(it.label) + ' down"' + (i === list.length - 1 ? ' disabled' : '') + '>' + icon('down') + '</button>' +
          '<button type="button" class="ib" data-rm="' + c.id + '" data-i="' + i + '" aria-label="Remove ' + esc(it.label) + '">' + icon('trash') + '</button></span></li>';
      }).join('');
      paintBanner();
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
            return '<li><button type="button" class="wd-item has-thumb" data-pick="' + i + '"><span class="wd-thumb" aria-hidden="true">' + coverHTML(it) + '</span>' +
              '<span class="wd-txt"><span class="t">' + esc(it.label) + '</span>' +
              (meta ? '<span class="m">' + esc(meta) + '</span>' : '') + (it.genres.length ? '<span class="d">' + esc(it.genres.slice(0, 3).join(', ')) + '</span>' : '') + '</span></button></li>';
          }).join('') + '<li><button type="button" class="wd-item wd-typed" data-typed="1"><span class="t">Add "' + esc(term) + '" as typed</span><span class="d">Without genres, so it will not shape your taste.</span></button></li>';
        }).catch(function () { if (my === token) m.textContent = 'Could not reach Wikidata. Check the connection and try again.'; });
      });
      res.addEventListener('click', function (e) {
        var b = e.target.closest('[data-pick], [data-typed]');
        if (!b) return;
        if (b.hasAttribute('data-typed')) addItem({ id: '', label: q.value.trim(), year: '', sub: '', genres: [], gq: [] });
        else {
          var it = found[Number(b.getAttribute('data-pick'))];
          addItem({ id: it.id, label: it.label, year: it.year, sub: it.sub, genres: it.genres, gq: it.gq, sq: it.sq, wiki: it.wiki, img: it.img, noImg: !it.img });
        }
      });
      document.getElementById('pl-' + c.id).addEventListener('click', function (e) {
        var mv = e.target.closest('[data-mv]');
        if (mv) {
          var i = Number(mv.getAttribute('data-i')), j = i + Number(mv.getAttribute('data-mv')), l = p.favs[c.id];
          if (j < 0 || j >= l.length) return;
          var tmp = l[i]; l[i] = l[j]; l[j] = tmp;
          paintList(c); save();
          var again = document.querySelector('#pl-' + c.id + ' [data-mv="' + mv.getAttribute('data-mv') + '"][data-i="' + j + '"]');
          if (!again || again.disabled) again = document.querySelector('#pl-' + c.id + ' [data-i="' + j + '"][data-mv]:not([disabled])');
          if (again) again.focus();
          m.textContent = l[j].label + ' moved to position ' + (j + 1) + '.';
          return;
        }
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
    if (!isNew) backfillCovers(p).then(function (changed) {
      if (!changed || !document.getElementById('pe-banner')) return;
      save(); CATS.forEach(paintList);
    }, function () { /* covers are optional */ });
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
      bandOpen(o.banner, 'acc-' + o.accent) + '<div class="wrap pf-hero">' +
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
