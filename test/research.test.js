/* Tests for the model-comparison harness:  node test/research.test.js

   No network and no API keys: provider adapters are exercised against a stubbed
   fetch, so the request SHAPE each backend sends is verified without calling
   anyone. The end-to-end check runs the real pipeline with the two mock
   fixtures and asserts the scorer discriminates between them - if that fails,
   no comparison the harness produces can be trusted. */
'use strict';
var path = require('path');
var fs = require('fs');
var cp = require('child_process');

var R = path.join(__dirname, '..', 'research');
var providers = require(path.join(R, 'providers', 'index.js'));
var tasksReg = require(path.join(R, 'tasks', 'index.js'));
var searchReg = require(path.join(R, 'search', 'index.js'));
var J = require(path.join(R, 'lib', 'json.js'));
var M = require(path.join(R, 'lib', 'metrics.js'));

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; return; }
  fail++;
  console.error('  FAIL  ' + name + (extra ? '  -> ' + extra : ''));
}
function section(t) { console.log('\n' + t); }

/* ---- stubbed fetch ---- */
var realFetch = global.fetch;
var captured = [];
function stubFetch(responder) {
  global.fetch = async function (url, init) {
    var body = init && init.body ? JSON.parse(init.body) : null;
    captured.push({ url: String(url), headers: (init && init.headers) || {}, body: body });
    var out = responder(String(url), body);
    return {
      ok: out.ok !== false,
      status: out.status || 200,
      json: async function () { return out.json; },
      text: async function () { return JSON.stringify(out.json); }
    };
  };
}
function restoreFetch() { global.fetch = realFetch; captured = []; }

/* ---- 1. JSON repair ---- */
section('Tolerant JSON extraction');
[
  ['plain', '{"grade":"A"}', { grade: 'A' }, false],
  ['fenced', '```json\n{"grade":"A"}\n```', { grade: 'A' }, false],
  ['prose wrapper', 'Sure! {"grade":"B"} hope that helps', { grade: 'B' }, false],
  ['trailing comma', '{"grade":"C",}', { grade: 'C' }, true],
  ['bare key and single quotes', "{grade: 'D'}", { grade: 'D' }, true],
  ['array with trailing comma', '[{"id":"S1"},]', [{ id: 'S1' }], true]
].forEach(function (c) {
  var r = J.extractJson(c[1]);
  ok('extractJson: ' + c[0], r.ok && JSON.stringify(r.value) === JSON.stringify(c[2]), r.error || JSON.stringify(r.value));
  if (r.ok) ok('extractJson: ' + c[0] + ' repair flag', r.repaired === c[3], String(r.repaired));
});
ok('extractJson reports failure instead of throwing', J.extractJson('no json at all').ok === false);
ok('extractJson survives null', J.extractJson(null).ok === false);
ok('apostrophes inside strings are not mangled',
  J.extractJson('{"why": "LTA\'s plan"}').value.why === "LTA's plan");
ok('extractNumber reads a percentage', Math.abs(J.extractNumber('about 65%').value - 0.65) < 1e-9);
ok('extractNumber reads a bare decimal', J.extractNumber('0.8').value === 0.8);

/* ---- 2. Metrics ---- */
section('Metrics');
ok('accuracy', M.accuracy([{ got: 'A', want: 'A' }, { got: 'B', want: 'C' }]) === 0.5);
ok('macro F1 punishes majority-class guessing',
  M.macroF1([{ got: 'C', want: 'A' }, { got: 'C', want: 'B' }, { got: 'C', want: 'C' }]) < 0.2);
var ss = M.setScores(['S1', 'S2'], ['S2', 'S3']);
ok('set precision/recall/f1', ss.precision === 0.5 && ss.recall === 0.5 && ss.f1 === 0.5);
ok('set scores ignore duplicates', M.setScores(['S1', 'S1'], ['S1']).f1 === 1);
ok('spearman identical is 1', M.spearman([3, 2, 1], [3, 2, 1]) === 1);
ok('spearman reversed is -1', M.spearman([1, 2, 3], [3, 2, 1]) === -1);
ok('brier is null with no outcomes', M.brier([{ got: 0.8, want: 0.8, outcome: null }]).score === null);
ok('brier scores resolved outcomes',
  Math.abs(M.brier([{ got: 0.8, outcome: 1 }, { got: 0.5, outcome: 0 }]).score - (0.04 + 0.25) / 2) < 1e-9);

