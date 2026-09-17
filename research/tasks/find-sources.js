/* Query formulation, scored through a real retriever.

   The model writes one search query for a claim; the configured search backend
   runs it; the score is whether the source the report actually cites comes back
   in the top k. The retriever is held FIXED across models, so this isolates the
   query. Swap the backend (--search fixtures|searxng|duckduckgo) to compare
   retrievers instead, holding the model fixed.

   With the offline `fixtures` backend the corpus is the report's own 79
   sources, so the target is always findable and the run is reproducible. */
'use strict';
var path = require('path');
var prompt = require('../lib/prompt.js');
var J = require('../lib/json.js');
var M = require('../lib/metrics.js');
var findings = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'findings.js'));
var sources = require(path.join(__dirname, '..', '..', 'assets', 'js', 'data', 'sources.js'));

var SRC = {};
sources.forEach(function (s) { SRC[s.id] = s; });
var K = Number(process.env.RESEARCH_TOPK || 5);

module.exports = {
  id: 'find-sources',
  title: 'Query formulation',
  measures: 'Does the model’s search query retrieve the source the report cites? (retriever held fixed)',
  maxTokens: 200,
  needsSearch: true,

  items: function () {
    return findings.filter(function (f) { return SRC[f.sources[0]]; }).map(function (f) {
      var target = SRC[f.sources[0]];
      return {
        id: f.id,
        input: { text: f.text },
        gold: {
          sourceId: target.id,
          url: target.url,
          /* What the oracle fixture would ask, for harness validation only. */
          query: target.title
        }
      };
    });
  },

  prompt: function (item) { return prompt.render('find-sources', item.input); },

  parse: function (text) {
    var r = J.extractJson(text);
    if (r.ok) {
      var q = r.value && (r.value.query || r.value.search || r.value.q);
      if (typeof q === 'string' && q.trim()) return { ok: true, value: { query: q.trim() }, repaired: r.repaired, error: null };
    }
    /* A bare line of text is a usable query; do not fail a model for skipping
       the JSON wrapper on a single-string answer. */
    var line = String(text || '').split('\n').map(function (l) { return l.trim(); })
      .filter(function (l) { return l && !/^[`{\[]/.test(l); })[0];
    if (line) return { ok: true, value: { query: line.replace(/^["']|["']$/g, '') }, repaired: true, error: null };
    return { ok: false, value: null, repaired: false, error: 'no query found' };
  },

  /* Async: this task retrieves. The runner awaits it. */
  score: async function (parsed, item, ctx) {
    if (!parsed.ok) return { correct: false, hit: false, rank: null, query: null };
    var results = [];
    try {
      results = await ctx.search.search(parsed.value.query, { k: K });
    } catch (e) {
      return { correct: false, hit: false, rank: null, query: parsed.value.query, error: String(e.message || e) };
    }
    var rank = null;
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.id === item.gold.sourceId || (r.url && item.gold.url && r.url.split('#')[0] === item.gold.url.split('#')[0])) {
        rank = i + 1;
        break;
      }
    }
    return { correct: rank !== null, hit: rank !== null, rank: rank, query: parsed.value.query, returned: results.length };
  },

  aggregate: function (rows) {
    var hits = rows.map(function (r) { return !!r.score.hit; });
    var ranked = rows.filter(function (r) { return r.score.rank; });
    return {
      ['recall_at_' + K]: M.recallAtK(hits),
      mean_rank_when_found: ranked.length ? M.mean(ranked.map(function (r) { return r.score.rank; })) : null,
      top1_rate: M.mean(rows.map(function (r) { return r.score.rank === 1 ? 1 : 0; }))
    };
  },
  headline: 'recall_at_' + K
};
