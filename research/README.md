# Model-agnostic research harness

The map in this repo was built from an analysis produced by one model. This
directory lets **any** model redo the same research process and be scored
identically, so the pipeline can be compared across models instead of trusted
because of who produced it.

Claude is one entry in `models.json`, no different from a local Llama or Qwen.
Nothing in the harness treats any provider specially.

## Install

The harness is a self-contained package (`mrt-research-harness`) that lives in
this repo. Nothing needs installing to use it from a clone — it has no runtime
dependencies — but `npm install` at the repo root links it as a workspace, which
gives you the `mrt-research` command and lets you `require()` it by name.

```bash
git clone https://github.com/alvations/future-mrt-stations
cd future-mrt-stations
npm install          # optional: links the workspace, no third-party packages
```

## Run

```bash
# Works offline, no keys, in CI: proves the harness discriminates
npm run research:compare

# A local open-source model via Ollama
ollama pull qwen2.5:32b
node research/run.js --models qwen25-32b

# Several models, same process, one report
node research/run.js --models llama31-8b,qwen25-32b,claude-opus-5

# Cheap smoke run first - 3 items per task
node research/run.js --models qwen25-32b --limit 3

# Compare retrievers instead of models, holding the model fixed
node research/run.js --models qwen25-32b --tasks find-sources --search searxng
```

Once linked, `npx mrt-research --models ...` is the same command from anywhere
in the repo, and `--help` lists every option.

Each run writes `research/runs/<id>/`: `meta.json`, one JSONL per model-task
pair with every prompt result and its score, `summary.json`, and a generated
`report.md`. See `example-report.md` for what that looks like.

## What gets measured

Six stages, 253 items, gold labels from the vendored analysis —
[`process.md`](process.md) is the specification:

| Task | Component | Items | Headline |
|---|---|---|---|
| `find-sources` | query formulation, through a real retriever | 64 | `recall_at_5` |
| `grade-sources` | source appraisal against the A–D rubric | 79 | `accuracy` |
| `attribute-findings` | citation attribution across the 79-source register | 64 | `f1` |
| `score-dgi` | quantitative reasoning on the demand index | 14 | `exact_rate` |
| `verify-corrections` | self-correction when evidence kills a claim | 10 | `accuracy` |
| `forecast` | calibrated judgement on 22 dated forecasts | 22 | `agreement_mae` |

## One command for the open-source path

`docker-compose.yml` brings up the two local backends the harness expects, both
bound to localhost:

```bash
docker compose -f research/docker-compose.yml up -d
docker compose -f research/docker-compose.yml exec ollama ollama pull qwen2.5:32b
node research/run.js --models qwen25-32b --search searxng
```

Ollama lands on the port `models.json` already points at, and SearXNG on the
port `search/searxng.js` defaults to, so a default run needs no further
configuration. The bundled SearXNG settings enable the JSON output format —
without it the retriever gets HTML back and every retrieval silently scores
zero, which is why a test asserts it. Uncomment the GPU block in the compose
file if you have one; without it Ollama runs on CPU, fine for 7–8B models and
slow but workable at 32B.

## Use as a library

```js
const { runComparison, scoreRun } = require('mrt-research-harness');

const { runId, summary } = await runComparison({
  models: ['qwen25-32b', 'claude-opus-5'],
  tasks: ['grade-sources', 'score-dgi'],
  search: 'fixtures',
  repeats: 3,                       // measure run-to-run variance
  onProgress: e => console.log(e.model, e.task, e.headline.value)
});

console.log(scoreRun(runId));       // path to the generated report.md
```

Subpath exports for the pluggable pieces: `mrt-research-harness/providers`,
`/tasks`, `/search`, `/dataset`, `/metrics`, `/json`.

## Point it at a different corpus

The tasks are about a research *process*, not about Singapore. Everything the
harness knows about its data goes through `lib/dataset.js`, so it can be scored
against another corpus:

```bash
MRT_DATA_ROOT=/path/to/your/dataset node research/run.js --models qwen25-32b
```

A dataset root is a directory holding `js/data/{sources,findings,areas,
predictions}.js` and `js/dgi.js`, each a UMD module exporting its array — the
shapes are documented in `../AGENTS.md` §6. Every run records which corpus it
resolved and how, so a report always says what it was scored against.

## Layout