/* ---- 3. Tasks ---- */
section('Tasks are well formed');
var EXPECT_ITEMS = { 'grade-sources': 79, 'attribute-findings': 64, 'find-sources': 64, 'score-dgi': 14, 'verify-corrections': 10, forecast: 22 };
tasksReg.DEFAULT_ORDER.forEach(function (id) {
  var task = tasksReg.TASKS[id];
  var items = task.items();
  ok(id + ': item count', items.length === EXPECT_ITEMS[id], items.length + ' vs ' + EXPECT_ITEMS[id]);
  ok(id + ': declares what it measures', !!task.measures && !!task.headline);
  items.slice(0, 3).forEach(function (item) {
    var p = task.prompt(item);
    ok(id + '/' + item.id + ': prompt renders', typeof p === 'string' && p.length > 80);
    ok(id + '/' + item.id + ': no unfilled placeholders', p.indexOf('{{') < 0, p.slice(0, 60));
    ok(id + '/' + item.id + ': has gold', item.gold && Object.keys(item.gold).length > 0);
  });
  /* Garbage must never crash, and must never score as correct. find-sources
     deliberately accepts a bare line as a query - a model that answers with
     just the query should not be failed on formatting - so there the check is
     that the retrieval misses, not that parsing fails. */
  var bad = task.parse('I am not going to answer that.');
  if (task.id === 'find-sources') {
    ok(id + ': a bare line is accepted as a query', bad.ok === true);
  } else {
    ok(id + ': garbage parses as failure', bad.ok === false);
  }
});
/* Whatever parsing does with garbage, it must not score as correct. */
(async function garbageScoresZero() {
  var search = searchReg.resolve('fixtures');
  for (var i = 0; i < tasksReg.DEFAULT_ORDER.length; i++) {
    var task = tasksReg.TASKS[tasksReg.DEFAULT_ORDER[i]];
    var item = task.items()[0];
    var sc = await task.score(task.parse('I am not going to answer that.'), item, { search: search, spec: {} });
    ok(task.id + ': garbage never scores as correct', sc.correct === false || sc.correct === null, JSON.stringify(sc));
  }
})();

ok('unknown task id is rejected', (function () {
  try { tasksReg.resolve(['nope']); return false; } catch (e) { return /unknown task/.test(e.message); }
})());

/* Gold for score-dgi must equal the app's own model, not a copy. */
var dgiTask = tasksReg.TASKS['score-dgi'];
var dgiModel = require(path.join(__dirname, '..', 'assets', 'js', 'dgi.js'));
var areas = require(path.join(__dirname, '..', 'assets', 'js', 'data', 'areas.js'));
dgiTask.items().forEach(function (item) {
  var a = areas.find(function (x) { return x.id === item.id; });
  ok('score-dgi gold for ' + item.id + ' comes from the shipped model',
    Math.abs(item.gold.dgi - Math.round(dgiModel.score(a).total * 10) / 10) < 1e-9);
});

