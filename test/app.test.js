/* Plain-node test suite, no dependencies:  node test/app.test.js
   1. the DGI model reproduces every published score and sensitivity case
   2. every finding / source / prediction cross-reference actually resolves
   3. every route the map draws has coordinates for all of its stations
   4. the geometry stays inside Singapore */
var path = require('path');
function load(p) { return require(path.join(__dirname, '..', p)); }

var sources = load('assets/js/data/sources.js');
var findings = load('assets/js/data/findings.js');
var network = load('assets/js/data/network.js');
var future = load('assets/js/data/future.js');
var areas = load('assets/js/data/areas.js');
var predictions = load('assets/js/data/predictions.js');
var geo = load('assets/js/geo.js');
var dgi = load('assets/js/dgi.js');

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.error('  FAIL  ' + name + (extra ? '  -> ' + extra : ''));
}
function near(name, got, want, tol) {
  ok(name, Math.abs(got - want) <= (tol || 0.06), 'got ' + got.toFixed(3) + ', want ' + want);
}
function section(t) { console.log('\n' + t); }

var byId = function (a) { var m = {}; a.forEach(function (x) { m[x.id] = x; }); return m; };
var SRC = byId(sources), FIND = byId(findings), PRED = byId(predictions), AREA = byId(areas);

/* ---- 1. DGI reproduces Section 5.2 ---- */
section('DGI reproduces the published scores');
var published = {
  plab: 127.5, fernvale: 17.8, 'yishun-east': 14.7, sembawang: 14.5, punggol: 10.2,
  tengah: 6.3, brickworks: 4.5, kranji: 2.1, 'tampines-north': 1.8, 'toa-payoh': 1.3,
  'turf-city': 1.3, chencharu: 0.5, gsw: 0.45, dover: 0.3
};
Object.keys(published).forEach(function (id) {
  ok('area ' + id + ' exists', !!AREA[id]);
  if (AREA[id]) near('DGI ' + id, dgi.score(AREA[id]).total, published[id]);
});
ok('every area has a published score to check', areas.length === Object.keys(published).length);

var order = dgi.rank(areas).map(function (r) { return r.id; });
ok('PLAB ranks first', order[0] === 'plab', order[0]);
ok('north/north-east cluster holds ranks 2-4',
  JSON.stringify(order.slice(1, 4)) === JSON.stringify(['fernvale', 'yishun-east', 'sembawang']),
  order.slice(1, 4).join(','));

/* ---- 2. Sensitivity cases from Section 5.3 ---- */
section('Sensitivity tests from Section 5.3');
/* The published sensitivity figures are rounded twice - H is rounded to 1dp
   before the multiplication - so allow 0.1 rather than the 0.06 used above. */
var TOL = 0.1;
near('2.5 residents/home: Fernvale', dgi.score(AREA.fernvale, { residentsPerHome: 2.5 }).total, 21.4, TOL);
near('2.5 residents/home: Yishun East', dgi.score(AREA['yishun-east'], { residentsPerHome: 2.5 }).total, 17.6, TOL);
near('3.5 residents/home: Fernvale', dgi.score(AREA.fernvale, { residentsPerHome: 3.5 }).total, 15.3, TOL);
near('3.5 residents/home: Yishun East', dgi.score(AREA['yishun-east'], { residentsPerHome: 3.5 }).total, 12.6, TOL);
near('no crowding: Fernvale', dgi.score(AREA.fernvale, { crowding: false }).total, 11.9, TOL);
near('no crowding: Yishun East', dgi.score(AREA['yishun-east'], { crowding: false }).total, 12.3, TOL);
near('no crowding: Sembawang', dgi.score(AREA.sembawang, { crowding: false }).total, 12.1, TOL);
near('no crowding: Punggol', dgi.score(AREA.punggol, { crowding: false }).total, 6.8, TOL);
ok('PLAB stays first at 2.5 residents/home', dgi.rank(areas, { residentsPerHome: 2.5 })[0].id === 'plab');
ok('PLAB stays first at 3.5 residents/home', dgi.rank(areas, { residentsPerHome: 3.5 })[0].id === 'plab');
ok('PLAB stays first with crowding removed', dgi.rank(areas, { crowding: false })[0].id === 'plab');
/* The document's own Sembawang figures for the 2.5 / 3.5 rows do not reproduce
   (it prints 14.8 and 14.3; recomputing its stated inputs gives 15.5 and 13.8),
   so those two cells are not asserted. Its stated CONCLUSIONS do reproduce, and
   those are what is checked here. */
