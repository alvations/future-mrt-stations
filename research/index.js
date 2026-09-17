/* Public API of the research harness.

   The CLI (`run.js`) is one caller of this; your own script is another:

     const { runComparison, scoreRun } = require('mrt-research-harness');

     const { runId } = await runComparison({
       models: ['qwen25-32b', 'claude-opus-5'],
       tasks: ['grade-sources', 'score-dgi'],
       search: 'fixtures',
       onProgress: e => console.log(e.model, e.task, e.headline.value)
     });
     console.log(scoreRun(runId));      // path to the generated report.md

   Extending it is three exports away: add a backend under providers/, a task
   under tasks/, or a retriever under search/, and register it in that
   directory's index.js. Nothing else in the harness needs to know. */
'use strict';

var runner = require('./lib/runner.js');
var scorer = require('./score.js');
var providers = require('./providers/index.js');
var tasks = require('./tasks/index.js');
var search = require('./search/index.js');
var dataset = require('./lib/dataset.js');
var metrics = require('./lib/metrics.js');
var json = require('./lib/json.js');
var prompt = require('./lib/prompt.js');
var store = require('./lib/store.js');

module.exports = {
  version: require('./package.json').version,

  /* Run the comparison. Returns { runId, dir, meta, summary }. */
  runComparison: runner.runComparison,
  RUN_DEFAULTS: runner.DEFAULTS,

  /* Turn a finished run into report.md. Returns the path written. */
  scoreRun: scorer.report,
  newestRun: scorer.newestRun,

  /* The pluggable pieces. */
  providers: providers,
  tasks: tasks,
  search: search,

  /* The corpus the tasks are scored against, and where it was resolved from. */
  dataset: dataset,

  /* Scoring and parsing, exported because a custom task will want them. */
  metrics: metrics,
  json: json,
  prompt: prompt,
  store: store
};
