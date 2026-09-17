/* Future MRT Map - application.
   Renders the rail network as a schematic geographic map and, for anything you
   click, shows why it is there: the reasoning, the numbered findings and the
   graded sources behind it. */
(function () {
  'use strict';

  var D = MRT;
  var geo = D.geo, dgiModel = D.dgi;
  var byId = function (arr) {
    var m = {};
    arr.forEach(function (x) { m[x.id] = x; });
    return m;
  };
  var SRC = byId(D.sources), FIND = byId(D.findings), PRED = byId(D.predictions), AREA = byId(D.areas);
  var PROJ = byId(D.future);

  var KLASS_RANK = { existing: 0, committed: 1, study: 2, model: 3 };
  var PLACEMENT_RANK = { sited: 0, indicative: 1, model: 2 };
  var PLACEMENT_TEXT = {
    sited: 'Location officially known (plotted approximately)',
    indicative: 'Named by LTA, exact site not yet published',
    model: 'NOT an official location - this analysis’s illustration'
  };
  var KLASS_TEXT = {
    existing: 'Open today',
    committed: 'Committed / under construction',
    study: 'Under study - no alignment published',
    model: 'Speculative - inferred by this analysis'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function el(tag, attrs, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  /* ------------------------------------------------------------------
     Build the merged node registry. Stations at the same coordinates -
     an existing station and a future one on top of it - become a single
     clickable place that lists every role it plays.
     ------------------------------------------------------------------ */
  var nodes = [];
  var nodeByKey = {};

  function keyFor(lat, lon) { return lat.toFixed(4) + ',' + lon.toFixed(4); }

  function touch(lat, lon) {
    var k = keyFor(lat, lon);
    if (!nodeByKey[k]) {
      nodeByKey[k] = { key: k, lat: lat, lon: lon, names: [], codes: [], lines: [], projects: [], klass: 'existing', placement: null };
      nodes.push(nodeByKey[k]);
    }
    return nodeByKey[k];
  }

  D.network.forEach(function (line) {
    line.stations.forEach(function (s) {
      var n = touch(s.lat, s.lon);
      if (n.names.indexOf(s.name) < 0) n.names.push(s.name);
      if (n.codes.indexOf(s.code) < 0) n.codes.push(s.code);
      if (n.lines.indexOf(line) < 0) n.lines.push(line);
    });
  });

  D.future.forEach(function (proj) {
    proj.stations.forEach(function (s) {
      var n = touch(s.lat, s.lon);
      if (n.names.indexOf(s.name) < 0) n.names.push(s.name);
      if (n.codes.indexOf(s.code) < 0) n.codes.push(s.code);
      var isOpenAnchor = s.status === 'open';
      n.projects.push({ project: proj, station: s, anchor: isOpenAnchor });
      if (!isOpenAnchor) {
        if (KLASS_RANK[proj.klass] > KLASS_RANK[n.klass]) n.klass = proj.klass;
        if (s.placement && (n.placement === null || PLACEMENT_RANK[s.placement] > PLACEMENT_RANK[n.placement])) {
          n.placement = s.placement;
        }
      }
    });
  });

  /* Primary display name: prefer an existing station name, else the first
     non-parenthesised future name. */
  nodes.forEach(function (n) {
    var fromLine = n.lines.length ? n.names[0] : null;
    n.name = fromLine || n.names[0];
    n.alt = n.names.filter(function (x) { return x !== n.name; });
    n.isFuture = n.projects.some(function (r) { return !r.anchor; });
    n.dgi = null;
    n.projects.forEach(function (r) {
      if (!n.dgi && r.station.dgi) n.dgi = r.station.dgi;
      if (!n.dgi && r.project.dgi && !r.anchor) n.dgi = r.project.dgi;
    });
  });

  /* Unique, stable slugs for deep links. */
  var slugCount = {};
  nodes.forEach(function (n) {
    var base = slug(n.name);
    slugCount[base] = (slugCount[base] || 0) + 1;
    n.slug = slugCount[base] > 1 ? base + '-' + slugCount[base] : base;
  });
  var nodeBySlug = {};
  nodes.forEach(function (n) { nodeBySlug[n.slug] = n; });

  /* ------------------------------------------------------------------
     Map rendering
     ------------------------------------------------------------------ */
  var svg = document.getElementById('map');
  var vb = geo.viewBox;
  svg.setAttribute('viewBox', vb.join(' '));

  var gViewport = el('g', { id: 'viewport' });
  var gLand = el('g', { class: 'layer-land', opacity: '1' });
  var gRoutes = el('g', { class: 'layer-routes' });
  var gBubbles = el('g', { class: 'layer-bubbles' });
  var gNodes = el('g', { class: 'layer-nodes' });
  [gLand, gRoutes, gBubbles, gNodes].forEach(function (g) { gViewport.appendChild(g); });
  svg.appendChild(gViewport);


  function routePoints(codes, lookup) {
    var pts = [];
    codes.forEach(function (code) {
      var c = lookup[code];
      if (c) pts.push({ lat: c[0], lon: c[1] });
    });
    return pts;
  }

  var routeEls = [];
  function addRoute(points, color, klass, ref) {
    if (points.length < 2) return;
    var d = geo.smoothPath(points, 16);
    /* Soft wide stroke under everything: the "land" tint is simply where the
       network goes. Group opacity keeps overlaps from stacking up. */
    gLand.appendChild(el('path', { d: d, class: 'extent' }));
    var halo = el('path', { d: d, class: 'route halo', 'data-klass': klass });
    var p = el('path', { d: d, class: 'route ' + klass, stroke: color, 'data-klass': klass });
    if (ref) { p.setAttribute('data-ref', ref); p.style.cursor = 'pointer'; }
    gRoutes.appendChild(halo);
    gRoutes.appendChild(p);
    routeEls.push(halo, p);
  }

  D.network.forEach(function (line) {
    addRoute(line.stations.map(function (s) { return { lat: s.lat, lon: s.lon }; }), line.color, 'existing');
  });

  D.future.forEach(function (proj) {
    var lookup = {};
    proj.stations.forEach(function (s) { lookup[s.code] = [s.lat, s.lon]; });
    Object.keys(proj.anchors || {}).forEach(function (code) { lookup[code] = proj.anchors[code]; });
    var lists = proj.routes || (proj.route ? [proj.route] : []);
    lists.forEach(function (codes) {
      addRoute(routePoints(codes, lookup), proj.color, proj.klass, 'project:' + proj.id);
    });
  });

  /* Demand-gap bubbles */
  var baseRanking = dgiModel.rank(D.areas);
  var bubbleEls = {};
  var bubbleLabels = [];
  D.areas.forEach(function (a) {
    var s = dgiModel.score(a);
    var p = geo.px(a.lat, a.lon);
    var r = 9 + Math.sqrt(s.total) * 5.2;
    /* The radius encodes the index, not a geographic footprint, so the bubble
       is a symbol: it stays the same size on screen at every zoom level. */
    var g = el('g', { class: 'bubble ' + (a.verdict === 'covered' ? 'covered' : 'gap'), 'data-area': a.id, tabindex: '0', role: 'button' });
    g.setAttribute('aria-label', 'Demand gap area: ' + a.name + ', index ' + s.total.toFixed(1));
    g.appendChild(el('circle', { cx: 0, cy: 0, r: r.toFixed(1) }));
    var t = el('text', { x: 0, y: (-r - 6).toFixed(1), 'text-anchor': 'middle' });
    t.textContent = a.name + '  ' + s.total.toFixed(1);
    g.appendChild(t);
    gBubbles.appendChild(g);
    bubbleEls[a.id] = g;
    bubbleLabels.push({ el: t, g: g, px: p, r: r, w: t.textContent.length * 6.1, area: a });
  });

  /* Station nodes */
  var nodeEls = {};
  nodes.forEach(function (n) {
    var p = geo.px(n.lat, n.lon);
    var strokeColor = '#7d8894';
    if (n.projects.length) {
      var live = n.projects.filter(function (r) { return !r.anchor; });
      if (live.length) strokeColor = live[live.length - 1].project.color;
      else if (n.lines.length) strokeColor = n.lines[0].color;
    } else if (n.lines.length) {
      strokeColor = n.lines[0].color;
    }
    var cls = 'node ' + n.klass + (n.dgi ? ' is-dgi' : '');
    /* Only places with something new planned join the tab order; tabbing
       through 150 operating stations would be useless. They stay clickable
       and reachable from search. */
    var g = el('g', { class: cls, transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')', 'data-node': n.slug, tabindex: n.isFuture ? '0' : '-1', role: 'button' });
    g.setAttribute('aria-label', n.name + ' - ' + KLASS_TEXT[n.klass]);
    g.appendChild(el('circle', { class: 'focus-ring', r: 11 }));
    g.appendChild(el('circle', { class: 'hit', r: 12 }));
    g.appendChild(el('circle', { class: 'dot', stroke: strokeColor }));
    var east = n.lon > 103.88;
    var label = el('text', {
      class: 'label',
      x: east ? -9 : 9,
      y: 4,
      'text-anchor': east ? 'end' : 'start'
    });
    label.textContent = n.name;
    g.appendChild(label);
    gNodes.appendChild(g);
    nodeEls[n.slug] = g;
    n.px = p;
    n.labelEast = east;
    n.labelW = n.name.length * 6.8 + 14;
    n.priority = n.klass === 'model' ? 5 : n.klass === 'study' ? 5
      : n.klass === 'committed' ? 3 : n.lines.length > 1 ? 1 : 0;
  });

  /* ------------------------------------------------------------------
     Zoom / pan
     ------------------------------------------------------------------ */
  var view = { k: 1, x: 0, y: 0 };
  var MIN_K = 0.85, MAX_K = 9;

  /* Stations, labels and bubbles are symbols: they must hold the same size in
     screen pixels on a phone as on a desktop. The viewBox-to-pixel ratio moves
     with the viewport, so symbol scale compensates for it as well as for zoom.
     REF is the ratio on a typical desktop pane, where the base sizes were set. */
  var REF = 0.575;
  var sym = 1;
  function viewportRatio() {
    var r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return REF;
    return Math.min(r.width / vb[2], r.height / vb[3]);
  }

  /* Labels are inverse-scaled, so their size is constant in transformed
     viewBox units - which lets us declutter with a greedy pass in that space:
     highest priority first, drop anything that would overlap. */
  function overlaps(a, b) {
    return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  }

  function relabel() {
    var k = view.k;
    var pad = 60;
    var q = sym;
    var placed = [];
    var minZoom = { 5: 0, 3: 0.9, 1: 1.7, 0: 2.6 };

    function tryPlace(box) {
      for (var i = 0; i < placed.length; i++) if (overlaps(box, placed[i])) return false;
      placed.push(box);
      return true;
    }

    /* Bubble captions sit between study labels and committed labels. */
    var entries = [];
    nodes.forEach(function (n) {
      entries.push({ kind: 'node', n: n, priority: n.priority });
    });
    if (layerState.demand && k <= 3.4) {
      bubbleLabels.forEach(function (b) { entries.push({ kind: 'bubble', b: b, priority: 4 }); });
    } else {
      bubbleLabels.forEach(function (b) { b.el.style.display = 'none'; });
    }
    entries.sort(function (a, b) { return b.priority - a.priority; });

    entries.forEach(function (e) {
      if (e.kind === 'bubble') {
        var b = e.b;
        var bx = b.px.x * k + view.x, by = b.px.y * k + view.y - (b.r + 6) * q;
        var box = { x0: bx - b.w * q / 2, x1: bx + b.w * q / 2, y0: by - 9 * q, y1: by + 4 * q };
        var visible = bx > -pad && bx < vb[2] + pad && by > -pad && by < vb[3] + pad;
        b.el.style.display = (visible && tryPlace(box)) ? '' : 'none';
        return;
      }
      var n = e.n, g = nodeEls[n.slug];
      if (!layerState[n.klass]) { g.classList.add('hide-label'); return; }
      var x = n.px.x * k + view.x, y = n.px.y * k + view.y;
      if (x < -pad || x > vb[2] + pad || y < -pad || y > vb[3] + pad) { g.classList.add('hide-label'); return; }
      /* On a small screen symbols are relatively larger, so fewer tiers of
         label earn their space: compare against zoom adjusted for that. */
      if (k / q < minZoom[n.priority]) { g.classList.add('hide-label'); return; }
      var w = n.labelW * q;
      var lx0 = n.labelEast ? x - 9 * q - w : x + 9 * q;
      var lbox = { x0: lx0, x1: lx0 + w, y0: y - 8 * q, y1: y + 6 * q };
      g.classList.toggle('hide-label', !tryPlace(lbox));
      /* The dot itself always reserves space, so labels never sit on stations. */
      placed.push({ x0: x - 8 * q, x1: x + 8 * q, y0: y - 8 * q, y1: y + 8 * q });
    });
  }

  var relabelQueued = false;
  function queueRelabel() {
    if (relabelQueued) return;
    relabelQueued = true;
    requestAnimationFrame(function () { relabelQueued = false; relabel(); });
  }

  function applyView(scaleChanged) {
    gViewport.setAttribute('transform', 'translate(' + view.x.toFixed(2) + ',' + view.y.toFixed(2) + ') scale(' + view.k.toFixed(4) + ')');
    if (scaleChanged !== false) {
      sym = Math.min(3.2, REF / viewportRatio());
      var inv = sym / view.k;
      nodes.forEach(function (n) {
        nodeEls[n.slug].setAttribute('transform',
          'translate(' + n.px.x.toFixed(1) + ',' + n.px.y.toFixed(1) + ') scale(' + inv.toFixed(4) + ')');
      });
      bubbleLabels.forEach(function (b) {
        b.g.setAttribute('transform',
          'translate(' + b.px.x.toFixed(1) + ',' + b.px.y.toFixed(1) + ') scale(' + inv.toFixed(4) + ')');
      });
      gBubbles.style.opacity = view.k > 3.4 ? 0.35 : 1;
      /* The silhouette is orientation, not data: it recedes as you zoom in. */
      gLand.style.opacity = Math.max(0.16, Math.min(0.85, 1.0 - (view.k - 1) * 0.34));
    }
    queueRelabel();
  }

  function zoomAt(px, py, factor) {
    var k2 = Math.max(MIN_K, Math.min(MAX_K, view.k * factor));
    var f = k2 / view.k;
    view.x = px - (px - view.x) * f;
    view.y = py - (py - view.y) * f;
    view.k = k2;
    applyView(true);
  }

  function clientToSvg(cx, cy) {
    var r = svg.getBoundingClientRect();
    var sx = vb[2] / r.width, sy = vb[3] / r.height;
    var s = Math.max(sx, sy); /* preserveAspectRatio meet */
    return {
      x: (cx - r.left - r.width / 2) * s + vb[2] / 2,
      y: (cy - r.top - r.height / 2) * s + vb[3] / 2
    };
  }

  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = clientToSvg(e.clientX, e.clientY);
    zoomAt(p.x, p.y, e.deltaY < 0 ? 1.18 : 1 / 1.18);
  }, { passive: false });

  /* Pointer capture is only taken once a drag actually starts: capturing on
     every press would retarget the subsequent click to the <svg> itself and
     stations would stop responding. */
  var drag = null;
  var DRAG_THRESHOLD = 3;
  svg.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, captured: false };
  });
  svg.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var r = svg.getBoundingClientRect();
    var s = Math.max(vb[2] / r.width, vb[3] / r.height);
    var dx = (e.clientX - drag.x) * s, dy = (e.clientY - drag.y) * s;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) <= DRAG_THRESHOLD) return;
      drag.moved = true;
      try { svg.setPointerCapture(e.pointerId); drag.captured = true; } catch (_) {}
      svg.classList.add('dragging');
    }
    view.x = drag.vx + dx;
    view.y = drag.vy + dy;
    applyView(false);
  });
  function endDrag(e) {
    if (drag && drag.captured) { try { svg.releasePointerCapture(drag.id); } catch (_) {} }
    svg.classList.remove('dragging');
    var wasDrag = drag && drag.moved;
    drag = null;
    if (wasDrag) {
      /* Swallow the click that follows a pan. */
      svg.addEventListener('click', function once(ev) { ev.stopPropagation(); }, { capture: true, once: true });
    }
  }
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  document.getElementById('zoom-in').onclick = function () { zoomAt(vb[2] / 2, vb[3] / 2, 1.35); };
  document.getElementById('zoom-out').onclick = function () { zoomAt(vb[2] / 2, vb[3] / 2, 1 / 1.35); };
  document.getElementById('zoom-reset').onclick = function () { view = { k: 1, x: 0, y: 0 }; applyView(true); };

  function focusOn(lat, lon, k) {
    var p = geo.px(lat, lon);
    view.k = k || Math.max(view.k, 2.6);
    view.x = vb[2] / 2 - p.x * view.k;
    view.y = vb[3] / 2 - p.y * view.k;
    applyView(true);
  }

  /* ------------------------------------------------------------------
     Layer toggles
     ------------------------------------------------------------------ */
  var layerState = { existing: true, committed: true, study: true, model: true, demand: true };
  function applyLayers() {
    routeEls.forEach(function (p) {
      var k = p.getAttribute('data-klass');
      p.style.display = layerState[k] ? '' : 'none';
    });
    nodes.forEach(function (n) {
      nodeEls[n.slug].style.display = layerState[n.klass] ? '' : 'none';
    });
    gBubbles.style.display = layerState.demand ? '' : 'none';
    queueRelabel();
  }
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { applyView(true); }, 120);
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-layer]'), function (input) {
    input.addEventListener('change', function () {
      layerState[input.getAttribute('data-layer')] = input.checked;
      applyLayers();
    });
  });

  /* ------------------------------------------------------------------
     Panel rendering
     ------------------------------------------------------------------ */
  var panelHead = document.getElementById('panel-head');
  var panelBody = document.getElementById('panel-body');
  var selected = null;

  function setSelected(kind, id) {
    Object.keys(nodeEls).forEach(function (s) { nodeEls[s].classList.remove('selected'); });
    Object.keys(bubbleEls).forEach(function (a) { bubbleEls[a].classList.remove('selected'); });
    if (kind === 'node' && nodeEls[id]) nodeEls[id].classList.add('selected');
    if (kind === 'area' && bubbleEls[id]) bubbleEls[id].classList.add('selected');
    selected = kind ? kind + '/' + id : null;
  }

  function srcChip(id) {
    var s = SRC[id];
    if (!s) return esc(id);
    return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.id) + '</a>';
  }

  function sourcesBlock(ids) {
    ids = uniq(ids).filter(function (i) { return SRC[i]; });
    if (!ids.length) return '';
    return '<h3>Sources (' + ids.length + ')</h3>' + ids.map(function (i) {
      var s = SRC[i];
      return '<div class="src"><span class="grade ' + s.grade + '" title="Grade ' + s.grade + '">' + s.grade + '</span>' +
        '<span><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>' +
        '<div class="meta">' + esc(s.id) + ' &middot; ' + esc(s.publisher) + ' &middot; ' + esc(s.date) + '</div></span></div>';
    }).join('');
  }

  function findingsBlock(ids) {
    ids = uniq(ids).filter(function (i) { return FIND[i]; });
    if (!ids.length) return '';
    return '<h3>Evidence (' + ids.length + ' findings)</h3>' + ids.map(function (i) {
      var f = FIND[i];
      return '<details class="item"><summary><span class="tag">' + esc(f.id) + '</span><span>' + esc(f.text) + '</span></summary>' +
        '<div class="body"><div>Section: ' + esc(f.section) + ' &middot; Confidence: ' + esc(f.confidence) + '</div>' +
        '<div class="srcline">Sources: ' + f.sources.map(srcChip).join(', ') + '</div></div></details>';
    }).join('');
  }

  function predictionsBlock(ids) {
    ids = uniq(ids).filter(function (i) { return PRED[i]; });
    if (!ids.length) return '';
    return '<h3>Forecasts (' + ids.length + ')</h3>' + ids.map(function (i) {
      var p = PRED[i];
      return '<div class="card"><div class="prob"><span class="pct">' + Math.round(p.p * 100) + '%</span>' +
        '<span class="bar"><i style="width:' + (p.p * 100) + '%"></i></span></div>' +
        '<p style="margin:6px 0 4px">' + esc(p.statement) + '</p>' +
        '<p class="dim" style="margin:0">By ' + esc(p.deadline) + '. ' + esc(p.reasoning) + '</p></div>';
    }).join('');
  }

  function dgiBlock(areaId) {
    var a = AREA[areaId];
    if (!a) return '';
    var s = dgiModel.score(a);
    var rows = s.parts.map(function (c) {
      return '<tr><td>' + esc(c.label) + '</td><td class="num">' + c.H.toFixed(1) + '</td><td class="num">' + c.A +
        '</td><td class="num">' + c.T + '</td><td class="num">' + c.C.toFixed(1) + '</td><td class="num">' + c.value.toFixed(1) + '</td></tr>';
    }).join('');
    return '<h3>Demand gap</h3><div class="card">' +
      '<div class="card-top"><span class="big" style="color:' + (a.verdict === 'covered' ? 'var(--ok)' : 'var(--warn)') + '">' + s.total.toFixed(1) + '</span>' +
      '<span class="card-label">Rank ' + a.rank + ' of 14 &middot; ' + (a.verdict === 'covered' ? 'already served' : 'unmet need') + '</span></div>' +
      '<table class="mini"><thead><tr><th>Component</th><th>H</th><th>A</th><th>T</th><th>C</th><th>DGI</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="dim" style="margin:10px 0 0">' + esc(a.inputs) + '</p>' +
      '</div><p>' + esc(a.why) + '</p>' +
      '<button class="ghost-btn" data-go="area/' + a.id + '">Open the full demand-gap breakdown &rarr;</button>';
  }

  function chip(text, cls) { return '<span class="chip ' + (cls || '') + '">' + esc(text) + '</span>'; }

  function renderNode(n) {
    var live = n.projects.filter(function (r) { return !r.anchor; });
    var anchors = n.projects.filter(function (r) { return r.anchor; });
    var f = [], s = [], p = [];
    live.forEach(function (r) {
      f = f.concat(r.station.f || [], r.project.f || []);
      s = s.concat(r.station.s || [], r.project.s || []);
      p = p.concat(r.station.p || [], r.project.p || []);
    });

    panelHead.innerHTML =
      '<div class="titles"><h2>' + esc(n.name) + '</h2><div class="sub">' +
      esc(n.codes.join(' · ')) + (n.alt.length ? ' &middot; also ' + esc(n.alt.join(', ')) : '') +
      '</div></div><button class="close-btn" data-go="home" aria-label="Back to index">&times;</button>';

    var html = '<div class="chips">' +
      chip(KLASS_TEXT[n.klass], n.klass === 'existing' ? 'open' : 'strong') +
      (n.placement ? chip(n.placement === 'sited' ? 'Sited' : n.placement === 'indicative' ? 'Indicative position' : 'Model guess', n.placement) : '') +
      n.lines.map(function (l) { return chip(l.name, 'open'); }).join('') +
      '</div>';

    if (n.placement === 'model') {
      html += '<div class="callout model"><strong>This station does not exist on any official plan.</strong> ' +
        'LTA has named the catchment but published no alignment. The position is this analysis’s illustration of where a station would have to go to serve the named area - a hypothesis to test against future announcements, not a leak.</div>';
    } else if (n.placement === 'indicative') {
      html += '<div class="callout"><strong>Indicative position.</strong> The station is officially named and committed, but its exact site is not public or not yet fixed. Plotted from the announced corridor.</div>';
    }

    if (live.length) {
      html += '<h3>Why it is here</h3>';
      live.forEach(function (r) {
        var why = r.station.why || r.project.summary;
        html += '<div class="card"><div class="card-label">' + esc(r.project.name) + '</div>' +
          '<p style="margin:6px 0 8px">' + esc(why) + '</p>' +
          '<div class="chips" style="margin:0">' + chip(r.project.status) + chip('Opens: ' + r.project.opens) +
          '</div><div style="margin-top:8px"><button class="ghost-btn" data-go="project/' + r.project.id + '">See the whole project &rarr;</button></div></div>';
      });
    } else {
      html += '<h3>Status</h3><p class="dim">An operating station, shown for context. Nothing new is planned here in this analysis.</p>';
    }

    if (anchors.length) {
      html += '<h3>Also referenced by</h3>' + anchors.map(function (r) {
        return '<button class="list-btn" data-go="project/' + r.project.id + '"><div class="row"><span class="name">' +
          esc(r.project.name) + '</span></div><div class="meta">Uses this station as an anchor or interchange</div></button>';
      }).join('');
    }

    if (n.dgi) html += dgiBlock(n.dgi);
    html += predictionsBlock(p);
    html += findingsBlock(f);
    html += sourcesBlock(s);
    if (!live.length && n.lines.length) {
      html += '<h3>Lines here</h3>' + n.lines.map(function (l) {
        return '<div class="src"><span style="width:14px;height:4px;border-radius:2px;background:' + l.color + ';display:inline-block"></span><span>' + esc(l.name) + '</span></div>';
      }).join('');
    }
    html += '<p class="dim" style="margin-top:18px">Coordinates are approximate, plotted for a schematic map rather than surveyed.</p>';
    panelBody.innerHTML = html;
    panelBody.scrollTop = 0;
  }

  function renderProject(proj) {
    panelHead.innerHTML = '<div class="titles"><h2>' + esc(proj.name) + '</h2><div class="sub">' +
      esc(proj.status) + ' &middot; ' + esc(proj.opens) + '</div></div>' +
      '<button class="close-btn" data-go="home" aria-label="Back to index">&times;</button>';

    var html = '<div class="chips">' + chip(KLASS_TEXT[proj.klass], proj.klass === 'existing' ? 'open' : 'strong') +
      chip('Confidence: ' + proj.confidence) + '</div>';
    if (proj.klass === 'model') {
      html += '<div class="callout model"><strong>Not an announced project.</strong> This corridor is the analysis author’s inference from the demand data and the government’s own planning targets.</div>';
    } else if (proj.klass === 'study') {
      html += '<div class="callout"><strong>Under study, no alignment published.</strong> LTA has named the catchments and started engineering studies. The stations below are this analysis’s reading of those catchments, not a station list.</div>';
    }
    html += '<p>' + esc(proj.summary) + '</p>';

    html += '<h3>Stations (' + proj.stations.length + ')</h3>';
    html += proj.stations.map(function (s) {
      var node = nodeByKey[keyFor(s.lat, s.lon)];
      var badge = s.status === 'open' ? 'existing station' : (PLACEMENT_TEXT[s.placement] || '');
      return '<button class="list-btn" data-go="node/' + (node ? node.slug : '') + '"><div class="row"><span class="name">' +
        esc(s.name) + '</span><span class="meta">' + esc(s.code) + '</span></div>' +
        '<div class="meta">' + esc(s.why || badge) + '</div></button>';
    }).join('');

    if (proj.dgi) html += dgiBlock(proj.dgi);
    html += predictionsBlock(proj.p || []);
    html += findingsBlock(proj.f || []);
    html += sourcesBlock(proj.s || []);
    panelBody.innerHTML = html;
    panelBody.scrollTop = 0;
  }

  function renderArea(a) {
    var s = dgiModel.score(a);
    panelHead.innerHTML = '<div class="titles"><h2>' + esc(a.name) + '</h2><div class="sub">Demand Gap Index rank ' + a.rank + ' of 14</div></div>' +
      '<button class="close-btn" data-go="home" aria-label="Back to index">&times;</button>';

    var sens = [
      { label: 'Published model (3.0 residents per home)', opts: {} },
      { label: '2.5 residents per home', opts: { residentsPerHome: 2.5 } },
      { label: '3.5 residents per home', opts: { residentsPerHome: 3.5 } },
      { label: 'All crowding multipliers removed', opts: { crowding: false } }
    ].map(function (t) {
      var r = dgiModel.rank(D.areas, t.opts);
      var pos = r.findIndex(function (x) { return x.id === a.id; }) + 1;
      return '<tr><td>' + esc(t.label) + '</td><td class="num">' + dgiModel.score(a, t.opts).total.toFixed(1) + '</td><td class="num">#' + pos + '</td></tr>';
    }).join('');

    var html = '<div class="chips">' + chip(a.verdict === 'covered' ? 'Already served - negative forecast' : 'Unmet rail need', a.verdict === 'covered' ? 'sited' : 'indicative') + '</div>';
    html += '<div class="card"><div class="card-top"><span class="big" style="color:' + (a.verdict === 'covered' ? 'var(--ok)' : 'var(--warn)') + '">' +
      s.total.toFixed(1) + '</span><span class="card-label">DGI = H &times; A &times; T &times; C</span></div>' +
      '<table class="mini"><thead><tr><th>Component</th><th>H</th><th>A</th><th>T</th><th>C</th><th>DGI</th></tr></thead><tbody>' +
      s.parts.map(function (c) {
        return '<tr><td>' + esc(c.label) + '</td><td class="num">' + c.H.toFixed(1) + '</td><td class="num">' + c.A +
          '</td><td class="num">' + c.T + '</td><td class="num">' + c.C.toFixed(1) + '</td><td class="num">' + c.value.toFixed(1) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    html += '<h3>Why this score</h3><p>' + esc(a.why) + '</p><p class="dim">' + esc(a.inputs) + '</p>';
    html += '<h3>Sensitivity</h3><div class="card"><table class="mini"><thead><tr><th>Assumption</th><th>DGI</th><th>Rank</th></tr></thead><tbody>' +
      sens + '</tbody></table><p class="dim" style="margin:10px 0 0">H for existing residents is population divided by residents per home; announced housing counts do not move with that assumption.</p></div>';
    html += predictionsBlock(a.p || []);
    html += findingsBlock(a.f || []);
    html += sourcesBlock(a.s || []);
    panelBody.innerHTML = html;
    panelBody.scrollTop = 0;
  }

  function renderHome() {
    panelHead.innerHTML = '<div class="titles"><h2>What could be built next</h2>' +
      '<div class="sub">Click anything on the map, or start here</div></div>';

    var studyProjects = D.future.filter(function (p) { return p.klass !== 'committed'; });
    var committed = D.future.filter(function (p) { return p.klass === 'committed'; });

    var html = '<p class="dim">The map shows every committed rail project plus two speculative layers: the ' +
      'Seletar–Tengah Line corridors LTA is studying, and a Paya Lebar Air Base line this analysis infers. ' +
      'Click a station for the reasoning, the numbered findings and the graded sources behind it.</p>';

    html += '<h3>Speculative &middot; the actual question</h3>';
    html += studyProjects.map(function (p) {
      return '<button class="list-btn" data-go="project/' + p.id + '"><div class="row"><span class="name">' + esc(p.name) +
        '</span><span class="meta">' + esc(p.opens.split('(')[0]) + '</span></div><div class="meta">' + esc(p.status) + '</div></button>';
    }).join('');

    html += '<h3>Where the unmet demand is</h3>';
    html += baseRanking.filter(function (r) { return AREA[r.id].verdict !== 'covered'; }).map(function (r) {
      var a = AREA[r.id];
      return '<button class="list-btn" data-go="area/' + a.id + '"><div class="row"><span class="name">' + esc(a.name) +
        '</span><span class="score">' + r.total.toFixed(1) + '</span></div><div class="meta">' + esc(a.note) + '</div></button>';
    }).join('');

    html += '<h3>Predicted to get nothing new</h3>';
    html += baseRanking.filter(function (r) { return AREA[r.id].verdict === 'covered'; }).map(function (r) {
      var a = AREA[r.id];
      return '<button class="list-btn" data-go="area/' + a.id + '"><div class="row"><span class="name">' + esc(a.name) +
        '</span><span class="score covered">' + r.total.toFixed(1) + '</span></div><div class="meta">' + esc(a.note) + '</div></button>';
    }).join('');

    html += '<h3>Committed pipeline</h3>';
    html += committed.map(function (p) {
      return '<button class="list-btn" data-go="project/' + p.id + '"><div class="row"><span class="name">' + esc(p.name) +
        '</span><span class="meta">' + esc(p.opens) + '</span></div><div class="meta">' + esc(p.status) + ' &middot; ' + p.stations.length + ' stations</div></button>';
    }).join('');

    html += '<h3>All forecasts</h3>';
    var groups = uniq(D.predictions.map(function (p) { return p.group; }));
    groups.forEach(function (g) {
      html += '<p class="dim" style="margin:10px 0 6px">' + esc(g) + '</p>';
      html += D.predictions.filter(function (p) { return p.group === g; }).map(function (p) {
        return '<div class="card"><div class="prob"><span class="pct">' + Math.round(p.p * 100) + '%</span>' +
          '<span class="bar"><i style="width:' + (p.p * 100) + '%"></i></span></div>' +
          '<p style="margin:6px 0 4px"><span class="tag" style="font-family:var(--mono);color:var(--accent)">' + esc(p.id) + '</span> ' + esc(p.statement) + '</p>' +
          '<p class="dim" style="margin:0">By ' + esc(p.deadline) + '. ' + esc(p.reasoning) + '</p></div>';
      }).join('');
    });

    html += '<p class="dim" style="margin-top:18px">Probabilities are the analysis author’s subjective estimates, not LTA, MOT, URA or HDB positions. ' +
      'Score them later with the Brier score: the average of (probability &minus; outcome)&sup2;, where 0.25 is what always guessing 50% would get.</p>';

    panelBody.innerHTML = html;
    panelBody.scrollTop = 0;
  }

  /* ------------------------------------------------------------------
     Routing
     ------------------------------------------------------------------ */
  function go(route, opts) {
    var parts = String(route || 'home').split('/');
    var kind = parts[0], id = parts.slice(1).join('/');
    if (kind === 'node' && nodeBySlug[id]) {
      var n = nodeBySlug[id];
      renderNode(n);
      setSelected('node', id);
      if (!opts || opts.pan !== false) focusOn(n.lat, n.lon);
    } else if (kind === 'project' && PROJ[id]) {
      renderProject(PROJ[id]);
      setSelected(null);
    } else if (kind === 'area' && AREA[id]) {
      renderArea(AREA[id]);
      setSelected('area', id);
      if (!opts || opts.pan !== false) focusOn(AREA[id].lat, AREA[id].lon, Math.max(view.k, 2.1));
    } else {
      renderHome();
      setSelected(null);
      route = 'home';
    }
    var hash = '#' + route;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t) { go(t.getAttribute('data-go')); return; }
  });

  function nodeFromEvent(e) {
    /* Resolve from the point, not the event target: pointer capture and
       overlapping labels can both retarget the event. */
    var t = e.target;
    if (!t || !t.closest || t === svg) t = document.elementFromPoint(e.clientX, e.clientY) || t;
    if (!t || !t.closest) return null;
    var g = t.closest('[data-node]');
    if (g) return 'node/' + g.getAttribute('data-node');
    var b = t.closest('[data-area]');
    if (b) return 'area/' + b.getAttribute('data-area');
    var r = t.closest('[data-ref]');
    if (r) return r.getAttribute('data-ref').replace(':', '/');
    return null;
  }
  svg.addEventListener('click', function (e) {
    var route = nodeFromEvent(e);
    if (route) go(route, { pan: false });
  });
  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var route = nodeFromEvent(e);
    if (route) { e.preventDefault(); go(route, { pan: false }); }
  });

  /* Hover tooltip */
  var tip = document.getElementById('tooltip');
  svg.addEventListener('pointermove', function (e) {
    var g = e.target.closest('[data-node],[data-area]');
    if (!g) { tip.classList.remove('show'); return; }
    var label, sub;
    if (g.hasAttribute('data-node')) {
      var n = nodeBySlug[g.getAttribute('data-node')];
      label = n.name;
      sub = KLASS_TEXT[n.klass];
    } else {
      var a = AREA[g.getAttribute('data-area')];
      label = a.name;
      sub = 'Demand gap ' + dgiModel.score(a).total.toFixed(1) + ' · rank ' + a.rank;
    }
    tip.innerHTML = '<div>' + esc(label) + '</div><div class="t-sub">' + esc(sub) + '</div>';
    var wrap = document.querySelector('.map-wrap').getBoundingClientRect();
    tip.style.left = (e.clientX - wrap.left + 14) + 'px';
    tip.style.top = (e.clientY - wrap.top + 14) + 'px';
    tip.classList.add('show');
  });
  svg.addEventListener('pointerleave', function () { tip.classList.remove('show'); });

  /* ------------------------------------------------------------------
     Search
     ------------------------------------------------------------------ */
  var searchInput = document.getElementById('search');
  var resultsBox = document.getElementById('results');
  var searchIndex = [];
  nodes.forEach(function (n) {
    searchIndex.push({ label: n.name, kind: n.isFuture ? KLASS_TEXT[n.klass] : 'Open station', route: 'node/' + n.slug, text: (n.names.join(' ') + ' ' + n.codes.join(' ')).toLowerCase() });
  });
  D.future.forEach(function (p) { searchIndex.push({ label: p.name, kind: 'Project', route: 'project/' + p.id, text: (p.name + ' ' + p.summary).toLowerCase() }); });
  D.areas.forEach(function (a) { searchIndex.push({ label: a.name, kind: 'Demand gap area', route: 'area/' + a.id, text: (a.name + ' ' + a.why).toLowerCase() }); });

  var cursor = -1;
  function runSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) { resultsBox.classList.remove('open'); return; }
    var hits = searchIndex.filter(function (r) { return r.text.indexOf(q) >= 0; }).slice(0, 20);
    cursor = -1;
    if (!hits.length) {
      resultsBox.innerHTML = '<button disabled style="color:var(--fg-faint)">No match</button>';
    } else {
      resultsBox.innerHTML = hits.map(function (h) {
        return '<button data-go="' + h.route + '"><div class="r-kind">' + esc(h.kind) + '</div>' + esc(h.label) + '</button>';
      }).join('');
    }
    resultsBox.classList.add('open');
  }
  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('keydown', function (e) {
    var items = resultsBox.querySelectorAll('button[data-go]');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      Array.prototype.forEach.call(items, function (b, i) { b.classList.toggle('cursor', i === cursor); });
      items[cursor].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (items.length) { (items[cursor >= 0 ? cursor : 0]).click(); resultsBox.classList.remove('open'); searchInput.blur(); }
    } else if (e.key === 'Escape') {
      resultsBox.classList.remove('open'); searchInput.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-wrap')) resultsBox.classList.remove('open');
  });

  /* ------------------------------------------------------------------
     Chrome: theme, about dialog, legend
     ------------------------------------------------------------------ */
  var themeBtn = document.getElementById('theme-btn');
  var stored = null;
  try { stored = localStorage.getItem('mrt-theme'); } catch (_) {}
  if (stored) document.documentElement.setAttribute('data-theme', stored);
  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  themeBtn.onclick = function () {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('mrt-theme', next); } catch (_) {}
  };

  var dlg = document.getElementById('about');
  document.getElementById('about-btn').onclick = function () {
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  };
  document.getElementById('about-close').onclick = function () {
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  };

  var legend = document.querySelector('.legend');
  var legendToggle = document.querySelector('.legend-toggle');
  /* On a phone the legend would cover the map, so it starts collapsed. */
  if (window.innerWidth <= 900) {
    legend.classList.add('collapsed');
    legendToggle.textContent = 'show';
  }
  legendToggle.onclick = function () {
    legend.classList.toggle('collapsed');
    this.textContent = legend.classList.contains('collapsed') ? 'show' : 'hide';
  };

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  applyView(true);
  applyLayers();
  var initial = location.hash.replace(/^#/, '');
  go(initial || 'home', { pan: !!initial });
  window.addEventListener('hashchange', function () {
    var r = location.hash.replace(/^#/, '');
    if (r && r !== selected) go(r);
  });
})();
