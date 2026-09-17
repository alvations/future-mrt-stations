/* Source appraisal: apply the report's grading rubric to each of its 79
   sources. The rubric is given in the prompt, so this measures rubric
   application rather than memory of the report. */
'use strict';
var path = require('path');
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');
var sources = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'sources.js'));

module.exports = {
  id: 'grade-sources',
  title: 'Source appraisal',
  measures: 'Can the model apply a provenance rubric the way the report did?',
  maxTokens: 200,

  items: function () {
    return sources.map(function (s) {
      return {
        id: s.id,
        input: { title: s.title, publisher: s.publisher, date: s.date, url: s.url },
        gold: { grade: s.grade }
      };
    });
  },

  prompt: function (item) { return prompt.render('grade-sources', item.input); },

  parse: function (text) {
    var r = J.extractJson(text);
    if (!r.ok) return r;
    var g = r.value && (r.value.grade || r.value.Grade);
    g = typeof g === 'string' ? g.trim().toUpperCase().slice(0, 1) : null;
    if (['A', 'B', 'C', 'D'].indexOf(g) < 0) return { ok: false, value: null, repaired: r.repaired, error: 'grade not one of A-D' };
    return { ok: true, value: { grade: g }, repaired: r.repaired, error: null };
  },

  score: function (parsed, item) {
    if (!parsed.ok) return { correct: false, got: null, want: item.gold.grade };
    return { correct: parsed.value.grade === item.gold.grade, got: parsed.value.grade, want: item.gold.grade };
  },

  aggregate: function (rows) {
    var pairs = rows.filter(function (r) { return r.score.got; }).map(function (r) { return { got: r.score.got, want: r.score.want }; });
    return {
      accuracy: M.accuracy(rows.map(function (r) { return { got: r.score.got, want: r.score.want }; })),
      macro_f1: M.macroF1(pairs),
      confusion: M.confusion(pairs)
    };
  },
  headline: 'accuracy'
};
