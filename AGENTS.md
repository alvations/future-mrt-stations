# AGENTS.md — replicating and maintaining this repo

Written for an agent (or person) arriving at a fresh clone with no other
context. Read this before changing anything. For the separate question of *when
and how to update the map as Singapore's rail plans change*, see
**[UPDATING.md](UPDATING.md)**.

---

## 1. What this is

A static, dependency-free web app that maps Singapore's rail network in three
confidence tiers — open, committed, and speculative — and explains, for anything
you click, **why it is on the map**: the reasoning, numbered findings, and
graded sources behind it.

Everything it renders comes from one document, vendored at
[`docs/analysis-v2.0.md`](docs/analysis-v2.0.md):
*Where Singapore's Next MRT Lines Could Go*, v2.0, 16 September 2026 — 79
sources, 64 findings, a Demand Gap Index, and 22 dated probability forecasts.

**The split that matters.** Sections 1–4 of that document are sourced findings.
Sections 5–8 — the index, the forecasts, the speculative corridors — are its
author's own model. Nothing in this repo is LTA, MOT, URA or HDB policy, and the
app must never let a reader confuse the two.

## 2. Ground rules

These are not style preferences. Breaking them makes the app misleading.

1. **Never present a modelled station as an official one.** Every future station
   carries a `placement`: `sited` (location officially known), `indicative`
   (officially named, site not published), or `model` (this analysis's guess, no
   official existence). The panel renders a badge for each and a callout for
   `model`. If you add a station, you must set this field — a test enforces it.
2. **The Seletar–Tengah Line has no published alignment.** LTA named catchments
   and started engineering studies; it has not published a station list. Every
   STL station in `future.js` is `placement: 'model'`, and a test enforces that.
   If LTA publishes an alignment, see UPDATING.md §4.3 — do not quietly promote
   guesses to facts.
3. **Every claim carries its evidence.** A station's `why` is backed by `f`
   (finding ids) and `s` (source ids). Tests fail if any id does not resolve.
4. **No invented geography.** There is deliberately no coastline: a hand-drawn
   outline would be guesswork presented as fact. The land tint is derived from
   the rail routes themselves. Station coordinates are approximate and labelled
   as such in the UI. Do not add a coastline without a real data source.
5. **A model's answer is not evidence.** `research/` can run the research
   process with any model, but nothing it outputs may be written into the map
   data without going through UPDATING.md §3: find the primary source, add it to
   the register, add a finding, then cite it. A harness result is a signal about
   the model, never a citation.
6. **Don't silently "fix" the source document.** Where the document is internally
   inconsistent, show computed values and document the discrepancy (see §12).

## 3. Run and verify

Node 22. No dependencies, no build step.

```bash
npm test               # both suites: map data, then the research harness
npm test:app           # map and data only
npm run test:research  # harness only, no network
npm start              # serves at http://localhost:8080
npm run research:compare   # offline model-comparison run, no keys needed
```

`npm test` is pure Node and covers the model, every cross-reference, the route
geometry, and provenance against the vendored document. It does **not** open a
browser, so after any change to `app.js`, `geo.js`, the CSS or `index.html`,
also run the browser check:

```bash
npx --yes http-server -p 8099 -s . &
node - <<'EOF'
const { chromium } = require('playwright');   // or /opt/node22/lib/node_modules/playwright
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8099/index.html');
  await p.waitForTimeout(700);
  console.log(await p.evaluate(() => ({
    nodes: document.querySelectorAll('.node').length,      // expect 202
    routes: document.querySelectorAll('.route').length,    // expect 56
    bubbles: document.querySelectorAll('.bubble').length,  // expect 14
  })));
  await p.click('[data-node="fernvale-sengkang-west"]');
  await p.waitForTimeout(400);
  console.log(await p.evaluate(() => document.querySelector('#panel-head h2').textContent));
  await p.screenshot({ path: '/tmp/map.png' });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
EOF
```

Check the screenshot, not just the counts. Things that only show up visually:
label collisions, symbols scaling wrongly with zoom, the silhouette breaking up.
Test at 1440×900 **and** 390×844, in light and dark (`colorScheme` in
`newPage`), and zoom in four steps to confirm labels declutter rather than pile
up.

## 4. Layout