```
package.json        the package manifest: exports, bin, files
index.js            public API - runComparison, scoreRun, and the registries
run.js              CLI (also the `mrt-research` bin)
score.js            turns a finished run into report.md
models.json         the model registry - adding a model is one entry here
lib/dataset.js      the single seam onto the corpus being scored against
lib/runner.js       runComparison(): the harness as a function
lib/{json,metrics,prompt,store}.js   parsing, scoring, templates, run storage
providers/          anthropic, openai-compat, ollama, mock
search/             fixtures, searxng, duckduckgo
tasks/              the six research components
prompts/            one plain markdown template per task, shared by every model
fixtures/           the self-correction fixture
docker-compose.yml  local Ollama + SearXNG
```

## Adding a model

Add an entry to `models.json`. That is the whole integration:

```json
{ "id": "my-model", "provider": "openai-compat", "model": "served-name",
  "baseUrl": "http://localhost:8000", "supportsTemperature": true }
```

Four backends ship, and one of them covers most of the open-source world:

| Provider | Covers |
|---|---|
| `openai-compat` | vLLM, llama.cpp server, TGI, LM Studio, Ollama's `/v1`, and hosted gateways (Together, Groq, Fireworks, OpenRouter, DeepInfra) |
| `ollama` | Ollama's native `/api/chat`, for `format: json`, `options.seed` and its own token counters |
| `anthropic` | Claude, via `/v1/messages` |
| `mock` | Two offline fixtures — see below |

A new backend is one file in `providers/` exporting `complete(opts)` and one
line in `providers/index.js`. Adapters use raw HTTP rather than each vendor's
SDK on purpose: one code path for everyone means a difference in results is a
difference in the model, not in the client library.

## Adding a search backend

Retrieval is a research component too, so it is swappable the same way:
`fixtures` (offline, the report's own 79 sources, deterministic — use this for
comparisons), `searxng` (open source, self-hostable, live web), `duckduckgo`
(no key, not reproducible — exploration only).

## The two mock entries are not models

`mock-oracle` answers from the gold label; `mock-weak` answers naively, in
deliberately messy formatting. They exist so the test suite can assert that a
perfect score and a floor score are both reachable on every task — if that ever
fails, the scorer is broken and no comparison it produces can be trusted. They
also make `npm run research:compare` work in CI with no credentials.

Current floor-versus-ceiling, from `example-report.md`:

| Task | `mock-oracle` | `mock-weak` |
|---|---|---|
| grade-sources (accuracy) | 1.000 | 0.443 |
| attribute-findings (f1) | 1.000 | 0.010 |
| find-sources (recall@5) | 1.000 | 0.266 |
| score-dgi (exact_rate) | 1.000 | 0.000 |
| verify-corrections (accuracy) | 1.000 | 0.400 |
| forecast (MAE, lower better) | 0.000 | 0.198 |

`mock-weak` scoring 0.443 on source grading while managing 0.154 macro-F1 is
the reason both numbers are reported: answering "C" to everything looks
respectable on accuracy alone.

## Reading results honestly

- **`forecast` measures agreement with the reference analysis, not accuracy.**
  None of the 22 forecasts has resolved. A model that disagrees may be right.
  Once outcomes are recorded (`UPDATING.md` §5), the same task reports a real
  Brier score automatically.
- **Determinism is not uniform.** `temperature` is rejected outright by the
  current Claude models, so those runs are not temperature-pinned while local
  ones are. The report prints what each backend honoured. Measure variance with
  `--repeats` before believing a small gap.
- **Costs and latency are recorded, not judged.** Tokens in and out per model
  per task are in every report; a hosted frontier model and a 8B local model are
  not competing on the same axis.
- **Everything is auditable.** Every raw response is kept verbatim in the run
  directory. A comparison nobody can check is not a comparison.
- **Responses are cached** by model, prompt and settings, so re-scoring or
  adding one model never re-spends on calls already made. `--no-cache` to force.

## Tests

```bash
npm run test:research
```

254 assertions, no network: provider adapters are verified against a stubbed
fetch (including that `temperature` is omitted for the models that reject it and
sent for the ones that accept it), the tolerant JSON repair path, every metric,
every task's shape, search determinism, that garbage never scores as correct,
and an end-to-end CLI run asserting oracle beats naive on all six tasks.
