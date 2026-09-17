# Update log

Newest first. One entry per real-world change absorbed into the data. See
[UPDATING.md](../UPDATING.md) for what belongs here.

---

## 2026-09-17 — initial build

Built the map from *Where Singapore's Next MRT Lines Could Go* v2.0
(16 Sep 2026), vendored at [`analysis-v2.0.md`](analysis-v2.0.md).

- **Data:** 79 sources, 64 findings, 7 operating lines (175 station entries), 17 future projects (97 station nodes), 14 demand-gap areas, 22 forecasts.
- **Provenance:** the test suite verifies every source id, grade and URL, every forecast probability and deadline, and all 14 index scores against the vendored document.
- **Unresolved forecasts:** all 22. No Brier score yet.
- **Known discrepancy:** the document's sensitivity table prints 14.8 / 14.3 for Sembawang at 2.5 / 3.5 residents per home; recomputation from its stated inputs gives 15.5 / 13.8. Conclusions unaffected; app shows computed values.
- **Next checkpoints:** TEL5 / DTL3e and RTS Link by 31 Dec 2026 (P01, P02); MOT Committee of Supply, Feb–Mar 2027 (P05, P06, P15).

## 2026-09-17 — model-agnostic research harness

Added `research/`: the six components of the process that produced the analysis,
implemented as scoreable tasks so any model can redo them and be compared on
identical prompts, parsing and scoring.

- **Tasks:** query formulation (64), source appraisal (79), citation attribution (64), quantitative reasoning (14), self-correction (10), forecasting (22) — 253 items, gold from the vendored document and from `assets/js/dgi.js`.
- **Backends:** `openai-compat` (vLLM, llama.cpp, TGI, LM Studio, Ollama `/v1`, hosted gateways), `ollama` native, `anthropic`, and two offline mock fixtures. Search is pluggable too: offline fixtures, SearXNG, DuckDuckGo.
- **Honesty:** `forecast` measures agreement with the reference analysis, not accuracy, because nothing has resolved. Determinism is recorded per run because it is not uniform — the current Claude models reject `temperature` outright.
- **Guardrail:** a model's answer is not a citation. Harness output never enters the map data except through UPDATING.md §3.