```
index.html                  app shell; loads every script in dependency order
assets/css/styles.css       all styling, themed with CSS custom properties
assets/js/data/sources.js   79 sources: id, title, publisher, date, grade A-D, url
assets/js/data/findings.js  64 findings F01-F64, each citing source ids
assets/js/data/network.js   7 operating lines, 175 station entries
assets/js/data/future.js    17 future projects and their stations  <- the heart
assets/js/data/areas.js     14 Demand Gap Index areas
assets/js/data/predictions.js  22 forecasts P01-P22
assets/js/geo.js            projection, route smoothing
assets/js/dgi.js            the index model, shared by browser and tests
assets/js/app.js            node merging, rendering, declutter, panel, routing
test/app.test.js            the map and data suite, no dependencies
test/research.test.js       the harness suite, no network
docs/analysis-v2.0.md       the source analysis this app renders
docs/updates.md             log of changes made to the data over time
research/                   model-agnostic harness for redoing the research
                            with any model - see research/README.md
```

Data files are UMD modules: the same file is a `<script>` in the browser and a
`require()` in the tests, with no build step. Keep that pattern — it is why the
tests can check the real data rather than a copy.

## 5. How the map is built

1. **Merge nodes.** `app.js` walks every line in `network.js` and every station
   in `future.js`, keying each by `lat.toFixed(4) + ',' + lon.toFixed(4)`.
   Stations at the same key become **one clickable place** that lists every role
   it plays. This is why Defu shows both the committed CRL station and the
   speculative PLAB corridor from a single dot. Reusing an exact coordinate is
   therefore meaningful: it declares "this is the same place".
2. **Class and placement.** A merged node takes the most speculative class
   present (`model` > `study` > `committed` > `existing`) and the most
   speculative placement. Stations marked `status: 'open'` are anchors: they give
   a route its geometry without upgrading the node's class.
3. **Draw routes.** Each project draws `route` (one path) or `routes` (several,
   for branches), resolving codes against its own stations plus `anchors` for
   points defined in another project. `geo.smoothPath` rounds the corners.
4. **Draw symbols.** Station dots, labels and demand bubbles are drawn inside the
   zoom transform but inverse-scaled, so they hold a constant size on screen.
5. **Declutter labels** (see §8) and render the panel for whatever is selected.

## 6. Data model

### A future project (`assets/js/data/future.js`)

| Field | Meaning |
|---|---|
| `id` | Stable slug used in URLs: `#project/CRL1` |
| `klass` | `committed` \| `study` \| `model` — drives line style and callouts |
| `status`, `opens`, `confidence` | Shown as chips in the panel |
| `summary` | One paragraph: what it is and why it matters |
| `stations[]` | See below; order is the route order |
| `route` / `routes` | Station codes to draw; `routes` for branching lines |
| `anchors` | `{code: [lat, lon]}` for route points defined in another project |
| `f`, `s`, `p` | Finding, source and prediction ids for the project as a whole |
| `dgi` | Optional demand-gap area id |

### A station

| Field | Meaning |
|---|---|
| `code`, `name`, `lat`, `lon` | Identity and approximate position |
| `placement` | `sited` \| `indicative` \| `model` — **required** unless `status: 'open'` |
| `status` | `'open'` marks an existing station used only as a route anchor |
| `why` | Plain-language reason this station is on the map, in the panel |
| `f`, `s`, `p`, `dgi` | Evidence and links, same meaning as above |

### A demand-gap area (`areas.js`)

