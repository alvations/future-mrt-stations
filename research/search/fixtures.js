/* Offline search backend.

   The corpus is the 79 sources the analysis actually cites, so retrieval can be
   scored reproducibly with no network and no API key: the gold document for a
   finding is a source that is definitely in the index. Scoring is recall@k of
   the gold source, which measures the model's QUERY, since the retriever is
   held fixed.

   Ranking is BM25-lite (tf-idf over title, publisher and id). It is not meant
   to be a good search engine - it is meant to be the SAME search engine for
   every model. */
'use strict';
var dataset = require('../lib/dataset.js');

function tokenise(s) {
  return String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length > 2; });
}

/* The index is built on first search, not at import time, so requiring the
   package does not demand a corpus. */
var memo = null;
function index() {
  if (memo) return memo;
  var docs = dataset.sources.map(function (s) {
    return {
      id: s.id,
      url: s.url,
      title: s.title,
      publisher: s.publisher,
      date: s.date,
      grade: s.grade,
      tokens: tokenise(s.title + ' ' + s.publisher + ' ' + s.date)
    };
  });
  var df = {};
  docs.forEach(function (d) {
    Array.from(new Set(d.tokens)).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
  });
  memo = { docs: docs, df: df, n: docs.length };
  return memo;
}

async function search(query, opts) {
  var idx = index();
  var DOCS = idx.docs, DF = idx.df, N = idx.n;
  var k = (opts && opts.k) || 5;
  var q = tokenise(query);
  var scored = DOCS.map(function (d) {
    var score = 0;
    q.forEach(function (t) {
      var tf = d.tokens.filter(function (x) { return x === t; }).length;
      if (!tf) return;
      var idf = Math.log(1 + (N - (DF[t] || 0) + 0.5) / ((DF[t] || 0) + 0.5));
      score += idf * (tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * d.tokens.length / 12));
    });
    return { doc: d, score: score };
  }).filter(function (r) { return r.score > 0; })
    .sort(function (a, b) { return b.score - a.score || a.doc.id.localeCompare(b.doc.id); })
    .slice(0, k);

  return scored.map(function (r) {
    return { title: r.doc.title, url: r.doc.url, snippet: r.doc.publisher + ' · ' + r.doc.date, id: r.doc.id, score: r.score };
  });
}

module.exports = {
  search: search,
  id: 'fixtures',
  /* A getter, so reading `size` is what triggers corpus resolution. */
  get size() { return index().n; }
};
