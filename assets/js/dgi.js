/* Demand Gap Index: DGI = sum over components of H x A x T x C.
   Reproduces Section 5 of the analysis and supports its sensitivity tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).dgi = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var DEFAULTS = { residentsPerHome: 3.0, crowding: true };

  function componentH(c, opts) {
    if (c.kind === 'population') return c.population / (opts.residentsPerHome * 1000);
    if (c.kind === 'stated') return c.H;
    return c.homes;
  }

  function score(area, options) {
    var opts = Object.assign({}, DEFAULTS, options || {});
    var parts = area.components.map(function (c) {
      var H = componentH(c, opts);
      var C = opts.crowding ? c.C : 1.0;
      return { label: c.label, H: H, A: c.A, T: c.T, C: C, value: H * c.A * c.T * C };
    });
    return {
      id: area.id,
      total: parts.reduce(function (a, p) { return a + p.value; }, 0),
      parts: parts
    };
  }

  function rank(areas, options) {
    return areas.map(function (a) { return score(a, options); })
      .sort(function (x, y) { return y.total - x.total; });
  }

  return { DEFAULTS: DEFAULTS, score: score, rank: rank };
});
