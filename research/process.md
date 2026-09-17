# The research process, as a specification

The analysis this repo renders was produced by one model (Claude) doing six
things. This document specifies those six things so that **any** model can do
them and be scored the same way. It is the contract the harness implements; the
code is in `research/tasks/`.

The point is not to rank models for its own sake. It is that a research output
should be reproducible with a different reasoner. If the conclusions only hold
when one particular model produces them, that is worth knowing.

## The six components

| Stage | What the original process did | Task | Items | Gold standard |
|---|---|---|---|---|
| 1. Source discovery | Searched for primary sources on Singapore rail plans | `find-sources` | 64 | Does the model's query retrieve the source the report cites? |
| 2. Source appraisal | Graded every source A–D by provenance | `grade-sources` | 79 | The report's grades |
| 3. Knowledge gathering | Turned sources into numbered findings with citations | `attribute-findings` | 64 | The report's citations |
| 4. Quantitative reasoning | Computed the Demand Gap Index per area | `score-dgi` | 14 | `assets/js/dgi.js`, which reproduces the published table |
| 5. Self-correction | Re-checked draft claims against verified facts | `verify-corrections` | 10 | What verification actually concluded (section 8 of the analysis) |
| 6. Calibrated judgement | Assigned probabilities to 22 dated forecasts | `forecast` | 22 | The report's probabilities — **agreement, not accuracy** |

253 items in total. Every gold label traces to `docs/analysis-v2.0.md` or to code
in this repo that is itself tested against that document.

## What is held fixed

For a comparison to mean anything, only the model may vary:

- **Prompts** are plain markdown in `research/prompts/`, one per task, shared by every model. No XML scaffolding, no role-play, no few-shot examples chosen from one family's failure modes, no "think step by step" for some models and not others. A prompt tuned for one model invalidates the comparison; if you improve a prompt, improve it for everyone and re-run everyone.
- **Parsing** is shared and deliberately tolerant (`research/lib/json.js`). Small models fence their JSON, add trailing commas and use bare keys. Failing them for that would measure formatting compliance, not capability. Repairs are counted and reported, so the operational cost stays visible.
- **Scoring** is shared (`research/lib/metrics.js`) and computed from the same per-item records for every model.
- **Retrieval** is one backend per run, held fixed across models, so `find-sources` scores the query rather than the search engine. Swap the backend to compare retrievers instead, holding the model fixed.

## What cannot be held fixed, and how the report says so

Determinism is not uniform across providers. On the current Claude models
`temperature`, `top_p` and `top_k` are **rejected with a 400** — depth is
controlled by an `effort` setting instead — so a run against those models is not
temperature-pinned, while a run against a local Llama or Qwen is. Every run
records what each backend actually honoured, and the generated report prints it.
Use `--repeats N` to measure run-to-run variance before reading anything into a
small gap.

## Scoring choices worth knowing

- **Macro-F1 alongside accuracy** on the classification tasks. A model that
  answers "C" to every source grade scores 44% accuracy, because C is the
  majority class, and 15% macro-F1. Only one of those numbers is honest.
- **Precision and recall separately** on citation attribution. Listing many
  sources inflates recall; the F1 headline stops that.
- **Rank correlation** on the index task. A model can be sloppy about absolute
  values and still order the priorities correctly — for this kind of research
  that distinction matters more than the arithmetic.
- **A withdrawal-recall metric** on self-correction, because the interesting
  failure is specific: shown evidence that kills a claim, a model that wants to
  please will soften it to "reframed" instead of withdrawing it.
- **A hedge rate** on forecasting. Answering 0.5 everywhere earns a middling
  mean error while saying nothing.

## Adding a stage

1. Write the prompt in `research/prompts/<id>.md`, in the same plain style.
2. Write `research/tasks/<id>.js` exporting `items`, `prompt`, `parse`, `score`,
   `aggregate`, `headline`, and `measures`.
3. Register it in `research/tasks/index.js`.
4. Teach both mock fixtures to answer it in `research/providers/mock.js` —
   oracle from the gold label, weak naively. The test suite then proves the new
   task's scorer discriminates.
5. Gold labels must trace to the vendored document or to tested code. A stage
   whose gold is one model's opinion measures agreement with that model, and the
   report must say so — as the `forecast` stage does.
