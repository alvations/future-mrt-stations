/* Anthropic Messages API adapter.

   Raw HTTP on purpose: every provider in this harness goes through the same
   code path, so a difference in results is a difference in the model and not
   in the client library. (In a Claude-only project you would use the official
   SDK instead.)

   One real trap for a comparison harness: on the current models - Opus 5,
   Opus 4.8/4.7, Sonnet 5, Fable 5/5.1 - temperature, top_p and top_k were
   REMOVED and are rejected with a 400. "Set temperature to 0 everywhere for
   determinism" therefore cannot be applied uniformly. Declare
   `supportsTemperature` per model in models.json; the harness records which
   determinism controls were actually available for each run, because that is
   part of interpreting the comparison honestly. */
'use strict';

var ENDPOINT = '/v1/messages';
var API_VERSION = '2023-06-01';

async function complete(opts) {
  var spec = opts.spec;
  var key = process.env[spec.apiKeyEnv || 'ANTHROPIC_API_KEY'];
  if (!key) throw new Error('missing ' + (spec.apiKeyEnv || 'ANTHROPIC_API_KEY'));

  var body = {
    model: spec.model,
    max_tokens: opts.maxTokens,
    messages: [{ role: 'user', content: opts.prompt }]
  };
  if (opts.system) body.system = opts.system;
  if (spec.supportsTemperature && opts.temperature != null) body.temperature = opts.temperature;
  if (spec.effort) body.output_config = { effort: spec.effort };
  if (spec.thinking) body.thinking = spec.thinking;

  var base = (spec.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  var started = Date.now();
  var res = await fetch(base + ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': spec.apiVersion || API_VERSION
    },
    body: JSON.stringify(body)
  });
  var json = await res.json().catch(function () { return null; });
  if (!res.ok) {
    throw new Error('anthropic ' + res.status + ': ' + JSON.stringify(json && json.error || json).slice(0, 300));
  }

  /* A policy decline returns HTTP 200 with stop_reason "refusal" and empty
     content. Record it as a refusal rather than an empty answer. */
  var text = (json.content || []).filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; }).join('');

  return {
    text: text,
    refused: json.stop_reason === 'refusal',
    stopReason: json.stop_reason,
    usage: {
      input: json.usage && json.usage.input_tokens,
      output: json.usage && json.usage.output_tokens,
      cacheRead: json.usage && json.usage.cache_read_input_tokens
    },
    ms: Date.now() - started,
    raw: json
  };
}

module.exports = { complete, id: 'anthropic' };
