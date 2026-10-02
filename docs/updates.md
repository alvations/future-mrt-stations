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

## 2026-09-17 — research harness packaged

Turned `research/` into a self-contained package rather than scripts glued to
this repo.

- **`mrt-research-harness`**: own `package.json` with `exports`, `bin` (`mrt-research`) and a `files` list; linked as an npm workspace from the root. No runtime dependencies, so a clone still works with no install.
- **Library API** (`research/index.js`): `runComparison()` and `scoreRun()` alongside the provider, task and search registries, so the comparison can be embedded instead of shelled out to. The CLI is now a thin wrapper over `lib/runner.js`.
- **One dataset seam** (`research/lib/dataset.js`): six files used to reach into `../../assets`, which meant the harness could only run inside this repo against this one corpus. `MRT_DATA_ROOT` now points the same six tasks at a different corpus, and every run records which corpus it resolved and how.
- **Local environment**: `docker-compose.yml` for Ollama and SearXNG on localhost, with SearXNG settings that enable the JSON format the retriever needs. Schema-validated with `docker compose config`; not run end to end here, as this environment has no Docker daemon.
- 355 harness assertions, up from 254: the `exports` map and `files` list, the bin's shebang and mode, the public API surface, dataset resolution order and its failure message, a guard that nothing reaches back into `assets/`, and the compose/SearXNG configuration.

## 2026-09-18 — review pass on the harness

Reviewed the packaging commit at high effort and fixed all eleven findings. The
first one mattered most: every task module read the corpus at import time,
which defeated the lazy seam the previous entry claims to add — a copy of the
package away from this repo could not even print `--help`, let alone be
imported as a library. All corpus reads are now deferred to first use.

The rest: `scripts.test` pointed outside the package root (removed — the suite
belongs to the repo that owns the corpus); `files` omitted the compose files the
README lists; the report never printed which corpus produced it, though the
README promised it; `--json` skipped writing the report entirely; the banner
printed the literal `run (timestamp)` instead of the id needed to find a partial
run; `SEARXNG_SECRET` in the compose file could never take effect through a
read-only settings mount; an optional dataset module raised a bare
MODULE_NOT_FOUND; a dead variable left the missing-corpus path untested; the
anti-reach-around guard only matched single quotes; and two assertions read the
caller's ambient `MRT_DATA_ROOT`, so `npm test` broke for anyone using the
feature the commit added.

355 harness assertions, up from 335. The new ones cover a packaged copy loading
and answering `--help` with no corpus, running against an external one, the
missing-corpus error text, and the report naming its corpus.

## 2026-10-02 — access gaps checked against geometry

The analysis set every area's access gap by judgement "from station names and
descriptions, not GIS", and listed three proximity claims as `[UNSOURCED]`.
Those claims drive `A = 0.5` for the areas ranked 2–4, so they carried more
weight than anything else unverified in the model.

- **`assets/js/access.js`** computes the straight-line distance from an area's centre to the nearest open station and the nearest committed one, and says whether a declared access band contradicts that geometry. Speculative tiers are excluded on purpose: measuring an access gap against a line this analysis invented would assume its own conclusion.
- **`tools/access-check.js`** audits all fourteen areas and exits non-zero on a contradiction. It runs in the test suite, so adding a station that should change an area's access gap can no longer pass silently.
- **All three claims hold.** Fernvale's nearest MRT is Buangkok at about 2.1 km, Yishun East's is Khatib at about 1.7 km, Sembawang East's is Canberra at about 1.2 km — each well beyond the 800 m that stands in for a 10-minute walk. No band anywhere contradicts the geometry.
- **One correction:** the document called Sembawang East "outside walking range of Sembawang station". Its nearest station is in fact Canberra. The conclusion is unchanged; the station named was wrong (F68).
- The app now shows the distance in every demand-gap card, so the access gap is a number a reader can check rather than a judgement to accept.

**What this is not.** Straight lines between approximate coordinates, not walking
routes. It rules out a gross error; it does not establish walking distance. URA
subzone boundaries and OneMap routing would close that gap, and both are blocked
from this environment.

Findings F65–F68 are the first in this repo marked `computed`: they rest on a
named tool rather than a citation, because dressing a calculation up as a source
would be worse than saying plainly that nobody published this and we worked it
out. The suite requires every finding to have one or the other.

## 2026-10-02 — light rail added to the map

The map showed no LRT at all, which undersold its own central argument: Fernvale
is the second-ranked demand area precisely because its 71,200 residents have
light rail and no MRT. An argument about what a place lacks reads better when
you can see what it has.

- All three systems added as a distinct, visually subordinate tier: Bukit Panjang, and both loops each of Sengkang and Punggol. Separate layer toggle.
- Kept **out** of `assets/js/data/network.js` on purpose. `assets/js/access.js` measures the access gap against heavy rail; folding LRT into the MRT network would quietly close the very gap the analysis is about. The LRT file says so at the top, and the station panel says so to the reader.
- Fernvale gets an interchange-tier label despite being an LRT station, because it is the one light-rail station the argument turns on.