var at25 = dgi.rank(areas, { residentsPerHome: 2.5 }).map(function (r) { return r.id; });
var at35 = dgi.rank(areas, { residentsPerHome: 3.5 }).map(function (r) { return r.id; });
ok('at 2.5 residents/home the top order is unchanged',
  JSON.stringify(at25.slice(0, 4)) === JSON.stringify(['plab', 'fernvale', 'yishun-east', 'sembawang']),
  at25.slice(0, 4).join(','));
ok('at 3.5 residents/home Sembawang moves ahead of Yishun East',
  at35.indexOf('sembawang') < at35.indexOf('yishun-east'));
ok('at 3.5 residents/home the top two are unchanged',
  JSON.stringify(at35.slice(0, 2)) === JSON.stringify(['plab', 'fernvale']), at35.slice(0, 2).join(','));
var noCrowd = dgi.rank(areas, { crowding: false }).map(function (r) { return r.id; });
ok('with crowding removed the next three are a near tie',
  Math.abs(dgi.score(AREA['yishun-east'], { crowding: false }).total -
           dgi.score(AREA.fernvale, { crowding: false }).total) < 0.5 &&
  noCrowd.slice(1, 4).sort().join(',') === 'fernvale,sembawang,yishun-east',
  noCrowd.slice(1, 4).join(','));
/* Section 5.3 also halves PLAB homes and relaxes its access gap; both keep it first. */
var plabHalf = { id: 'x', components: [{ kind: 'homes', homes: 75, A: 0.85, T: 1.0, C: 1.0 }] };
var plabOpen = { id: 'y', components: [{ kind: 'homes', homes: 150, A: 0.5, T: 1.0, C: 1.0 }] };
near('PLAB with homes halved', dgi.score(plabHalf).total, 63.8);
near('PLAB with access gap 0.5', dgi.score(plabOpen).total, 75.0);

/* ---- 3. Cross-references resolve ---- */
section('Cross-references resolve');
findings.forEach(function (f) {
  f.sources.forEach(function (s) { ok('finding ' + f.id + ' cites known source ' + s, !!SRC[s]); });
});
predictions.forEach(function (p) {
  p.f.forEach(function (f) { ok('prediction ' + p.id + ' cites known finding ' + f, !!FIND[f]); });
  ok('prediction ' + p.id + ' probability in range', p.p > 0 && p.p < 1);
});
function checkRefs(label, obj) {
  (obj.f || []).forEach(function (f) { ok(label + ' -> finding ' + f, !!FIND[f]); });
  (obj.s || []).forEach(function (s) { ok(label + ' -> source ' + s, !!SRC[s]); });
  (obj.p || []).forEach(function (p) { ok(label + ' -> prediction ' + p, !!PRED[p]); });
  if (obj.dgi) ok(label + ' -> area ' + obj.dgi, !!AREA[obj.dgi]);
}
areas.forEach(function (a) {
  checkRefs('area ' + a.id, a);
  ok('area ' + a.id + ' has a one-line summary for the panel list', !!a.note && a.note.length < 120);
});
future.forEach(function (proj) {
  checkRefs('project ' + proj.id, proj);
  proj.stations.forEach(function (s) { checkRefs('station ' + proj.id + '/' + s.code, s); });
});

/* every prediction is reachable from something on the map */
var reachable = {};
function collect(o) { (o.p || []).forEach(function (p) { reachable[p] = true; }); }
areas.forEach(collect);
future.forEach(function (proj) { collect(proj); proj.stations.forEach(collect); });
/* P05 is a process forecast about LTA publishing the next master plan: it has
   no location, so it lives only in the panel's full forecast list. */
