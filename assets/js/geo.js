/* Projection helpers for the schematic map.
   There is deliberately no coastline: a hand-drawn outline would be guesswork
   presented as geography. The land tint on the map is derived from the rail
   network itself (thick soft strokes under the routes), so the basemap can
   never claim more than the station data supports. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).geo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var BOUNDS = { minLat: 1.2480, maxLat: 1.4760, minLon: 103.6120, maxLon: 104.0260 };
  var LAT0 = 1.35;
  var K = Math.cos(LAT0 * Math.PI / 180);

  /* World units: 1 unit = 1 degree of longitude at the equator, y flipped. */
  function project(lat, lon) {
    return {
      x: (lon - BOUNDS.minLon) * K,
      y: (BOUNDS.maxLat - lat)
    };
  }

  var WIDTH = (BOUNDS.maxLon - BOUNDS.minLon) * K;
  var HEIGHT = (BOUNDS.maxLat - BOUNDS.minLat);

  /* Scale world units into a pixel viewBox. */
  var SCALE = 4200;
  function px(lat, lon) {
    var p = project(lat, lon);
    return { x: p.x * SCALE, y: p.y * SCALE };
  }

  function polyline(points) {
    return points.map(function (p, i) {
      var q = px(p.lat, p.lon);
      return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
    }).join(' ');
  }

  /* Rounded corners between successive segments, so routes read as rail lines
     rather than zig-zags. r is in pixel units. */
  function smoothPath(points, r) {
    if (points.length < 3) return polyline(points);
    var pts = points.map(function (p) { return px(p.lat, p.lon); });
    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], b = pts[i], c = pts[i + 1];
      var ab = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      var bc = Math.hypot(c.x - b.x, c.y - b.y) || 1;
      var t1 = Math.min(r, ab / 2) / ab;
      var t2 = Math.min(r, bc / 2) / bc;
      var p1 = { x: b.x - (b.x - a.x) * t1, y: b.y - (b.y - a.y) * t1 };
      var p2 = { x: b.x + (c.x - b.x) * t2, y: b.y + (c.y - b.y) * t2 };
      d += ' L' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) +
           ' Q' + b.x.toFixed(1) + ' ' + b.y.toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last.x.toFixed(1) + ' ' + last.y.toFixed(1);
  }

  return {
    BOUNDS: BOUNDS, SCALE: SCALE,
    viewBox: [0, 0, WIDTH * SCALE, HEIGHT * SCALE],
    px: px,
    polyline: polyline,
    smoothPath: smoothPath
  };
});
