/* OpenAI-compatible /v1/chat/completions adapter.

   This one adapter covers most of the open-source serving world: vLLM,
   llama.cpp's server, Ollama's compatibility endpoint, text-generation-
   inference, LM Studio, plus hosted gateways (Together, Groq, Fireworks,
   OpenRouter, DeepInfra). Point `baseUrl` at the server and set `apiKeyEnv`
   only if it needs one - a local vLLM or llama.cpp usually does not. */
'use strict';

async function complete(opts) {
  var spec = opts.spec;
  var headers = { 'content-type': 'application/json' };
  var key = spec.apiKeyEnv ? process.env[spec.apiKeyEnv] : null;
  if (spec.apiKeyEnv && !key && spec.requireKey !== false) {
    throw new Error('missing ' + spec.apiKeyEnv);
  }
  if (key) headers.authorization = 'Bearer ' + key;
  Object.assign(headers, spec.headers || {});

  var messages = [];
  if (opts.system) messages.push({ role: 'system', content: opts.system });
  messages.push({ role: 'user', content: opts.prompt });

  var body = { model: spec.model, messages: messages, max_tokens: opts.maxTokens, stream: false };
  if (spec.supportsTemperature !== false && opts.temperature != null) body.temperature = opts.temperature;
  /* Many OpenAI-compatible servers accept a seed; those that do not ignore it. */
  if (spec.supportsSeed !== false && opts.seed != null) body.seed = opts.seed;
  /* Only when the server advertises it: a JSON mode that the server enforces
     removes formatting noise, but not every backend implements it. */
  if (spec.jsonMode) body.response_format = { type: 'json_object' };
  Object.assign(body, spec.extraBody || {});

  var base = (spec.baseUrl || 'http://localhost:8000').replace(/\/$/, '');
  var url = base + (spec.path || '/v1/chat/completions');
  var started = Date.now();
  var res = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
  var json = await res.json().catch(function () { return null; });
  if (!res.ok) {
    throw new Error('openai-compat ' + res.status + ': ' + JSON.stringify(json && json.error || json).slice(0, 300));
  }
  var choice = (json.choices || [])[0] || {};
  var msg = choice.message || {};
  /* Some servers put chain-of-thought in reasoning_content and leave content
     empty; fall back so a reasoning model is not scored as silent. */
  var text = msg.content || msg.reasoning_content || '';

  return {
    text: text,
    refused: choice.finish_reason === 'content_filter',
    stopReason: choice.finish_reason,
    usage: {
      input: json.usage && json.usage.prompt_tokens,
      output: json.usage && json.usage.completion_tokens
    },
    ms: Date.now() - started,
    raw: json
  };
}

module.exports = { complete, id: 'openai-compat' };
