/* Scoring primitives. Kept separate from the tasks so a task declares what it
   measures and this file decides how, identically for every model. */
'use strict';

function mean(xs) { return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : 0; }

function accuracy(pairs) {
  return mean(pairs.map(function (p) { return p.got === p.want ? 1 : 0; }));
}

/* Macro-averaged F1 over the label set, so a model that always answers the
   majority class cannot look good. */
function macroF1(pairs) {
  var labels = {};
  pairs.forEach(function (p) { labels[p.want] = true; labels[p.got] = true; });
  var f1s = Object.keys(labels).map(function (l) {
    var tp = 0, fp = 0, fn = 0;
    pairs.forEach(function (p) {
      if (p.got === l && p.want === l) tp++;
      else if (p.got === l) fp++;
      else if (p.want === l) fn++;
    });
    var prec = tp + fp ? tp / (tp + fp) : 0;
    var rec = tp + fn ? tp / (tp + fn) : 0;
    return prec + rec ? 2 * prec * rec / (prec + rec) : 0;
  });
  return mean(f1s);
}

function confusion(pairs) {
  var m = {};
  pairs.forEach(function (p) {
    m[p.want] = m[p.want] || {};
    m[p.want][p.got] = (m[p.want][p.got] || 0) + 1;
  });
  return m;
}

/* Set overlap, for tasks whose answer is a set of ids. */
function setScores(got, want) {
  var g = Array.from(new Set(got || []));
  var w = Array.from(new Set(want || []));
  var hit = g.filter(function (x) { return w.indexOf(x) >= 0; }).length;
  var precision = g.length ? hit / g.length : (w.length ? 0 : 1);
  var recall = w.length ? hit / w.length : 1;
  var f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
  return { precision: precision, recall: recall, f1: f1 };
}

function mae(pairs) { return mean(pairs.map(function (p) { return Math.abs(p.got - p.want); })); }

/* Brier score: mean squared error of probabilistic forecasts against 0/1
   outcomes. Only defined once outcomes exist. */
function brier(pairs) {
  var scored = pairs.filter(function (p) { return p.outcome === 0 || p.outcome === 1; });
  return scored.length ? { n: scored.length, score: mean(scored.map(function (p) { return Math.pow(p.got - p.outcome, 2); })) } : { n: 0, score: null };
}

function rank(values) {
  var idx = values.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; });
  var out = new Array(values.length);
  idx.forEach(function (pair, r) { out[pair[1]] = r + 1; });
  return out;
}

/* Spearman rank correlation: does the model order the areas the way the
   reference model does, even where absolute values differ? */
function spearman(gotVals, wantVals) {
  if (gotVals.length < 2) return null;
  var a = rank(gotVals), b = rank(wantVals), n = a.length;
  var d2 = 0;
  for (var i = 0; i < n; i++) d2 += Math.pow(a[i] - b[i], 2);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function recallAtK(hits) { return mean(hits.map(function (h) { return h ? 1 : 0; })); }

module.exports = { mean, accuracy, macroF1, confusion, setScores, mae, brier, spearman, recallAtK, rank };
