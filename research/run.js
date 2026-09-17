#!/usr/bin/env node
/* Run the research process across models.

   Usage:
     node research/run.js --models mock-oracle,mock-weak
     node research/run.js --models llama31-8b,qwen25-32b,claude-opus-5 --tasks all
     node research/run.js --models qwen25-32b --tasks find-sources --search searxng
     node research/run.js --models llama31-8b --limit 5            # cheap smoke run

   Options:
     --models   comma-separated ids from research/models.json (required)
     --tasks    comma-separated task ids, or "all" (default: all)
     --search   fixtures | searxng | duckduckgo (default: fixtures)
     --limit    only the first N items per task
     --repeats  run each item N times, to see run-to-run variance
     --temp     temperature for models that accept one (default 0)
     --seed     seed for backends that accept one (default 7)
     --concurrency  parallel in-flight requests per task (default 4)
     --no-cache     ignore the response cache
     --out      run id (default: timestamp)

   Every model sees identical prompts, identical parsing and identical scoring.
   Raw responses are written verbatim so any number here can be audited. */
'use strict';
var fs = require('fs');
var path = require('path');
var providers = require('./providers/index.js');
var tasksReg = require('./tasks/index.js');
var searchReg = require('./search/index.js');
var store = require('./lib/store.js');

function parseArgs(argv) {
  var out = { flags: {} };
  for (var i = 2; i < argv.length; i++) {
    var a = argv[i];
    if (a.slice(0, 2) !== '--') continue;
    var key = a.slice(2);
    if (key.indexOf('no-') === 0) { out.flags[key.slice(3)] = false; continue; }
    var next = argv[i + 1];
    if (next && next.slice(0, 2) !== '--') { out.flags[key] = next; i++; } else { out.flags[key] = true; }
  }
  return out.flags;
}

function list(v) { return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }

async function pool(items, concurrency, worker) {
  var i = 0, results = new Array(items.length);
  var workers = new Array(Math.min(concurrency, items.length || 1)).fill(0).map(async function () {
    while (true) {
      var idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  var flags = parseArgs(process.argv);
  var modelIds = list(flags.models);
  if (!modelIds.length) {
    console.error('need --models (see research/models.json). Example:\n  node research/run.js --models mock-oracle,mock-weak');
    process.exit(2);
  }

  var reg = providers.registry();
  var specs = modelIds.map(function (id) {
    if (!reg.byId[id]) throw new Error('unknown model "' + id + '". Known: ' + Object.keys(reg.byId).join(', '));
    return reg.byId[id];
  });

  var taskIds = (!flags.tasks || flags.tasks === 'all') ? tasksReg.DEFAULT_ORDER : list(flags.tasks);
  var tasks = tasksReg.resolve(taskIds);
  var search = searchReg.resolve(flags.search || 'fixtures');
  var limit = flags.limit ? Number(flags.limit) : null;
  var repeats = flags.repeats ? Number(flags.repeats) : 1;
  var temperature = flags.temp != null && flags.temp !== true ? Number(flags.temp) : 0;
  var seed = flags.seed != null && flags.seed !== true ? Number(flags.seed) : 7;
  var concurrency = Number(flags.concurrency || 4);
  var useCache = flags.cache !== false;

  var runIdValue = (flags.out && flags.out !== true) ? String(flags.out) : store.runId();
  var dir = store.runDir(runIdValue);

  var meta = {
    run: runIdValue,
    started: new Date().toISOString(),
    models: specs.map(function (s) {
      return { id: s.id, provider: s.provider, model: s.model, baseUrl: s.baseUrl || null, licence: s.licence || null };
    }),
    tasks: tasks.map(function (t) { return { id: t.id, title: t.title, measures: t.measures, items: (limit ? Math.min(limit, t.items().length) : t.items().length) }; }),
    search: search.id,
    settings: { temperature: temperature, seed: seed, repeats: repeats, limit: limit, concurrency: concurrency, cache: useCache },
    node: process.version
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('run ' + runIdValue + '  models=' + modelIds.join(',') + '  tasks=' + taskIds.join(',') + '  search=' + search.id);

  var summary = { run: runIdValue, results: [] };

  for (var si = 0; si < specs.length; si++) {
    var spec = specs[si];
    for (var ti = 0; ti < tasks.length; ti++) {
      var task = tasks[ti];
      var items = task.items();
      if (limit) items = items.slice(0, limit);
      var jobs = [];
      items.forEach(function (item) {
        for (var r = 0; r < repeats; r++) jobs.push({ item: item, repeat: r });
      });

      var file = path.join(dir, spec.id + '__' + task.id + '.jsonl');
      if (fs.existsSync(file)) fs.unlinkSync(file);
      var t0 = Date.now();

      var rows = await pool(jobs, concurrency, async function (job) {
        var prompt = task.prompt(job.item);
        var maxTokens = spec.maxTokens || task.maxTokens || 512;
        var callArgs = {
          prompt: prompt,
          maxTokens: maxTokens,
          temperature: temperature,
          seed: repeats > 1 ? seed + job.repeat : seed,
          meta: { task: task.id, item: job.item }   /* real adapters ignore meta */
        };
        var key = store.cacheKey([spec.provider, spec.model, spec.baseUrl || '', prompt, maxTokens, temperature, callArgs.seed, spec.effort || '']);
        var res = useCache ? store.cacheGet(key) : null;
        var cached = !!res;
        if (!res) {
          try {
            res = await providers.call(spec, callArgs);
            if (useCache) store.cacheSet(key, { text: res.text, usage: res.usage, ms: res.ms, stopReason: res.stopReason, refused: res.refused, determinism: res.determinism });
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

      var h = entry.headline.value;
      console.log('  ' + spec.id.padEnd(16) + task.id.padEnd(20) +
        (h == null ? 'n/a' : (typeof h === 'number' ? h.toFixed(3) : String(h))).padStart(7) + ' ' + task.headline +
        '   schema_ok ' + (entry.schema_ok * 100).toFixed(0) + '%' +
        (entry.call_errors ? '   errors ' + entry.call_errors : ''));
    }
  }

  summary.finished = new Date().toISOString();
  fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));

  var report = require('./score.js').report(runIdValue);
  console.log('\nwrote ' + path.relative(process.cwd(), report));
}

if (require.main === module) {
  main().catch(function (e) { console.error('\n' + (e && e.stack || e)); process.exit(1); });
}
module.exports = { main, parseArgs, pool };
