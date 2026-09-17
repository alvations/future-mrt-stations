/* Task registry.

   Each task is one component of the research process that produced the
   analysis, turned into something scoreable:

     grade-sources        source appraisal      79 items, gold = the report's grades
     attribute-findings   citation attribution  64 items, gold = the report's citations
     find-sources         query formulation     64 items, gold = recall of the cited source
     score-dgi            quantitative reasoning 14 items, gold = the index model
     verify-corrections   self-correction       10 items, gold = what verification concluded
     forecast             calibrated judgement  22 items, reference = the report's probabilities

   A task NEVER sees which model answered, and the scorer is shared, so the only
   thing that varies between runs is the model. */
'use strict';

var TASKS = {
  'grade-sources': require('./grade-sources.js'),
  'attribute-findings': require('./attribute-findings.js'),
  'find-sources': require('./find-sources.js'),
  'score-dgi': require('./score-dgi.js'),
  'verify-corrections': require('./verify-corrections.js'),
  forecast: require('./forecast.js')
};

var DEFAULT_ORDER = ['grade-sources', 'attribute-findings', 'find-sources', 'score-dgi', 'verify-corrections', 'forecast'];

function resolve(ids) {
  var list = (ids && ids.length) ? ids : DEFAULT_ORDER;
  return list.map(function (id) {
    if (!TASKS[id]) throw new Error('unknown task "' + id + '" (have: ' + DEFAULT_ORDER.join(', ') + ')');
    return TASKS[id];
  });
}

module.exports = { TASKS, DEFAULT_ORDER, resolve };
