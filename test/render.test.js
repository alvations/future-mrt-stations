/* Rendering smoke test:  node test/render.test.js

   The other two suites never open a browser, so until now the things that only
   eyes caught - labels piling up, symbols scaling wrongly with zoom, a silent
   JS error - could only be found by a human looking at a screenshot. This runs
   the real page in headless Chromium and asserts the properties those failures
   violate.

   It needs Playwright. If Playwright is not installed it SKIPS rather than
   fails, so `npm test` stays dependency-free; CI installs it and runs this as
   its own job. It serves the site itself, so there is no server dependency
   either. */
'use strict';
var path = require('path');
var fs = require('fs');
var http = require('http');

var ROOT = path.join(__dirname, '..');

function findPlaywright() {
  var candidates = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright',
    path.join(ROOT, 'node_modules', 'playwright')
  ];
  for (var i = 0; i < candidates.length; i++) {
    try { return require(candidates[i]); } catch (e) { /* try the next */ }
  }
  return null;
}

var pw = findPlaywright();
if (!pw) {
  console.log('render: SKIPPED - Playwright not installed.');
  console.log('  npm i --no-save playwright && npx playwright install chromium');
  process.exit(0);
}

var MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/markdown',
  '.svg': 'image/svg+xml', '.png': 'image/png'
};

/* A static server small enough to not be a dependency. Paths are resolved
   inside ROOT and anything escaping it is refused. */