`components[]` each have a `kind`: `population` (H scales with the
residents-per-home assumption), `homes` (an announced unit count in thousands),
or `stated` (a fixed figure taken from the document's table). Plus `A`, `T`, `C`
per component, and `rank`, `docDGI`, `verdict` (`gap` or `covered`), `note` (the
one-line summary in list views), `inputs` (why those numbers), `why` (the
argument).

### Findings, sources, forecasts

Findings cite source ids; forecasts cite finding ids; stations and areas cite
all three. Every id must resolve or the suite fails.

## 7. The Demand Gap Index

```
DGI = Σ over components of  H × A × T × C
```

- **H** — homes needing service, thousands. `population ÷ (residentsPerHome × 1000)`, or an announced count.
- **A** — access gap 0–1: share *not* within a 10-minute walk of existing or committed rail. Bands: 0.2 station inside, 0.5 edge or LRT feeder only, 0.85 large site with an edge station only, 1.0 nothing.
- **T** — timing gap 0–1: 0.25 rail arrives well before residents, 0.5 together, 1.0 residents years ahead of rail.
- **C** — crowding: 1.5 where LTA has intervened, 1.2 where independent load data flags it, else 1.0.

`dgi.score(area, {residentsPerHome, crowding})` and `dgi.rank(areas, opts)`
reproduce the document's table and its sensitivity tests. The tests assert all
fourteen published scores and the sensitivity conclusions.

## 8. Rendering internals worth knowing

- **Projection.** `geo.js` uses equirectangular with a `cos(lat)` correction, mapped into a fixed viewBox. `geo.px(lat, lon)` is the only conversion.
- **Symbol scaling.** Everything symbolic is drawn at `scale(sym / k)` where `k` is zoom and `sym = REF / viewportRatio()`. Without the `sym` term, labels become unreadable on a phone, because the same viewBox maps to far fewer pixels. If you add a symbol, inverse-scale it the same way.
- **Label decluttering.** `relabel()` runs a greedy pass in transformed viewBox space: entries sorted by priority (model/study 5, bubbles 4, committed 3, interchange 1, plain station 0), each placing a box if it does not overlap an already-placed one, and every dot reserving its own space. Tiers appear at zoom thresholds scaled by `sym`, so a phone shows fewer tiers. Label widths are *estimated* from character count — if you change the font, retune the multiplier in `n.labelW`.
- **Pointer capture is a trap.** Capturing the pointer on `pointerdown` retargets the following `click` to the `<svg>`, so stations stop responding. Capture is taken only once a drag passes a 3px threshold, and `nodeFromEvent` resolves via `document.elementFromPoint` as a fallback. Do not "simplify" this.
- **Route halos** (`.route.halo`) and existing routes are `pointer-events: none`, or they swallow clicks meant for stations.
- **Routing.** Selections write `#node/<slug>`, `#project/<id>`, `#area/<id>`. Node slugs come from the merged node's primary name, deduplicated. An unknown route falls back to the index.
- **Theme.** Dark by default, light under `prefers-color-scheme`, overridden by `data-theme` on `<html>` and remembered in `localStorage`.

## 9. Invariants the tests enforce

1. The index reproduces all fourteen published scores, and the published sensitivity conclusions.
2. Every finding, source, prediction and area id referenced anywhere resolves.
3. Every forecast is reachable from something on the map (P05 excepted — it is a process forecast about a master plan, with no location).
4. Every drawn route has coordinates for all of its codes.
5. Every coordinate lies within the Singapore bounding box.
6. Every future station declares a `placement` unless it is an open anchor; both STL arms are entirely `model`.
7. Sources, forecast probabilities and deadlines, and the fourteen index scores all match the vendored document exactly.

## 10. Adding things

**A station on an existing project:** add an object to that project's
`stations[]` in route order, add its `code` to `route`/`routes`, and give it
`placement`, `why`, `f`, `s`. Run `npm test`. The map, panel, search and deep
links pick it up automatically.

**A new project:** copy the shape of `DTL2E` (simple) or `JRL23` (branching,
with `anchors`). Pick a `klass` honestly. Add a legend entry only if it
introduces a new tier.

**A demand-gap area:** add to `areas.js` with `components`, `rank`, `docDGI`,
`verdict`, `note`, `inputs`, `why`, and evidence ids. Ranks must stay unique and
match the document, or the provenance test fails.

**A forecast:** add to `predictions.js` and cite it from at least one station,
project or area — or add it to `NETWORK_WIDE` in the test with a reason.

## 11. Deployment

`.github/workflows/pages.yml` runs the tests on every push to the default branch
and publishes to GitHub Pages only if they pass. `ci.yml` runs the tests for
every branch and PR. The live site is
https://alvations.github.io/future-mrt-stations/ . The site is path-relative, so
it works from any base path.

## 12. Reproducing the research with another model

`research/` re-runs the six components of the process that produced the analysis
— source discovery, appraisal, citation attribution, quantitative reasoning,
self-correction and forecasting — against any model, scored identically. Claude
is one entry in `research/models.json`; a local Llama or Qwen is another. See
`research/README.md` to run it and `research/process.md` for the specification.

It exists because a research output that only holds when one particular model
produces it is worth knowing about. It is tooling, not map data: see ground
rule 5.

## 13. Decisions and known issues

- **The document's own sensitivity table does not reproduce for Sembawang.** It prints 14.8 and 14.3 at 2.5 and 3.5 residents per home; recomputing from its stated inputs gives 15.5 and 13.8. Its conclusions hold, so the app shows computed values and the tests assert the conclusions rather than those two cells.
- **Station coordinates are approximate**, entered from knowledge of the network rather than a survey. Line topology and station order are reliable; positions are within a few hundred metres. Replacing them with an authoritative dataset would be a strict improvement — see UPDATING.md §2.
- **Three proximity claims are unsourced** in the document itself and inherited here: that Fernvale, Yishun East and Sembawang East have no station inside them. They are marked `[UNSOURCED]` in the document and drive `A = 0.5` for three areas. A GIS check would firm up or overturn ranks 2–4.
- **Crowding inputs are thin.** `C` rests on LTA's interventions (strong) and one independent analysis (weak, grade C). Published per-line load factors would replace both.
