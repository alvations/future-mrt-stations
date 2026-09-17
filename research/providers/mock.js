/* Offline mock provider - two fixtures, no network, no keys.

   These are NOT models and their scores say nothing about any model. They
   exist to prove the harness itself discriminates:

     mock-oracle  answers from the gold label, so a perfect score is reachable
     mock-weak    answers naively (majority class, fixed probability), so a
                  floor score is reachable

   A test asserts oracle > weak on every task. If that ever fails, the scorer
   is broken and no real comparison it produces can be trusted. They are also
   what lets `npm run research:compare` work in CI with no credentials.

   To read the gold label they use `opts.meta`, which real adapters ignore. */
'use strict';

function oracle(meta) {
  var item = meta.item || {};
  switch (meta.task) {
    case 'grade-sources': return JSON.stringify({ grade: item.gold.grade });
    case 'attribute-findings': return JSON.stringify({ sources: item.gold.sources });
    case 'score-dgi': return JSON.stringify({ dgi: item.gold.dgi });
    case 'forecast': return JSON.stringify({ probability: item.gold.probability });
    case 'verify-corrections': return JSON.stringify({ verdict: item.gold.verdict });
    case 'find-sources': return JSON.stringify({ query: item.gold.query });
    default: return '{}';
  }
}

/* Deliberately naive but well-formed: the floor is "answers the shape of the
   question without doing the work", not "emits garbage". */
function weak(meta) {
  var item = meta.item || {};
  switch (meta.task) {
    case 'grade-sources': return JSON.stringify({ grade: 'C' });
    case 'attribute-findings': return JSON.stringify({ sources: ['S01'] });
    case 'score-dgi': return JSON.stringify({ dgi: 10 });
    case 'forecast': return JSON.stringify({ probability: 0.5 });
    case 'verify-corrections': return JSON.stringify({ verdict: 'confirmed' });
    case 'find-sources': return JSON.stringify({ query: (item.input && item.input.text || '').split(/\s+/).slice(0, 3).join(' ') });
    default: return '{}';
  }
}

async function complete(opts) {
  var meta = opts.meta || {};
  var kind = opts.spec.behaviour || 'weak';
  var text = kind === 'oracle' ? oracle(meta) : weak(meta);
  /* Mimic the messiness the repair path exists for, so that path stays live. */
  if (opts.spec.messy) text = 'Sure, here you go:\n```json\n' + text.replace(/}$/, ',}') + '\n```';
  return {
    text: text,
    refused: false,
    stopReason: 'end_turn',
    usage: { input: Math.ceil(opts.prompt.length / 4), output: Math.ceil(text.length / 4) },
    ms: 0,
    raw: { mock: kind }
  };
}

module.exports = { complete, id: 'mock' };