function serve(port) {
  return new Promise(function (resolve) {
    var server = http.createServer(function (req, res) {
      var rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      if (rel === '') rel = 'index.html';
      var file = path.resolve(ROOT, rel);
      if (file.indexOf(path.resolve(ROOT)) !== 0 || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', function () { resolve(server); });
  });
}

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.error('  FAIL  ' + name + (extra ? '  -> ' + extra : ''));
}
function section(t) { console.log('\n' + t); }

/* Expected counts are derived from the data, never hardcoded: the point is that
   everything in the data reaches the screen, not that a number stays still. */
var network = require(path.join(ROOT, 'assets', 'js', 'data', 'network.js'));
var lrt = require(path.join(ROOT, 'assets', 'js', 'data', 'lrt.js'));
var future = require(path.join(ROOT, 'assets', 'js', 'data', 'future.js'));
var areas = require(path.join(ROOT, 'assets', 'js', 'data', 'areas.js'));

function expectedNodes() {
  var keys = {};
  function add(lat, lon) { keys[lat.toFixed(4) + ',' + lon.toFixed(4)] = true; }
  network.forEach(function (l) { l.stations.forEach(function (s) { add(s.lat, s.lon); }); });
  lrt.forEach(function (l) { l.stations.forEach(function (s) { add(s.lat, s.lon); }); });
  future.forEach(function (p) { p.stations.forEach(function (s) { add(s.lat, s.lon); }); });
  return Object.keys(keys).length;
}

function expectedRoutePaths() {
  var n = network.length + lrt.length;
  future.forEach(function (p) { n += (p.routes || (p.route ? [p.route] : [])).length; });
  return n * 2;    /* each route draws a halo and a stroke */
}

(async function main() {
  var PORT = 8123;
  var server = await serve(PORT);
  var base = 'http://127.0.0.1:' + PORT + '/index.html';
  var browser = await pw.chromium.launch();

  try {
    /* ---- 1. It loads, and everything in the data reaches the screen ---- */
    section('The page loads cleanly');
    var page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    var errors = [];
    page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
    page.on('console', function (m) { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(base);
    await page.waitForTimeout(700);

    var counts = await page.evaluate(function () {
      return {
        nodes: document.querySelectorAll('.node').length,
        routes: document.querySelectorAll('.route').length,
        bubbles: document.querySelectorAll('.bubble').length,
        panel: document.querySelector('#panel-body').textContent.length
      };
    });
    ok('no console or page errors', errors.length === 0, errors.join(' | '));
    ok('every distinct location becomes a node', counts.nodes === expectedNodes(), counts.nodes + ' vs ' + expectedNodes());
    ok('every route is drawn', counts.routes === expectedRoutePaths(), counts.routes + ' vs ' + expectedRoutePaths());
    ok('every demand area becomes a bubble', counts.bubbles === areas.length, String(counts.bubbles));
    ok('the panel renders content', counts.panel > 500, String(counts.panel));

    /* ---- 2. Labels declutter ---- */
    section('Labels do not collide');
    async function overlappingLabels() {
      return page.evaluate(function () {
        var boxes = [];
        document.querySelectorAll('.node:not(.hide-label)').forEach(function (g) {
          if (g.style.display === 'none') return;
          var t = g.querySelector('text.label');
          if (!t) return;
          var b = t.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          boxes.push({ name: t.textContent, x0: b.left, y0: b.top, x1: b.right, y1: b.bottom });
        });
        var hits = [];
        for (var i = 0; i < boxes.length; i++) {
          for (var j = i + 1; j < boxes.length; j++) {
            var a = boxes[i], c = boxes[j];
            var ox = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0);
            var oy = Math.min(a.y1, c.y1) - Math.max(a.y0, c.y0);
            /* A couple of pixels of kerning overlap is not a collision. */
            if (ox > 2 && oy > 2) hits.push(a.name + ' / ' + c.name);
          }
        }
        return { count: boxes.length, hits: hits };
      });
    }
    var atRest = await overlappingLabels();
    ok('some labels are visible at the default view', atRest.count > 5, String(atRest.count));
    ok('no two visible labels overlap at the default view', atRest.hits.length === 0, atRest.hits.slice(0, 3).join('; '));

    for (var z = 0; z < 4; z++) await page.click('#zoom-in');
    await page.waitForTimeout(500);
    var zoomed = await overlappingLabels();
    ok('labels are still shown when zoomed in', zoomed.count > 5, String(zoomed.count));
    ok('no two visible labels overlap when zoomed in', zoomed.hits.length === 0, zoomed.hits.slice(0, 3).join('; '));

    /* Zooming in unlocks lower-priority tiers. It does not necessarily show MORE
       labels in total - fewer stations fit on screen - so the thing to assert is
       which tiers appear, not the count. */
    async function labelledOperatingStations() {
      return page.evaluate(function () {
        return document.querySelectorAll('.node.existing:not(.hide-label)').length;
      });
    }
    var deepZoom = await labelledOperatingStations();
    await page.click('#zoom-reset');
    await page.waitForTimeout(400);
    var restZoom = await labelledOperatingStations();
    ok('operating stations are unlabelled at the default view', restZoom === 0, String(restZoom));
    ok('operating stations gain labels when zoomed in', deepZoom > 0, String(deepZoom));

    /* ---- 3. Symbols hold their size on screen ---- */
    section('Symbols are symbols, not scaled geometry');
    async function dotRadius() {
      return page.evaluate(function () {
        var g = document.querySelector('.node.committed') || document.querySelector('.node');
        var c = g.querySelector('circle.dot');
        return c.getBoundingClientRect().width;
      });
    }
    await page.click('#zoom-reset');
    await page.waitForTimeout(400);
    var r1 = await dotRadius();
    for (var z2 = 0; z2 < 4; z2++) await page.click('#zoom-in');
    await page.waitForTimeout(500);
    var r2 = await dotRadius();
    ok('a station dot keeps its screen size across zoom levels',
      Math.abs(r1 - r2) <= Math.max(1.5, r1 * 0.15), r1.toFixed(1) + ' px vs ' + r2.toFixed(1) + ' px');

    var bubbleSize = await page.evaluate(function () {
      var c = document.querySelector('.bubble circle');
      return c.getBoundingClientRect().width;
    });
    await page.click('#zoom-reset');
    await page.waitForTimeout(400);
    var bubbleSize2 = await page.evaluate(function () {
      var c = document.querySelector('.bubble circle');
      return c.getBoundingClientRect().width;
    });
    ok('a demand bubble keeps its screen size across zoom levels',
      Math.abs(bubbleSize - bubbleSize2) <= Math.max(2, bubbleSize2 * 0.15),
      bubbleSize.toFixed(1) + ' px vs ' + bubbleSize2.toFixed(1) + ' px');

    /* ---- 4. Clicking still explains things ---- */
    section('Clicking a station shows its evidence');
    await page.click('[data-node="fernvale-sengkang-west"]');
    await page.waitForTimeout(400);
    var detail = await page.evaluate(function () {
      return {
        title: document.querySelector('#panel-head h2').textContent,
        findings: document.querySelectorAll('#panel-body details.item').length,
        sources: document.querySelectorAll('#panel-body .src a').length,
        dgi: (document.querySelector('#panel-body .big') || {}).textContent,
        access: /Nearest rail/.test(document.querySelector('#panel-body').textContent),
        hash: location.hash
      };
    });
    ok('the panel titles the station', detail.title === 'Fernvale / Sengkang West', detail.title);
    ok('the panel lists findings', detail.findings > 0, String(detail.findings));
    ok('the panel links sources', detail.sources > 0, String(detail.sources));
    ok('the panel shows the demand index', detail.dgi === '17.8', detail.dgi);
    ok('the panel shows the computed access distance', detail.access);
    ok('selection is deep-linkable', detail.hash === '#node/fernvale-sengkang-west', detail.hash);

    /* ---- 5. Layers ---- */
    section('Layers');
    var layers = ['existing', 'lrt', 'committed', 'study', 'model', 'demand'];
    for (var li = 0; li < layers.length; li++) await page.uncheck('[data-layer="' + layers[li] + '"]');
    await page.waitForTimeout(400);
    var hidden = await page.evaluate(function () {
      return [].slice.call(document.querySelectorAll('.route')).filter(function (r) { return r.style.display !== 'none'; }).length;
    });
    ok('turning every layer off empties the map', hidden === 0, String(hidden));
    for (var li2 = 0; li2 < layers.length; li2++) await page.check('[data-layer="' + layers[li2] + '"]');
    await page.waitForTimeout(400);
    var shown = await page.evaluate(function () {
      return [].slice.call(document.querySelectorAll('.route')).filter(function (r) { return r.style.display !== 'none'; }).length;
    });
    ok('turning them back on restores it', shown === expectedRoutePaths(), String(shown));

    /* ---- 6. Phone ---- */
    section('Phone viewport');
    var phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    var phoneErrors = [];
    phone.on('pageerror', function (e) { phoneErrors.push(e.message); });
    await phone.goto(base);
    await phone.waitForTimeout(700);
    var mobile = await phone.evaluate(function () {
      return {
        hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
        legendCollapsed: document.querySelector('.legend').classList.contains('collapsed'),
        panelVisible: document.querySelector('.panel').getBoundingClientRect().height > 100,
        headerFits: document.querySelector('header.top').scrollWidth <= window.innerWidth + 1,
        labels: document.querySelectorAll('.node:not(.hide-label)').length
      };
    });
    ok('no horizontal page scroll on a phone', !mobile.hScroll);
    ok('the legend starts collapsed on a phone', mobile.legendCollapsed);
    ok('the panel is usable on a phone', mobile.panelVisible);
    ok('the header fits the phone width', mobile.headerFits);
    ok('a phone shows fewer labels than a desktop', mobile.labels < atRest.count, mobile.labels + ' vs ' + atRest.count);
    ok('no page errors on a phone', phoneErrors.length === 0, phoneErrors.join(' | '));

    /* ---- 7. Themes ---- */
    section('Both themes');
    for (var ti = 0; ti < 2; ti++) {
      var scheme = ti === 0 ? 'dark' : 'light';
      var themed = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: scheme });
      var themeErrors = [];
      themed.on('pageerror', function (e) { themeErrors.push(e.message); });
      await themed.goto(base);
      await themed.waitForTimeout(600);
      var look = await themed.evaluate(function () {
        function lum(c) {
          var m = c.match(/\d+/g).map(Number).map(function (v) {
            v = v / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
        }
        var body = getComputedStyle(document.body);
        var l1 = lum(body.backgroundColor), l2 = lum(body.color);
        return {
          bg: body.backgroundColor,
          contrast: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
          land: document.querySelectorAll('.extent').length
        };
      });
      ok(scheme + ': body text meets 7:1 contrast', look.contrast >= 7, look.contrast.toFixed(1) + ':1');
      ok(scheme + ': the silhouette is drawn', look.land > 0);
      ok(scheme + ': no page errors', themeErrors.length === 0, themeErrors.join(' | '));
      await themed.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(function (e) {
  console.error('\nrender suite crashed: ' + (e && e.stack || e));
  process.exit(1);
});
