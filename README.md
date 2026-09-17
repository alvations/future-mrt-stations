# Where Singapore's next MRT lines could go

An interactive map of Singapore's rail network as it is, as it is committed to
become, and as it might become. Click any station, line or demand bubble and the
panel tells you **why it is on the map**: the reasoning, the numbered findings,
and every source behind them, graded A to D.

It is built from *Where Singapore's Next MRT Lines Could Go* v2.0 (16 September
2026) — 79 sources, 64 findings, a reproducible Demand Gap Index, and 22 dated
probability forecasts.

**Live site:** https://alvations.github.io/future-mrt-stations/

```
npm start                 # serves the site at http://localhost:8080
npm test                  # both suites, no dependencies
npm run research:compare  # offline model-comparison run, no API keys needed
```

No build step and no runtime dependencies: open `index.html` through any static
server. Every push to the default branch runs the tests and, if they pass,
publishes the site to GitHub Pages (`.github/workflows/pages.yml`).

**Working on this repo?**

- **[AGENTS.md](AGENTS.md)** — everything an agent or contributor needs from a fresh clone: ground rules, data model, rendering internals, how to verify.
- **[UPDATING.md](UPDATING.md)** — keeping the map current: when to check, which sources to search, what to edit when an announcement lands, how to score a forecast.
- **[docs/analysis-v2.0.md](docs/analysis-v2.0.md)** — the source analysis the whole app renders, vendored so the repo is self-contained. The test suite checks the data against it.
- **[docs/updates.md](docs/updates.md)** — log of changes absorbed over time.
- **[research/](research/README.md)** — a model-agnostic harness that re-runs the six components of the research process (source discovery, appraisal, citation attribution, quantitative reasoning, self-correction, forecasting) against any model, scored identically, so the analysis can be reproduced with a different reasoner instead of trusted because of who produced it. Claude is one entry in `research/models.json`; a local Llama or Qwen is another.

## What the map shows

Three confidence tiers, kept visually distinct so a plan is never mistaken for a
guess:

| Layer | Meaning |
|---|---|
| **Solid, muted** | Open today |
| **Solid, bright** | Committed: TEL5/DTL3e, RTS Link, JRL, CRL 1–3 and the Punggol Extension, DTL2e, Brickland |
| **Dashed** | The Seletar–Tengah Line. LTA has named the catchments and begun engineering studies but has published **no alignment and no station list**. The stations drawn are the analysis's reading of those catchments. |
| **Dotted** | Fully speculative. Only the Paya Lebar Air Base corridor, inferred because 150,000 homes on 800 ha cannot meet the government's own 10-minute-walk target from one edge station at Defu. |
| **Bubbles** | Demand Gap Index. Orange is unmet need, green means the analysis expects nothing new because rail is already there. |

Every future station carries a placement badge — *sited*, *indicative*, or
*model guess* — and any model-placed station opens with a callout saying plainly
that it exists on no official plan.

## The Demand Gap Index

`DGI = H × A × T × C` summed over an area's components:

- **H** — homes needing service, in thousands. For existing areas, residents ÷ 3.0.
- **A** — access gap, 0–1: the share of the area *not* within a 10-minute walk of existing or committed rail.
- **T** — timing gap, 0–1: does rail arrive before, with, or years after the residents.
- **C** — crowding multiplier: 1.5 where LTA has intervened, 1.2 where independent load data flags the area.

`assets/js/dgi.js` reproduces all fourteen published scores exactly, and the test
suite checks them along with the published sensitivity cases. The ranking is
robust: Paya Lebar Air Base is first under every tested assumption, and the
north/north-east cluster (Fernvale, Yishun East, Sembawang) holds ranks 2–4.

**One discrepancy worth flagging.** The source document's sensitivity table
prints 14.8 and 14.3 for Sembawang at 2.5 and 3.5 residents per home.
Recomputing from its own stated inputs gives 15.5 and 13.8. Its *conclusions*
reproduce (the order is unchanged at 2.5, and Sembawang overtakes Yishun East at
3.5), so the app shows computed values and the tests assert the conclusions
rather than those two cells.

## Layout

```
index.html                 the whole app shell
assets/js/data/            sources, findings, network, future projects, areas, predictions
assets/js/geo.js           projection and route smoothing
assets/js/dgi.js           the Demand Gap Index model (shared by browser and tests)
assets/js/app.js           map rendering, decluttering, panel, routing, search
test/app.test.js           node test suite, no dependencies
```

Data files are plain UMD modules, so the same file feeds the browser and the
Node tests with no build step. Adding a station means adding one object to
`assets/js/data/future.js` with its `why`, findings, sources and forecasts; the
map, the panel, the search index and the tests pick it up automatically.

## Using it

- **Click** a station, a future line, or a demand bubble.
- **Search** stations, projects and areas; arrow keys and Enter work.
- **Deep links**: every selection updates the URL — `#node/fernvale-sengkang-west`, `#project/STL-SEL`, `#area/plab` — so a specific claim can be linked to directly.
- **Zoom** with the wheel, drag to pan; labels declutter themselves and reveal more detail as you zoom in.
- **Layers** can be toggled individually, so the speculative tiers can be switched off entirely.

## Honesty notes

- **Nothing here is government policy.** Sections 1–4 of the source analysis are
  sourced; the index, the forecasts and the speculative corridors are its
  author's own model. No LTA, MOT, URA or HDB endorsement is implied.
- **Station coordinates are approximate**, plotted for a schematic map rather
  than surveyed. Future stations marked *indicative* have no published site;
  those marked *model* have no official existence at all.
- **There is no coastline.** A hand-drawn outline would be guesswork presented as
  geography, so the land tint is derived from the rail network itself — the
  basemap can never claim more than the station data supports.
- **Probabilities are subjective** and unscored. When a deadline passes, score
  the set with the Brier score: the mean of (probability − outcome)², where 0.25
  is what always guessing 50% would get. [UPDATING.md](UPDATING.md) §5 says how
  to record an outcome without editing the original probability away.

## Licence

Code and data files: [MIT](LICENSE).

`docs/analysis-v2.0.md` is the source analysis this app renders, reproduced so
the repo is self-contained and its claims are checkable. Its findings cite 79
third-party sources, each linked and graded in the app; those sources remain the
property of their publishers.
