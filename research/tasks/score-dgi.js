/* Quantitative reasoning: compute the Demand Gap Index for an area from its
   components. Gold comes from assets/js/dgi.js, which reproduces the report's
   published table exactly, so this is arithmetic with a known answer.

   Scored two ways: how often the value is right, and whether the model's 14
   values RANK the areas the way the model in the repo does. A model can be
   sloppy on absolute values and still order priorities correctly - that
   distinction matters for this kind of research. */
'use strict';
var path = require('path');
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');
var areas = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'areas.js'));
var dgi = require(path.join(__dirname, '..', '..', 'assets', 'js', 'dgi.js'));

var RESIDENTS_PER_HOME = dgi.DEFAULTS.residentsPerHome;

function describeComponents(area) {
  return area.components.map(function (c, i) {
    var H;
    if (c.kind === 'population') {
      H = c.population / (RESIDENTS_PER_HOME * 1000);
      H = 'H = ' + c.population.toLocaleString('en-US') + ' residents divided by ' + RESIDENTS_PER_HOME +
        ' residents per home, then expressed in thousands';
    } else if (c.kind === 'stated') {
      H = 'H = ' + c.H;
    } else {
      H = 'H = ' + c.homes;
    }
    return (i + 1) + '. ' + c.label + ': ' + H + '; A = ' + c.A + '; T = ' + c.T + '; C = ' + c.C;
  }).join('\n');
}

module.exports = {
  id: 'score-dgi',
  title: 'Quantitative reasoning',
  measures: 'Can the model compute the index correctly, and rank the areas correctly?',
  maxTokens: 800,

  items: function () {
    return areas.map(function (a) {
      return {
        id: a.id,
        input: { name: a.name, components: describeComponents(a) },
        gold: { dgi: Math.round(dgi.score(a).total * 10) / 10 }
      };
    });
  },

  prompt: function (item) { return prompt.render('score-dgi', item.input); },

  parse: function (text) {
    var r = J.extractNumber(text);
    if (!r.ok || !isFinite(r.value)) return { ok: false, value: null, repaired: false, error: r.error || 'not a number' };
    return { ok: true, value: { dgi: r.value }, repaired: !!r.repaired, error: null };
  },

  score: function (parsed, item) {
    if (!parsed.ok) return { correct: false, got: null, want: item.gold.dgi, absErr: null };
    var err = Math.abs(parsed.value.dgi - item.gold.dgi);
    /* 0.15 tolerance: the report itself rounds H to one decimal before
       multiplying, so exact-to-the-cent agreement is not the standard. */
    return { correct: err <= 0.15, got: parsed.value.dgi, want: item.gold.dgi, absErr: err };
  },

  aggregate: function (rows) {
    var withVals = rows.filter(function (r) { return r.score.got != null; });
    return {
      exact_rate: M.mean(rows.map(function (r) { return r.score.correct ? 1 : 0; })),
      mean_abs_error: withVals.length ? M.mean(withVals.map(function (r) { return r.score.absErr; })) : null,
      rank_correlation: withVals.length === rows.length && rows.length > 2
        ? M.spearman(rows.map(function (r) { return r.score.got; }), rows.map(function (r) { return r.score.want; }))
        : null
    };
  },
  headline: 'exact_rate'
};
