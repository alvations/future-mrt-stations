/* Provider registry.

   A model is a JSON spec in research/models.json:

     { "id": "qwen-32b", "provider": "openai-compat", "model": "qwen2.5:32b",
       "baseUrl": "http://localhost:11434", "supportsTemperature": true }

   Adding a backend means adding one file here with a single `complete(opts)`
   function. Nothing else in the harness knows which model produced an answer,
   which is the whole point: same prompts, same parsing, same scoring. */
'use strict';
var fs = require('fs');
var path = require('path');

var ADAPTERS = {
  anthropic: require('./anthropic.js'),
  'openai-compat': require('./openai-compat.js'),
  ollama: require('./ollama.js'),
  mock: require('./mock.js')
};

function registry(file) {
  var p = file || path.join(__dirname, '..', 'models.json');
  var specs = JSON.parse(fs.readFileSync(p, 'utf8')).models;
  var byId = {};
  specs.forEach(function (s) { byId[s.id] = s; });
  return { specs: specs, byId: byId };
}

function resolve(spec) {
  var a = ADAPTERS[spec.provider];
  if (!a) throw new Error('unknown provider "' + spec.provider + '" (have: ' + Object.keys(ADAPTERS).join(', ') + ')');
  return a;
}

/* Every call in the harness goes through here, so retries, timeouts and the
   record of what determinism controls were available are uniform. */
async function call(spec, opts) {
  var adapter = resolve(spec);
  var attempts = (spec.retries == null ? 2 : spec.retries) + 1;
  var lastErr = null;
  for (var i = 0; i < attempts; i++) {
    try {
      var out = await withTimeout(adapter.complete(Object.assign({ spec: spec }, opts)), spec.timeoutMs || 120000);
      out.determinism = {
        temperature: spec.supportsTemperature === false ? 'unavailable' : (opts.temperature == null ? 'unset' : String(opts.temperature)),
        seed: spec.supportsSeed === false ? 'unavailable' : (opts.seed == null ? 'unset' : String(opts.seed))
      };
      out.attempt = i + 1;
      return out;
    } catch (e) {
      lastErr = e;
      if (i + 1 < attempts) await sleep(400 * Math.pow(2, i));
    }
  }
  throw lastErr;
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* The timer MUST be cleared. Promise.race settles as soon as the call
   returns, but an uncleared timer keeps the event loop alive - with one per
   request the process sits idle for the full timeout after the last answer
   instead of exiting. */
function withTimeout(promise, ms) {
  var timer;
  var guard = new Promise(function (_, reject) {
    timer = setTimeout(function () { reject(new Error('timeout after ' + ms + 'ms')); }, ms);
  });
  return Promise.race([promise, guard]).finally(function () { clearTimeout(timer); });
}

module.exports = { ADAPTERS, registry, resolve, call };
