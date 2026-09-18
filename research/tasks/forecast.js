/* Calibrated judgement: assign a probability to each of the report's 22
   forecasts.

   IMPORTANT: none of these forecasts has resolved yet, so there is no ground
   truth. This task therefore measures AGREEMENT with the reference analysis -
   not accuracy, and not calibration. A model that disagrees may well be right.
   Read it as "how far does this model depart from the reference judgement", and
   watch the hedging rate: a model that answers 0.5 everywhere scores a
   middling MAE while saying nothing.

   Once outcomes are recorded (see UPDATING.md section 5), the same task reports
   a real Brier score automatically. */
'use strict';
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');
var dataset = require('../lib/dataset.js');
var TODAY = process.env.RESEARCH_TODAY || '17 September 2026';

/* Resolved on first use, not at import time. */
var memo = null;
function corpus() {
  if (!memo) {
    var byId = {};
    dataset.findings.forEach(function (f) { byId[f.id] = f; });
    memo = { predictions: dataset.predictions, findingsById: byId };
  }
  return memo;
}

module.exports = {
  id: 'forecast',
  title: 'Calibrated judgement',
  measures: 'How far does the model depart from the reference analysis’s probabilities? (agreement, not accuracy - nothing has resolved yet)',
  maxTokens: 400,

  items: function () {
    var c = corpus();
    return c.predictions.map(function (p) {
      var context = p.f.map(function (id) {
        return c.findingsById[id] ? '- ' + c.findingsById[id].text : null;
      }).filter(Boolean).join('\n');
      return {
        id: p.id,
        input: { statement: p.statement, deadline: p.deadline, context: context, today: TODAY },
        gold: { probability: p.p, outcome: (p.outcome === 0 || p.outcome === 1) ? p.outcome : null }
      };
    });
  },

  prompt: function (item) { return prompt.render('forecast', item.input); },

  parse: function (text) {
    var r = J.extractNumber(text);
    if (!r.ok || !isFinite(r.value)) return { ok: false, value: null, repaired: false, error: r.error || 'not a number' };
    var p = r.value > 1 && r.value <= 100 ? r.value / 100 : r.value;
    if (p < 0 || p > 1) return { ok: false, value: null, repaired: true, error: 'probability out of range' };
    return { ok: true, value: { probability: p }, repaired: !!r.repaired, error: null };
  },

  score: function (parsed, item) {
    if (!parsed.ok) return { correct: null, got: null, want: item.gold.probability, outcome: item.gold.outcome };
    var diff = Math.abs(parsed.value.probability - item.gold.probability);
    return {
      correct: diff <= 0.1,              /* "within 10 points of the reference" */
      got: parsed.value.probability,
      want: item.gold.probability,
      outcome: item.gold.outcome,
      absErr: diff
    };
  },

  aggregate: function (rows) {
    var vals = rows.filter(function (r) { return r.score.got != null; });
    var pairs = vals.map(function (r) { return { got: r.score.got, want: r.score.want, outcome: r.score.outcome }; });
    var b = M.brier(pairs);
    return {
      agreement_mae: vals.length ? M.mae(pairs) : null,
      within_10_points: M.mean(rows.map(function (r) { return r.score.correct ? 1 : 0; })),
      hedge_rate: vals.length ? M.mean(vals.map(function (r) { return Math.abs(r.score.got - 0.5) < 0.02 ? 1 : 0; })) : null,
      rank_correlation: vals.length === rows.length && rows.length > 2
        ? M.spearman(rows.map(function (r) { return r.score.got; }), rows.map(function (r) { return r.score.want; }))
        : null,
      brier_n: b.n,
      brier: b.score
    };
  },
  headline: 'agreement_mae',
  headlineLowerIsBetter: true
};
