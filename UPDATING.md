# UPDATING.md — keeping the map current

Singapore's rail plans move. This file tells a future agent **when to check,
where to look, what to change, and how to prove the change is right.**

Read [AGENTS.md](AGENTS.md) first for the data model and the ground rules. The
most important of those rules applies doubly here: **when reality resolves a
guess, the guess must be replaced, not quietly relabelled.** Record what changed
in [`docs/updates.md`](docs/updates.md).

---

## 1. When to check

| Cadence | Event | Why it matters |
|---|---|---|
| **Every Feb–Mar** | MOT **Committee of Supply** debate | The single biggest annual source of rail announcements. COS 2025 revealed the Seletar and Tengah studies; COS 2026 named the first priority corridor and started engineering studies. |
| **Every Aug** | **National Day Rally** | Where large housing announcements land (Kranji's 14,000 homes, Sembawang's 10,000 came from NDR 2025). Housing drives the demand index. |
| **Rolling** | LTA news releases | Openings, delays, contract awards, infill stations. |
| **Rolling** | **GeBIZ** tenders | The earliest hard signal. The STL feasibility study (Contract S1006) appeared there in May 2026, before any alignment news. |
| **Annually** | **SingStat** population data | Refreshes `H` for every population-based area in the index. |
| **When published** | **URA Master Plan**, next **LTMP** | Redraws the housing pipeline and the government's own targets, which the whole model leans on. |

Dated checkpoints inherited from the analysis (section 10 of
[`docs/analysis-v2.0.md`](docs/analysis-v2.0.md)):

| By when | What resolves |
|---|---|
| 31 Dec 2026 | TEL5 / DTL3e opening (P01); RTS Link opening (P02) |
| Feb–Mar 2027 | COS: STL study progress, PLAB hints, next LTMP (P05, P06, P15) |
| 2027 | Award of STL feasibility contract S1006 — early signal for P06–P12 |
| Mid-2028 | JRL Stage 1 opening (P03) |
| 2030 | CRL Phase 1 opening (P04); PLAB interior rail announced? (P15) |
| 2032 | CRL Phase 2 and Punggol Extension; negative forecasts P19, P20, P22 |
| 2035 | DTL2e / Sungei Kadut; P16, P21 |
| 2039 / 2045 | STL and PLAB opening dates (P13, P14, P18) |

## 2. Where to look

Grade sources the way the analysis does, and prefer the highest grade available:
**A** primary government (LTA, MOT, URA, HDB, MND, SingStat, SG101) · **B**
established news or a strong transport reference (Land Transport Guru, SGTrains)
· **C** property and lifestyle media, Wikipedia · **D** unclear provenance, do
not rely on it alone.

### Grade A — primary

| Source | Use it for | Anchor URL |
|---|---|---|
| LTA rail expansion project pages | Official status and timing of each committed project | https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/thomson_east_coast_line.html |
| LTA news releases | Openings, delays, new stations. The Mar 2026 factsheet is the current baseline | https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/3/news-releases/next-phase-of-rail-development.html |
| MOT newsroom / COS speeches | Ministerial commitments and study progress | https://www.mot.gov.sg/news-resources/newsroom/ |
| MOT public transport (train) | Consolidated view of what is planned | https://www.mot.gov.sg/what-we-do/public-transport/train/ |
| LTMP 2040 | The targets the model tests against: 45-minute city, 20-minute towns, 8 in 10 households within a 10-minute walk | https://www.lta.gov.sg/content/ltaweb/en/about-lta/what-we-do/ltmp2040.html |
| URA Master Plan (PLAB page) | Housing yields, phasing, land use | https://www.ura.gov.sg/land-planning/master-plan/master-plan-2025/regional-plans/east/paya-lebar-air-base/ |
| SingStat Population Trends | Resident population by planning area | https://www.singstat.gov.sg/-/media/files/publications/population/population2025.pdf |
| MND / HDB newsroom | BTO launches, unit counts for new estates | https://mnd.gov.sg/newsroom |
| GeBIZ | Tenders for feasibility, design and civil contracts | https://www.gebiz.gov.sg/ |

### Grade B — reliable secondary, usually faster and more detailed

| Source | Use it for | Anchor URL |
|---|---|---|
| Land Transport Guru | Station-level detail, station lists, tender news | https://landtransportguru.net/ |
| SGTrains | Line and network pages, announcement analysis | https://www.sgtrains.com/ |
| SGTrains blog | Early reporting on extensions and studies | https://blog.sgtrains.com/ |
| citypopulation.de (republishes SingStat) | Subzone population, which SingStat's PDF makes hard to extract | https://www.citypopulation.de/en/singapore/admin/ |

### Search recipes

```
site:lta.gov.sg          "Seletar" OR "Tengah Line" alignment station
site:mot.gov.sg          "Committee of Supply" <year> rail
site:ura.gov.sg          "Paya Lebar Air Base" master plan
site:landtransportguru.net  <project name>
"Cross Island Line" Phase 3 station names          # Phase 3 names are still partly unpublished
"Seletar Line" station list announced
```