var NETWORK_WIDE = ['P05'];
predictions.forEach(function (p) {
  ok('prediction ' + p.id + ' is reachable from a map object',
    !!reachable[p.id] || NETWORK_WIDE.indexOf(p.id) >= 0);
});

/* ---- 4. Routes have geometry ---- */
section('Every drawn route resolves to coordinates');
future.forEach(function (proj) {
  var lookup = {};
  proj.stations.forEach(function (s) { lookup[s.code] = true; });
  Object.keys(proj.anchors || {}).forEach(function (c) { lookup[c] = true; });
  var lists = proj.routes || (proj.route ? [proj.route] : []);
  ok('project ' + proj.id + ' draws at least one route', lists.length > 0);
  lists.forEach(function (codes, i) {
    ok('project ' + proj.id + ' route ' + i + ' has 2+ points', codes.length >= 2);
    codes.forEach(function (c) {
      ok('project ' + proj.id + ' route ' + i + ' knows station ' + c, !!lookup[c]);
    });
  });
});

/* ---- 5. Geometry sanity ---- */
section('Geometry stays inside Singapore');
var B = geo.BOUNDS;
function inBounds(lat, lon) { return lat >= B.minLat && lat <= B.maxLat && lon >= B.minLon && lon <= B.maxLon; }
network.forEach(function (line) {
  ok('line ' + line.id + ' has stations', line.stations.length > 1);
  line.stations.forEach(function (s) {
    ok('station ' + line.id + '/' + s.code + ' in bounds', inBounds(s.lat, s.lon), s.lat + ',' + s.lon);
  });
});
future.forEach(function (proj) {
  proj.stations.forEach(function (s) {
    ok('future station ' + proj.id + '/' + s.code + ' in bounds', inBounds(s.lat, s.lon), s.lat + ',' + s.lon);
  });
});
areas.forEach(function (a) { ok('area ' + a.id + ' in bounds', inBounds(a.lat, a.lon)); });
var nw = geo.px(B.maxLat, B.minLon), se = geo.px(B.minLat, B.maxLon);
ok('projection puts north-west at the origin', Math.abs(nw.x) < 1 && Math.abs(nw.y) < 1);
ok('projection is oriented north-up, east-right', se.x > nw.x && se.y > nw.y);
ok('viewBox is landscape', geo.viewBox[2] > geo.viewBox[3]);
ok('no hand-drawn coastline is exported', geo.land === undefined);
var line0 = network[0].stations.slice(0, 4).map(function (s) { return { lat: s.lat, lon: s.lon }; });
var d = geo.smoothPath(line0, 16);
ok('smoothPath starts with a move', /^M[\d.]+ [\d.]+/.test(d));
ok('smoothPath rounds its corners', d.indexOf('Q') > 0);
ok('polyline uses only straight segments', geo.polyline(line0).indexOf('Q') < 0);

/* ---- 6. Speculative content is labelled as such ---- */
section('Speculative content is labelled');
future.forEach(function (proj) {
  ok('project ' + proj.id + ' has a known class', ['committed', 'study', 'model'].indexOf(proj.klass) >= 0);
  proj.stations.forEach(function (s) {
    ok('station ' + proj.id + '/' + s.code + ' declares placement or is an open anchor',
      !!s.placement || s.status === 'open');
  });
});
var stl = future.filter(function (p) { return p.klass === 'study'; });
ok('both STL arms are present', stl.length === 2, stl.length);
stl.forEach(function (p) {
  ok(p.id + ': every station is flagged as model-placed',
    p.stations.every(function (s) { return s.placement === 'model'; }));
});
var plab = future.find(function (p) { return p.id === 'PLAB'; });
ok('PLAB corridor is model class', plab && plab.klass === 'model');
ok('PLAB interior stations are model-placed',
  plab.stations.filter(function (s) { return /^PLAB-/.test(s.code); }).every(function (s) { return s.placement === 'model'; }));

/* ---- 7. Provenance: the data still matches the vendored source document ----
   docs/analysis-v2.0.md is the analysis this app renders. If someone edits the
   data files, these checks catch drift away from what the document actually
   says. When the document is superseded, update it AND these expectations
   together - see UPDATING.md. */
