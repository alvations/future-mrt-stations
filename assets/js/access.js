/* Access geometry: how far is an area from rail?

   The analysis set each area's access gap (the A term of the Demand Gap Index)
   by judgement "from station names and descriptions, not GIS", and listed three
   proximity claims as [UNSOURCED]. This module replaces that judgement with a
   computation the map, the tools and the test suite all share, so the claim is
   at least reproducible and will be re-checked whenever the network data
   changes.

   What it is NOT: a walking-distance calculation. These are straight-line
   distances between approximate station coordinates and an area's plotted
   centre. Treat anything inside a few hundred metres as indistinguishable, and
   read a large site's centre-to-station distance as what it is - the far corner
   of the site, not the walk from the nearest flat. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).access = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var EARTH_M = 6371000;

  /* LTA's planning target is "within a 10-minute walk of a station". A
     10-minute walk is about 800 m of walking; street networks are never
     straight, so 800 m straight-line is a generous reading of it. */
  var WALK_M = 800;

  function toRad(d) { return d * Math.PI / 180; }

  function distance(lat1, lon1, lat2, lon2) {
    var dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  /* Flatten the network into scoreable points. `kinds` selects which tiers
     count: 'open' is today's network, 'committed' is announced and funded.
     Study and model tiers are deliberately excluded - an access gap measured
     against a speculative line would assume its own conclusion. */
  function stations(network, future, kinds) {
    var want = kinds || ['open', 'committed'];
    var out = [];
    /* Several projects legitimately reference the same station - Sungei Bedok
       belongs to TEL5 and to the Changi extension, Pasir Ris to CRL1 and the
       Punggol extension. Returning it once keeps counts meaningful; it never
       affected the nearest-station distance either way. */
    var seen = {};
    function add(s) {
      var key = s.kind + '|' + s.name + '|' + s.lat.toFixed(4) + ',' + s.lon.toFixed(4);
      if (seen[key]) return;
      seen[key] = true;
      out.push(s);
    }
    if (want.indexOf('open') >= 0) {
      (network || []).forEach(function (line) {
        line.stations.forEach(function (s) {
          add({ name: s.name, lat: s.lat, lon: s.lon, line: line.id, kind: 'open' });
        });
      });
    }
    if (want.indexOf('committed') >= 0) {
      (future || []).filter(function (p) { return p.klass === 'committed'; }).forEach(function (p) {
        p.stations.forEach(function (s) {
          /* status 'open' entries are existing stations used as route anchors;
             they are already counted in the open tier. */
          if (s.status !== 'open') add({ name: s.name, lat: s.lat, lon: s.lon, line: p.id, kind: 'committed' });
        });
      });
    }
    return out;
  }

  function nearest(lat, lon, pool) {
    var best = null;
    (pool || []).forEach(function (s) {
      var d = distance(lat, lon, s.lat, s.lon);
      if (!best || d < best.metres) best = { metres: d, name: s.name, line: s.line, kind: s.kind };
    });
    return best;
  }

  /* The access bands the analysis uses, and what each one asserts about
     geometry. Only the ends are checkable: the middle bands describe partial
     coverage of an area, which a single centre point cannot settle. */
  var BANDS = [
    { A: 0.2, claim: 'a station is inside or adjacent to the area', maxMetres: WALK_M },
    { A: 0.3, claim: 'a station serves the area, possibly from its edge', maxMetres: null },
    { A: 0.4, claim: 'partial coverage', maxMetres: null },
    { A: 0.5, claim: 'no station inside the area; edge or feeder only', minMetres: WALK_M },
    { A: 0.8, claim: 'a large site with only an edge station', minMetres: WALK_M },
    { A: 0.85, claim: 'a large site with only an edge station', minMetres: WALK_M },
    { A: 1.0, claim: 'nothing nearby', minMetres: WALK_M }
  ];

  /* Margin on every comparison, because the inputs are approximate. A
     contradiction has to be unambiguous to count as one. */
  var MARGIN_M = 500;

  function bandFor(A) {
    for (var i = 0; i < BANDS.length; i++) if (Math.abs(BANDS[i].A - A) < 1e-9) return BANDS[i];
    return null;
  }

  /* Check one component's declared A against the geometry. Returns
     { verdict: 'consistent' | 'contradicts' | 'unchecked', ... } */
  function checkComponent(A, metres) {
    var band = bandFor(A);
    if (!band || metres == null) return { verdict: 'unchecked', A: A, metres: metres, reason: 'no checkable claim for A = ' + A };
    if (band.maxMetres != null && metres > band.maxMetres + MARGIN_M) {
      return {
        verdict: 'contradicts', A: A, metres: metres, claim: band.claim,
        reason: 'A = ' + A + ' claims ' + band.claim + ', but the nearest station is ' +
          Math.round(metres) + ' m away (over ' + (band.maxMetres + MARGIN_M) + ' m)'
      };
    }
    if (band.minMetres != null && metres < band.minMetres - MARGIN_M) {
      return {
        verdict: 'contradicts', A: A, metres: metres, claim: band.claim,
        reason: 'A = ' + A + ' claims ' + band.claim + ', but a station is only ' +
          Math.round(metres) + ' m away (under ' + (band.minMetres - MARGIN_M) + ' m)'
      };
    }
    return { verdict: 'consistent', A: A, metres: metres, claim: band.claim };
  }

  /* Full report for every area. */
  function audit(areas, network, future) {
    var openPool = stations(network, future, ['open']);
    var allPool = stations(network, future, ['open', 'committed']);
    return (areas || []).map(function (a) {
      var open = nearest(a.lat, a.lon, openPool);
      var any = nearest(a.lat, a.lon, allPool);
      var checks = a.components.map(function (c) { return checkComponent(c.A, any ? any.metres : null); });
      return {
        id: a.id,
        name: a.name,
        nearestOpen: open,
        nearestAny: any,
        withinWalk: !!(any && any.metres <= WALK_M),
        components: checks,
        contradictions: checks.filter(function (c) { return c.verdict === 'contradicts'; })
      };
    });
  }

  function format(metres) {
    if (metres == null) return 'unknown';
    return metres < 950 ? Math.round(metres / 10) * 10 + ' m' : (metres / 1000).toFixed(1) + ' km';
  }

  return {
    WALK_M: WALK_M, MARGIN_M: MARGIN_M, BANDS: BANDS,
    distance: distance, stations: stations, nearest: nearest,
    checkComponent: checkComponent, audit: audit, format: format
  };
});