### Data the map would benefit from most

1. **Authoritative station coordinates.** Current positions are approximate. LTA's open-data station locations, or OneMap, would replace them wholesale — a strict improvement with no editorial cost.
2. **Published per-line peak load factors**, which would replace the weak grade-C basis for the crowding multiplier `C`.
3. **A GIS walking-distance check** on the three `[UNSOURCED]` proximity claims (Fernvale, Yishun East, Sembawang East). These drive `A = 0.5` for the areas ranked 2–4; confirming or overturning them is the highest-value single check in the model.

## 3. Before you change anything

1. Find the **primary** source, not the article about it. Note its grade.
2. Add it to `assets/js/data/sources.js` with the next free `S##` id.
3. Add a finding to `assets/js/data/findings.js` with the next free `F##` id, citing that source and stating its confidence.
4. Only then change the station, project or area, citing the new finding.

Evidence first, then the map. The provenance test compares the source register
against the vendored document, so **when you add sources beyond the document's
79, update the expectation in `test/app.test.js` §7 and say why in
`docs/updates.md`.** That friction is deliberate: it keeps additions traceable.

## 4. Playbooks

### 4.1 A station or line opens

In `future.js`, that project's `klass` stays until it is fully open; the opened
stations move into the right line in `network.js`, in station-code order, and
are removed from the future project (or the whole project is removed if it has
fully opened). Update the affected finding text. If a forecast rides on it
(P01–P04), resolve it — §5.

### 4.2 A project slips or is brought forward

Update `status`, `opens` and `confidence` on the project, and the finding that
states the timeline. If the slip changes when residents get rail relative to
when they arrive, revisit the `T` term of any area citing it — that is exactly
what `T` measures.

### 4.3 An STL alignment or station list is published

This is the big one, and the place where honesty is easiest to lose.

1. Record the announcement as a new source and finding.
2. **Replace** the modelled stations in `STL-SEL` / `STL-TEN` with the announced ones, at their announced positions, with `placement: 'sited'` or `'indicative'`. Do not keep a modelled station because it was "close".
3. Change the project `klass` from `study` to `committed`, and update `status`, `opens`, `confidence`. Remove the "under study" callout by virtue of the class change — it is driven by `klass`, not hand-written.
4. Resolve P06–P12 against what was actually announced (§5). **Forecasts that were wrong stay in the file, marked wrong.** The document's own section 8 corrects four v1.0 predictions; that record is the point.
5. Recheck every area whose `A` or `T` assumed no rail: Fernvale, Yishun East, Sembawang, Tengah.
6. Note in `docs/updates.md` which modelled guesses were right and which were not.

### 4.4 PLAB interior rail is announced

Same as 4.3 for the `PLAB` project, which is `klass: 'model'` and entirely this
analysis's inference. Resolve P15–P18. If rail arrives as an extension or branch
of an existing line, P17 was right; if as a new standalone line, it was wrong.

### 4.5 A new housing area is announced

Add the source and finding. If it is large enough to matter, add an area to
`areas.js` with a `homes` component, an honest `A` (how far is committed rail?)
and `T` (do homes or rail come first?), the next `rank`, and a `verdict`. Ranks
must stay unique and consistent with the document — if the new area outranks
existing ones, you are departing from the published table, so record that in
`docs/updates.md` and update the provenance expectations.

### 4.6 New population data lands

Update the `population` figures in `areas.js` and the F30–F47 findings. Nothing
else needs touching: `H` is computed, and the sensitivity view recomputes. Check
whether the ranking order moved; if it did, say so in `docs/updates.md`.

### 4.7 A new Land Transport Master Plan is published

Resolve P05. Re-read the targets in §7 of AGENTS.md — the 10-minute-walk and
45-minute-city targets are load-bearing for the PLAB argument (P16). If they
change, the argument changes with them.

## 5. Resolving a forecast

When a deadline passes or an event settles a forecast, add to that prediction in
`predictions.js`:

```js
outcome: 1,                       // 1 true, 0 false
resolved: '2026-12-31',
resolvedNote: 'TEL5 opened 2 Nov 2026; DTL3e same day.',
resolvedSources: ['S80']
```

Leave `p` untouched — the original probability is the thing being scored. Then
compute the **Brier score** over all resolved forecasts: the mean of
(probability − outcome)². Lower is better; 0.25 is what always guessing 50%
would score. Put the running score and the count in `docs/updates.md`.

A forecast that turned out wrong is not an embarrassment to be edited away. The
value of this repo is that it recorded a number before the answer was known.

## 6. After any change

```bash
npm test          # must pass; it checks provenance, not just syntax
```

Then the browser check in AGENTS.md §3, at desktop and phone width, if you
touched rendering. Then:

1. Append an entry to `docs/updates.md`: date, what changed, which sources, which forecasts resolved, whether the ranking moved.
2. Commit with a message that names the real-world event, not just the file.
3. Pushing to the default branch republishes the site automatically if the tests pass.