/* ---- 4. Provider request shapes ---- */
section('Provider adapters send the right request');
(async function () {
  /* Anthropic: temperature must be OMITTED where the model rejects it. */
  process.env.ANTHROPIC_API_KEY = 'test-key';
  stubFetch(function () {
    return { json: { content: [{ type: 'text', text: '{"grade":"A"}' }], stop_reason: 'end_turn', usage: { input_tokens: 11, output_tokens: 3 } } };
  });
  var out = await providers.call({ id: 'x', provider: 'anthropic', model: 'claude-opus-5', supportsTemperature: false, effort: 'high' },
    { prompt: 'hi', maxTokens: 100, temperature: 0, seed: 7 });
  var req = captured[captured.length - 1];
  ok('anthropic: posts to /v1/messages', /\/v1\/messages$/.test(req.url), req.url);
  ok('anthropic: sends x-api-key', req.headers['x-api-key'] === 'test-key');
  ok('anthropic: sends anthropic-version', !!req.headers['anthropic-version']);
  ok('anthropic: sends max_tokens', req.body.max_tokens === 100);
  ok('anthropic: OMITS temperature when the model rejects it', !('temperature' in req.body), JSON.stringify(req.body));
  ok('anthropic: passes effort through output_config', req.body.output_config && req.body.output_config.effort === 'high');
  ok('anthropic: extracts text', out.text === '{"grade":"A"}');
  ok('anthropic: maps usage', out.usage.input === 11 && out.usage.output === 3);
  ok('anthropic: records temperature as unavailable', out.determinism.temperature === 'unavailable');

  var out2 = await providers.call({ id: 'x', provider: 'anthropic', model: 'claude-haiku-4-5', supportsTemperature: true },
    { prompt: 'hi', maxTokens: 50, temperature: 0 });
  ok('anthropic: SENDS temperature when the model accepts it', captured[captured.length - 1].body.temperature === 0);
  ok('anthropic: records the temperature used', out2.determinism.temperature === '0');

  /* A refusal is HTTP 200 with stop_reason refusal - not an empty answer. */
  stubFetch(function () { return { json: { content: [], stop_reason: 'refusal', usage: {} } }; });
  var ref = await providers.call({ id: 'x', provider: 'anthropic', model: 'claude-opus-5', supportsTemperature: false },
    { prompt: 'hi', maxTokens: 10 });
  ok('anthropic: flags a refusal', ref.refused === true && ref.stopReason === 'refusal');

  /* An API error must surface, not be silently scored as a wrong answer. */
  stubFetch(function () { return { ok: false, status: 400, json: { error: { message: 'temperature: unsupported' } } }; });
  var threw = false;
  try {
    await providers.call({ id: 'x', provider: 'anthropic', model: 'claude-opus-5', retries: 0 }, { prompt: 'hi', maxTokens: 10 });
  } catch (e) { threw = /anthropic 400/.test(e.message); }
  ok('anthropic: a 400 raises with the server message', threw);

  /* OpenAI-compatible: covers vLLM, llama.cpp, Ollama /v1, TGI, gateways. */
  stubFetch(function () {
    return { json: { choices: [{ message: { content: '{"grade":"B"}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 7, completion_tokens: 4 } } };
  });
  var oc = await providers.call({ id: 'y', provider: 'openai-compat', model: 'qwen2.5:32b', baseUrl: 'http://localhost:8000', jsonMode: true, requireKey: false },
    { prompt: 'hi', maxTokens: 64, temperature: 0, seed: 7 });
  req = captured[captured.length - 1];
  ok('openai-compat: posts to /v1/chat/completions', /\/v1\/chat\/completions$/.test(req.url), req.url);
  ok('openai-compat: sends temperature', req.body.temperature === 0);
  ok('openai-compat: sends seed', req.body.seed === 7);
  ok('openai-compat: sends max_tokens', req.body.max_tokens === 64);
  ok('openai-compat: requests JSON mode when configured', req.body.response_format && req.body.response_format.type === 'json_object');
  ok('openai-compat: no auth header without a key', !req.headers.authorization);
  ok('openai-compat: reads the message content', oc.text === '{"grade":"B"}');
  ok('openai-compat: maps usage', oc.usage.input === 7 && oc.usage.output === 4);

  process.env.TEST_GATEWAY_KEY = 'gw-key';
  await providers.call({ id: 'y', provider: 'openai-compat', model: 'm', baseUrl: 'https://gw.example', apiKeyEnv: 'TEST_GATEWAY_KEY' }, { prompt: 'hi', maxTokens: 8 });
  ok('openai-compat: sends a bearer token when a key is configured',
    captured[captured.length - 1].headers.authorization === 'Bearer gw-key');

  /* Reasoning servers that leave content empty must not score as silent. */
  stubFetch(function () {
    return { json: { choices: [{ message: { content: '', reasoning_content: '{"dgi": 1.2}' } }], usage: {} } };
  });
  var rc = await providers.call({ id: 'y', provider: 'openai-compat', model: 'r1', baseUrl: 'http://x', requireKey: false }, { prompt: 'hi', maxTokens: 8 });
  ok('openai-compat: falls back to reasoning_content', rc.text === '{"dgi": 1.2}');

  /* Ollama native. */
  stubFetch(function () {
    return { json: { message: { content: '{"verdict":"withdrawn"}' }, done_reason: 'stop', prompt_eval_count: 21, eval_count: 6 } };
  });
  var ol = await providers.call({ id: 'z', provider: 'ollama', model: 'llama3.1:8b', jsonMode: true }, { prompt: 'hi', maxTokens: 32, temperature: 0, seed: 7 });
  req = captured[captured.length - 1];
  ok('ollama: posts to /api/chat', /\/api\/chat$/.test(req.url), req.url);
  ok('ollama: maps maxTokens to options.num_predict', req.body.options.num_predict === 32);
  ok('ollama: passes temperature and seed in options', req.body.options.temperature === 0 && req.body.options.seed === 7);
  ok('ollama: sets format json when configured', req.body.format === 'json');
  ok('ollama: disables streaming', req.body.stream === false);
  ok('ollama: reads message.content', ol.text === '{"verdict":"withdrawn"}');
  ok('ollama: maps its own token counters', ol.usage.input === 21 && ol.usage.output === 6);

  /* Missing credentials must fail loudly rather than score as a bad model. */
  delete process.env.MISSING_KEY_ENV;
  var keyThrew = false;
  try {
    await providers.call({ id: 'k', provider: 'anthropic', model: 'claude-opus-5', apiKeyEnv: 'MISSING_KEY_ENV', retries: 0 }, { prompt: 'hi', maxTokens: 8 });
  } catch (e) { keyThrew = /missing MISSING_KEY_ENV/.test(e.message); }
  ok('a missing API key raises a clear error', keyThrew);

  /* Retries: transient failure then success. */
  var calls = 0;
  global.fetch = async function () {
    calls++;
    if (calls < 2) throw new Error('ECONNRESET');
    return { ok: true, status: 200, json: async function () { return { content: [{ type: 'text', text: 'ok' }], usage: {} }; } };
  };
  var retried = await providers.call({ id: 'r', provider: 'anthropic', model: 'claude-opus-5', retries: 2 }, { prompt: 'hi', maxTokens: 8 });
  ok('a transient failure is retried', retried.text === 'ok' && retried.attempt === 2, 'attempt ' + retried.attempt);

  /* The timeout must clear its timer, or a run hangs after the last answer. */
  global.fetch = function () { return new Promise(function () {}); };
  var t0 = Date.now();
  var timedOut = false;
  try {
    await providers.call({ id: 't', provider: 'anthropic', model: 'claude-opus-5', retries: 0, timeoutMs: 120 }, { prompt: 'hi', maxTokens: 8 });
  } catch (e) { timedOut = /timeout/.test(e.message); }
  ok('a hung request times out', timedOut && Date.now() - t0 < 2000);
  ok('the timeout leaves no pending timer',
    process.getActiveResourcesInfo().filter(function (r) { return r === 'Timeout'; }).length === 0,
    process.getActiveResourcesInfo().join(','));

  restoreFetch();

  /* ---- 5. Search backends ---- */
  section('Search backends');
  var fixtures = searchReg.resolve('fixtures');
  ok('fixtures corpus is the report’s 79 sources', fixtures.size === 79, String(fixtures.size));
  var hits = await fixtures.search('Paya Lebar Air Base 150,000 new homes', { k: 5 });
  ok('fixtures retrieves a plausible source', hits.length > 0 && /Paya Lebar/.test(hits[0].title), JSON.stringify(hits[0] || null));
  ok('fixtures returns no more than k', (await fixtures.search('MRT', { k: 3 })).length <= 3);
  ok('fixtures returns nothing for gibberish', (await fixtures.search('zzzzqqq', { k: 5 })).length === 0);
  ok('fixtures ranking is deterministic',
    JSON.stringify(await fixtures.search('Jurong Region Line', { k: 5 })) === JSON.stringify(await fixtures.search('Jurong Region Line', { k: 5 })));
  ok('every search backend is registered', ['fixtures', 'searxng', 'duckduckgo'].every(function (b) { return !!searchReg.BACKENDS[b]; }));
  ok('unknown search backend is rejected', (function () {
    try { searchReg.resolve('nope'); return false; } catch (e) { return /unknown search backend/.test(e.message); }
  })());

  /* ---- 6. The scorer discriminates ---- */
  section('The harness discriminates (oracle vs naive)');
  var reg = providers.registry();
  ok('registry includes both mock fixtures', !!reg.byId['mock-oracle'] && !!reg.byId['mock-weak']);
  ok('registry includes an open-source entry', reg.specs.some(function (s) { return s.provider === 'ollama' || s.provider === 'openai-compat'; }));
  ok('registry includes a Claude entry', reg.specs.some(function (s) { return s.provider === 'anthropic'; }));
  ok('unknown provider is rejected', (function () {
    try { providers.resolve({ provider: 'nope' }); return false; } catch (e) { return /unknown provider/.test(e.message); }
  })());

  var search = searchReg.resolve('fixtures');
  for (var ti = 0; ti < tasksReg.DEFAULT_ORDER.length; ti++) {
    var task = tasksReg.TASKS[tasksReg.DEFAULT_ORDER[ti]];
    var items = task.items().slice(0, 6);
    var scores = {};
    for (var mi = 0; mi < 2; mi++) {
      var specId = mi === 0 ? 'mock-oracle' : 'mock-weak';
      var spec = reg.byId[specId];
      var rows = [];
      for (var ii = 0; ii < items.length; ii++) {
        var item = items[ii];
        var res = await providers.call(spec, {
          prompt: task.prompt(item), maxTokens: task.maxTokens, temperature: 0, seed: 7,
          meta: { task: task.id, item: item }
        });
        var parsed = task.parse(res.text);
        ok(task.id + '/' + specId + ': mock output parses', parsed.ok, parsed.error);
        rows.push({ ok: parsed.ok, repaired: parsed.repaired, score: await task.score(parsed, item, { search: search, spec: spec }) });
      }
      scores[specId] = task.aggregate(rows)[task.headline];
    }
    var lower = !!task.headlineLowerIsBetter;
    var o = scores['mock-oracle'], w = scores['mock-weak'];
    ok(task.id + ': oracle beats naive on ' + task.headline + ' (' + o + ' vs ' + w + ')',
      lower ? o < w : o > w);
  }

  /* ---- 7. End to end through the CLI ---- */
  section('Runner end to end');
  var runId = 'test-' + process.pid;
  var runDir = path.join(R, 'runs', runId);
  try {
    cp.execFileSync(process.execPath, [path.join(R, 'run.js'),
      '--models', 'mock-oracle,mock-weak', '--tasks', 'grade-sources,score-dgi',
      '--limit', '4', '--out', runId, '--no-cache'], { stdio: 'pipe', timeout: 60000 });
    ok('the runner exits cleanly', true);
    ['meta.json', 'summary.json', 'report.md',
      'mock-oracle__grade-sources.jsonl', 'mock-weak__score-dgi.jsonl'].forEach(function (f) {
      ok('the runner writes ' + f, fs.existsSync(path.join(runDir, f)));
    });
    var sum = JSON.parse(fs.readFileSync(path.join(runDir, 'summary.json'), 'utf8'));
    ok('summary has one entry per model-task pair', sum.results.length === 4, String(sum.results.length));
    var oracleRows = sum.results.filter(function (r) { return r.model === 'mock-oracle'; });
    ok('oracle reaches a perfect headline on the objective tasks',
      oracleRows.every(function (r) { return r.headline.value === 1; }),
      JSON.stringify(oracleRows.map(function (r) { return r.headline; })));
    var rows = fs.readFileSync(path.join(runDir, 'mock-oracle__grade-sources.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    ok('per-item rows keep the raw response for audit', rows.every(function (r) { return typeof r.raw === 'string'; }));
    ok('per-item rows record the gold label', rows.every(function (r) { return r.gold && r.gold.grade; }));
    var md = fs.readFileSync(path.join(runDir, 'report.md'), 'utf8');
    ok('the report names both models', /mock-oracle/.test(md) && /mock-weak/.test(md));
    ok('the report states the forecast caveat or determinism caveat', /Determinism/.test(md));
    ok('the report warns that the mocks are not models', /not models/.test(md));
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
  }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})().catch(function (e) {
  restoreFetch();
  console.error('\nharness test crashed: ' + (e && e.stack || e));
  process.exit(1);
});