section('Data matches the vendored source document');
var fs = require('fs');
var docPath = path.join(__dirname, '..', 'docs', 'analysis-v2.0.md');
ok('the source document is vendored in the repo', fs.existsSync(docPath));
if (fs.existsSync(docPath)) {
  var doc = fs.readFileSync(docPath, 'utf8');
  ok('document is version 2.0', /\*\*Version:\*\* 2\.0/.test(doc));

  /* Source register: ids, grades and URLs must match exactly. */
  var docSources = {};
  doc.split('\n').forEach(function (line) {
    var m = line.match(/^\|\s*(S\d\d)\s*\|(.+?)\|(.+?)\|(.+?)\|\s*([ABCD])\s*\|\s*(\S+)\s*\|$/);
    if (m) docSources[m[1]] = { grade: m[5], url: m[6] };
  });
  ok('document lists 79 sources', Object.keys(docSources).length === 79, Object.keys(docSources).length);
  ok('data carries the same number of sources', sources.length === Object.keys(docSources).length);
  sources.forEach(function (s2) {
    var d2 = docSources[s2.id];
    ok('source ' + s2.id + ' is in the document', !!d2);
    if (d2) {
      ok('source ' + s2.id + ' grade matches the document', s2.grade === d2.grade, s2.grade + ' vs ' + d2.grade);
      ok('source ' + s2.id + ' url matches the document', s2.url === d2.url, s2.url + ' vs ' + d2.url);
    }
  });

  /* Forecasts: probability and deadline must match. */
  var docPreds = {};
  doc.split('\n').forEach(function (line) {
    var m = line.match(/^\|\s*(P\d\d)\s*\|(.+?)\|\s*(.+?)\s*\|\s*\*\*(\d+)%\*\*\s*\|/);
    if (m) docPreds[m[1]] = { deadline: m[3], p: Number(m[4]) / 100 };
  });
  ok('document lists 22 forecasts', Object.keys(docPreds).length === 22, Object.keys(docPreds).length);
  predictions.forEach(function (p2) {
    var d2 = docPreds[p2.id];
    ok('forecast ' + p2.id + ' is in the document', !!d2);
    if (d2) {
      ok('forecast ' + p2.id + ' probability matches', Math.abs(p2.p - d2.p) < 1e-9, p2.p + ' vs ' + d2.p);
      ok('forecast ' + p2.id + ' deadline matches', p2.deadline === d2.deadline, p2.deadline + ' vs ' + d2.deadline);
    }
  });

  /* Demand Gap Index: the published total at each rank must be what we compute. */
  var docScores = {};
  doc.split('\n').forEach(function (line) {
    var m = line.match(/^\|\s*(\d{1,2})\s*\|\s*\*{0,2}(.+?)\*{0,2}\s*\|.*\|\s*\*{0,2}([\d.]+)\*{0,2}\s*\|\s*[A-Z].*\|$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 14) docScores[Number(m[1])] = Number(m[3]);
  });
  ok('document lists all 14 ranked areas', Object.keys(docScores).length === 14, Object.keys(docScores).length);
  areas.forEach(function (a) {
    var want = docScores[a.rank];
    ok('area ' + a.id + ' claims a rank the document has', want !== undefined);
    if (want !== undefined) near('rank ' + a.rank + ' (' + a.id + ') matches the document', dgi.score(a).total, want);
  });
}

/* ---- 8. Repo hygiene: the things a fresh clone needs to be usable ---- */
section('A fresh clone has what it needs');
['LICENSE', 'README.md', 'AGENTS.md', 'UPDATING.md', 'docs/updates.md'].forEach(function (f) {
  ok(f + ' exists', fs.existsSync(path.join(__dirname, '..', f)));
});
var licence = fs.readFileSync(path.join(__dirname, '..', 'LICENSE'), 'utf8');
ok('LICENSE is MIT', /^MIT License/.test(licence));
var pkg = require(path.join(__dirname, '..', 'package.json'));
ok('package.json agrees the licence is MIT', pkg.license === 'MIT');
ok('npm test runs this suite', /test\/app\.test\.js/.test(pkg.scripts.test));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
