/* Citation attribution: given a finding and the whole source register, pick the
   sources that support it. This is the knowledge-gathering step in reverse, and
   it is the task most likely to separate models, because the register has 79
   entries and guessing is heavily penalised by precision. */
'use strict';
var path = require('path');
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');
var findings = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'findings.js'));
var sources = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'sources.js'));

var REGISTER = sources.map(function (s) {
  return '- ' + s.id + ' (grade ' + s.grade + '): ' + s.title + ' - ' + s.publisher + ', ' + s.date;
}).join('\n');
var VALID = {};
sources.forEach(function (s) { VALID[s.id] = true; });

module.exports = {
  id: 'attribute-findings',
  title: 'Citation attribution',
  measures: 'Can the model match a claim to the sources that actually support it?',
  maxTokens: 400,

  items: function () {
    return findings.map(function (f) {
      return {
        id: f.id,
        input: { text: f.text, section: f.section, register: REGISTER },
        gold: { sources: f.sources }
      };
    });
  },

  prompt: function (item) { return prompt.render('attribute-findings', item.input); },

  parse: function (text) {
    var r = J.extractJson(text);
    if (!r.ok) return r;
    var v = r.value;
    var list = Array.isArray(v) ? v : (v && (v.sources || v.source_ids || v.ids));
    if (!Array.isArray(list)) return { ok: false, value: null, repaired: r.repaired, error: 'no sources array' };
    var ids = list.map(function (x) {
      var s = typeof x === 'string' ? x : (x && (x.id || x.source));
      var m = String(s || '').toUpperCase().match(/S\d{1,2}/);
      return m ? 'S' + String(m[0].slice(1)).padStart(2, '0') : null;
    }).filter(function (x) { return x && VALID[x]; });
    return { ok: true, value: { sources: Array.from(new Set(ids)) }, repaired: r.repaired, error: null };
  },

  score: function (parsed, item) {
    if (!parsed.ok) return { correct: false, f1: 0, precision: 0, recall: 0, got: [], want: item.gold.sources };
    var s = M.setScores(parsed.value.sources, item.gold.sources);
    return {
      correct: s.f1 === 1,
      f1: s.f1, precision: s.precision, recall: s.recall,
      got: parsed.value.sources, want: item.gold.sources
    };
  },

  aggregate: function (rows) {
    return {
      f1: M.mean(rows.map(function (r) { return r.score.f1 || 0; })),
      precision: M.mean(rows.map(function (r) { return r.score.precision || 0; })),
      recall: M.mean(rows.map(function (r) { return r.score.recall || 0; })),
      exact_set_rate: M.mean(rows.map(function (r) { return r.score.correct ? 1 : 0; }))
    };
  },
  headline: 'f1'
};
