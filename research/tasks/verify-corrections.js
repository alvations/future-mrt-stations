/* Self-correction: shown a claim from the earlier draft and the evidence found
   later, does the model reach the conclusion verification actually reached?

   This is the step that mattered most in the real process - it killed four
   predictions - and the one where a model that wants to please will say
   "reframed" to avoid admitting a claim is dead. Ten items, three classes. */
'use strict';
var path = require('path');
var fs = require('fs');
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');

var FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'corrections.json'), 'utf8'));
var VERDICTS = Object.keys(FIX.vocabulary);

module.exports = {
  id: 'verify-corrections',
  title: 'Self-correction',
  measures: 'Shown contradicting evidence, does the model withdraw a claim or soften it?',
  maxTokens: 300,

  items: function () {
    return FIX.rows.map(function (r) {
      return { id: r.id, input: { claim: r.claim, evidence: r.evidence }, gold: { verdict: r.verdict } };
    });
  },

  prompt: function (item) { return prompt.render('verify-corrections', item.input); },

  parse: function (text) {
    var r = J.extractJson(text);
    if (!r.ok) return r;
    var v = r.value && (r.value.verdict || r.value.result || r.value.decision);
    v = typeof v === 'string' ? v.trim().toLowerCase() : null;
    if (VERDICTS.indexOf(v) < 0) return { ok: false, value: null, repaired: r.repaired, error: 'verdict not one of ' + VERDICTS.join('/') };
    return { ok: true, value: { verdict: v }, repaired: r.repaired, error: null };
  },

  score: function (parsed, item) {
    if (!parsed.ok) return { correct: false, got: null, want: item.gold.verdict };
    return { correct: parsed.value.verdict === item.gold.verdict, got: parsed.value.verdict, want: item.gold.verdict };
  },

  aggregate: function (rows) {
    var pairs = rows.filter(function (r) { return r.score.got; }).map(function (r) { return { got: r.score.got, want: r.score.want }; });
    /* Reported separately because it is the specific failure mode worth
       watching: a claim that should die being softened instead. */
    var shouldDie = rows.filter(function (r) { return r.score.want === 'withdrawn'; });
    return {
      accuracy: M.accuracy(rows.map(function (r) { return { got: r.score.got, want: r.score.want }; })),
      macro_f1: M.macroF1(pairs),
      withdrawal_recall: shouldDie.length ? M.mean(shouldDie.map(function (r) { return r.score.got === 'withdrawn' ? 1 : 0; })) : null,
      confusion: M.confusion(pairs)
    };
  },
  headline: 'accuracy'
};
