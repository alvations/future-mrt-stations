/* Ollama native /api/chat adapter.

   Ollama also speaks the OpenAI-compatible shape, so this exists for the
   things only the native endpoint exposes: `format: "json"`, `options.seed`,
   `keep_alive`, and its own token counters. Either adapter is a fair way to
   run a local model; pick one and keep it fixed across a comparison. */
'use strict';

async function complete(opts) {
  var spec = opts.spec;
  var messages = [];
  if (opts.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: opts.prompt });

  var options = { num_predict: opts.maxTokens };
  if (spec.supportsTemperature !== false && opts.temperature != null) options.temperature = opts.temperature;
  if (spec.supportsSeed !== false && opts.seed != null) options.seed = opts.seed;
  Object.assign(options, spec.options || {});

  var body = { model: spec.model, messages: messages, stream: false, options: options };
  if (spec.jsonMode) body.format = 'json';
  if (spec.keepAlive) body.keep_alive = spec.keepAlive;

  var base = (spec.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  var started = Date.now();
  var res = await fetch(base + (spec.path || '/api/chat'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  var json = await res.json().catch(function () { return null; });
  if (!res.ok) throw new Error('ollama ' + res.status + ': ' + JSON.stringify(json).slice(0, 300));

  return {
    text: (json.message && json.message.content) || '',
    refused: false,
    stopReason: json.done_reason,
    usage: { input: json.prompt_eval_count, output: json.eval_count },
    ms: Date.now() - started,
    raw: json
  };
}

module.exports = { complete, id: 'ollama' };
