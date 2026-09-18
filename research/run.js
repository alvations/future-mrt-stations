#!/usr/bin/env node
/* CLI for the research harness. The logic lives in lib/runner.js; this file
   parses arguments and prints progress.

     node research/run.js --models mock-oracle,mock-weak
     npx mrt-research --models llama31-8b,qwen25-32b,claude-opus-5
     node research/run.js --models qwen25-32b --tasks find-sources --search searxng
     node research/run.js --models qwen25-32b --limit 3          # cheap smoke run

   Options:
     --models   comma-separated ids from models.json (required)
     --tasks    comma-separated task ids, or "all" (default: all)
     --search   fixtures | searxng | duckduckgo (default: fixtures)
     --limit    only the first N items per task
     --repeats  run each item N times, to measure run-to-run variance
     --temp     temperature for models that accept one (default 0)
     --seed     seed for backends that accept one (default 7)
     --concurrency  parallel in-flight requests (default 4)
     --registry     path to an alternative models.json
     --no-cache     ignore the response cache
     --out      run id (default: timestamp)
     --json     print the summary as JSON instead of a table (report.md is
                still written; its path is in the JSON)

   Every model sees identical prompts, parsing and scoring; raw responses are
   written verbatim so any number here can be audited. */
'use strict';
var path = require('path');
var runner = require('./lib/runner.js');
var scorer = require('./score.js');
var store = require('./lib/store.js');

function parseArgs(argv) {
  var flags = {};
  for (var i = 2; i < argv.length; i++) {
    var a = argv[i];
    if (a.slice(0, 2) !== '--') continue;
    var key = a.slice(2);
    if (key.indexOf('no-') === 0) { flags[key.slice(3)] = false; continue; }
    var next = argv[i + 1];
    if (next && next.slice(0, 2) !== '--') { flags[key] = next; i++; } else { flags[key] = true; }
  }
  return flags;
}

function list(v) {
  return String(v === true ? '' : (v || '')).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
}
function num(v, dflt) { return (v != null && v !== true) ? Number(v) : dflt; }

async function main() {
  var flags = parseArgs(process.argv);
  if (flags.help || flags.h) {
    console.log(require('fs').readFileSync(__filename, 'utf8')
      .split('*/')[0].split('/*')[1]
      .split('\n').map(function (l) { return l.replace(/^ {3}/, ''); }).join('\n').trim());
    return;
  }
  var models = list(flags.models);
  if (!models.length) {
    console.error('need --models (see research/models.json). Example:\n  node research/run.js --models mock-oracle,mock-weak\n\nRun with --help for all options.');
    process.exit(2);
  }

  var quiet = !!flags.json;
  var opts = {
    models: models,
    tasks: (!flags.tasks || flags.tasks === 'all') ? null : list(flags.tasks),
    search: (flags.search && flags.search !== true) ? flags.search : 'fixtures',
    limit: flags.limit ? Number(flags.limit) : null,
    repeats: num(flags.repeats, 1),
    temperature: num(flags.temp, 0),
    seed: num(flags.seed, 7),
    concurrency: num(flags.concurrency, 4),
    cache: flags.cache !== false,
    /* Resolved here rather than inside the runner so the banner can print the
       real id: an interrupted run still leaves something to pass to score.js. */
    runId: (flags.out && flags.out !== true) ? String(flags.out) : store.runId(),
    registry: (flags.registry && flags.registry !== true) ? String(flags.registry) : null,
    onProgress: quiet ? null : function (entry) {
      var h = entry.headline.value;
      console.log('  ' + entry.model.padEnd(16) + entry.task.padEnd(20) +
        (h == null ? 'n/a' : (typeof h === 'number' ? h.toFixed(3) : String(h))).padStart(7) + ' ' + entry.headline.metric +
        '   schema_ok ' + (entry.schema_ok * 100).toFixed(0) + '%' +
        (entry.call_errors ? '   errors ' + entry.call_errors : ''));
    }
  };

  if (!quiet) {
    console.log('run ' + opts.runId + '  models=' + models.join(',') +
      '  tasks=' + (opts.tasks ? opts.tasks.join(',') : 'all') + '  search=' + opts.search);
  }

  var out = await runner.runComparison(opts);
  var report = scorer.report(out.runId);

  if (quiet) {
    /* The report is still written; its path travels in the JSON so a caller
       does not have to guess where the run landed. */
    console.log(JSON.stringify(Object.assign({ report: report }, out.summary), null, 2));
    return;
  }
  console.log('\nwrote ' + path.relative(process.cwd(), report));
}

if (require.main === module) {
  main().catch(function (e) { console.error('\n' + (e && e.stack || e)); process.exit(1); });
}
module.exports = { main, parseArgs };
