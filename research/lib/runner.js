/* runComparison(): the harness as a function.

   run.js is a thin CLI over this. Keeping the logic here means a caller can
   embed the comparison in their own script, CI job or notebook without
   shelling out and parsing stdout. */
'use strict';
var fs = require('fs');
var path = require('path');
var providers = require('../providers/index.js');
var tasksReg = require('../tasks/index.js');
var searchReg = require('../search/index.js');
var store = require('./store.js');
var dataset = require('./dataset.js');

var DEFAULTS = {
  models: [],
  tasks: null,          /* null = every task */
  search: 'fixtures',
  limit: null,
  repeats: 1,
  temperature: 0,
  seed: 7,
  concurrency: 4,
  cache: true,
  runId: null,
  registry: null,       /* path to an alternative models.json */
  onProgress: null      /* function({model, task, headline, schemaOk}) */
};

async function pool(items, concurrency, worker) {
  var i = 0, results = new Array(items.length);
  var workers = new Array(Math.max(1, Math.min(concurrency, items.length))).fill(0).map(async function () {
    while (true) {
      var idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function runComparison(options) {
  var opts = Object.assign({}, DEFAULTS, options || {});
  if (!opts.models || !opts.models.length) throw new Error('runComparison needs at least one model id (see models.json)');

  var reg = providers.registry(opts.registry);
  var specs = opts.models.map(function (id) {
    if (!reg.byId[id]) throw new Error('unknown model "' + id + '". Known: ' + Object.keys(reg.byId).join(', '));
    return reg.byId[id];
  });
  var tasks = tasksReg.resolve(opts.tasks);
  var search = searchReg.resolve(opts.search);
  var runIdValue = opts.runId || store.runId();
  var dir = store.runDir(runIdValue);

  var meta = {
    run: runIdValue,
    started: new Date().toISOString(),
    models: specs.map(function (s) {
      return { id: s.id, provider: s.provider, model: s.model, baseUrl: s.baseUrl || null, licence: s.licence || null };
    }),
    tasks: tasks.map(function (t) {
      return { id: t.id, title: t.title, measures: t.measures, items: opts.limit ? Math.min(opts.limit, t.items().length) : t.items().length };
    }),
    search: search.id,
    dataset: dataset.describe(),
    settings: {
      temperature: opts.temperature, seed: opts.seed, repeats: opts.repeats,
      limit: opts.limit, concurrency: opts.concurrency, cache: opts.cache
    },
    harness: require('../package.json').version,
    node: process.version
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));

  var summary = { run: runIdValue, results: [] };

  for (var si = 0; si < specs.length; si++) {
    var spec = specs[si];
    for (var ti = 0; ti < tasks.length; ti++) {
      var task = tasks[ti];
      var items = task.items();
      if (opts.limit) items = items.slice(0, opts.limit);
      var jobs = [];
      items.forEach(function (item) {
        for (var r = 0; r < opts.repeats; r++) jobs.push({ item: item, repeat: r });
      });

      var file = path.join(dir, spec.id + '__' + task.id + '.jsonl');
      if (fs.existsSync(file)) fs.unlinkSync(file);
      var t0 = Date.now();

      var rows = await pool(jobs, opts.concurrency, async function (job) {
        var prompt = task.prompt(job.item);
        var maxTokens = spec.maxTokens || task.maxTokens || 512;
        var callArgs = {
          prompt: prompt,
          maxTokens: maxTokens,
          temperature: opts.temperature,
          seed: opts.repeats > 1 ? opts.seed + job.repeat : opts.seed,
          meta: { task: task.id, item: job.item }   /* real adapters ignore meta */
        };
        var key = store.cacheKey([spec.provider, spec.model, spec.baseUrl || '', prompt, maxTokens, opts.temperature, callArgs.seed, spec.effort || '']);
        var res = opts.cache ? store.cacheGet(key) : null;
        var cached = !!res;
        if (!res) {
          try {
            res = await providers.call(spec, callArgs);
            if (opts.cache) {
              store.cacheSet(key, {
                text: res.text, usage: res.usage, ms: res.ms,
                stopReason: res.stopReason, refused: res.refused, determinism: res.determinism
              });
            }
          } catch (e) {
            res = { text: '', error: String(e.message || e), usage: {}, ms: null };
          }
        }

        var parsed = res.error ? { ok: false, value: null, repaired: false, error: res.error } : task.parse(res.text);
        var score = await task.score(parsed, job.item, { search: search, spec: spec });

        var row = {
          item: job.item.id, repeat: job.repeat, model: spec.id, task: task.id,
          ok: parsed.ok, repaired: !!parsed.repaired, parseError: parsed.error || null,
          callError: res.error || null, refused: !!res.refused, cached: cached,
          ms: res.ms, usage: res.usage || {}, determinism: res.determinism || null,
          score: score, gold: job.item.gold, raw: res.text
        };
        store.appendJsonl(file, row);
        return row;
      });

      var agg = task.aggregate(rows);
      var okRows = rows.filter(function (r) { return r.ok; });
      var entry = {
        model: spec.id, task: task.id, items: rows.length,
        schema_ok: okRows.length / (rows.length || 1),
        repair_rate: rows.filter(function (r) { return r.repaired; }).length / (rows.length || 1),
        call_errors: rows.filter(function (r) { return r.callError; }).length,
        refusals: rows.filter(function (r) { return r.refused; }).length,
        wall_ms: Date.now() - t0,
        mean_ms: okRows.length ? Math.round(okRows.reduce(function (a, r) { return a + (r.ms || 0); }, 0) / okRows.length) : null,
        tokens_in: rows.reduce(function (a, r) { return a + (r.usage.input || 0); }, 0),
        tokens_out: rows.reduce(function (a, r) { return a + (r.usage.output || 0); }, 0),
        headline: { metric: task.headline, value: agg[task.headline] == null ? null : agg[task.headline], lowerIsBetter: !!task.headlineLowerIsBetter },
        metrics: agg
      };
      summary.results.push(entry);
      if (typeof opts.onProgress === 'function') opts.onProgress(entry);
    }
  }

  summary.finished = new Date().toISOString();
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));

  return { runId: runIdValue, dir: dir, meta: meta, summary: summary };
}

module.exports = { runComparison, DEFAULTS, pool };
