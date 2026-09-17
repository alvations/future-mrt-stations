# Where Singapore's Next MRT Lines Could Go: Research Log, Data Model and Predictions

**Version:** 2.0 (supersedes v1.0)
**Compiled:** 16 September 2026
**Author of analysis:** Claude (AI). Sections 1–4 are sourced. Sections 5–8 are the author's own model and forecasts, **not** LTA, MOT, URA or HDB policy.

**What changed in v2.0**
- Source base expanded from 34 to 79 sources, including official population data (Singapore Department of Statistics via citypopulation.de), NEL crowding evidence, verified station lists and verified rail timelines.
- Replaced the subjective 1–5 scoring with a **reproducible Demand Gap Index (DGI)** with a stated formula, inputs and sensitivity test.
- Added **explicit, dated, falsifiable probability forecasts** calibrated against historical LTA lead times and delays.
- **Four v1.0 predictions were wrong or weakened** once station lists were verified. See Section 8.

---

## Contents

1. Method
2. Source register
3. Findings: network, pipeline and plans
4. Findings: population, housing and crowding data
5. The Demand Gap Index model
6. Base rates for timing
7. Predictions with probabilities
8. Corrections to v1.0
9. Assumptions and limitations
10. Verification calendar

---

## 1. Method

1. **Network baseline.** Record open lines and verify the committed pipeline down to station level.
2. **Demand baseline.** Pull resident population by planning area and subzone for June 2020 and June 2025 to find where people are actually being added.
3. **Future demand.** Record every major announced housing area with unit counts and expected timing.
4. **Proximity check.** For each growth area, verify whether an existing or committed station sits on or next to it.
5. **Score.** Compute a Demand Gap Index for each area (Section 5). Higher = bigger unmet rail need.
6. **Calibrate timing.** Use historical announcement-to-opening lead times and delay rates (Section 6).
7. **Forecast.** Convert the ranked gaps into dated, falsifiable probability statements (Section 7).

### Source grades

| Grade | Meaning |
|---|---|
| A | Primary government source (LTA, MOT, URA, HDB, MND, SingStat, SG101) |
| B | Established news outlet, or dedicated transport reference with a strong accuracy record (Land Transport Guru, SGTrains), or a reliable republisher of official data |
| C | Property/lifestyle media, Wikipedia, blogs; cross-check before relying on |
| D | Low-quality or unclear provenance; unverified unless corroborated |

### Evidence labels used throughout

- **[Fxx]** = a numbered finding in Sections 3–4, traceable to sources.
- **[Axx]** = an explicit assumption (Section 9).
- **[UNSOURCED]** = from general knowledge, not verified in this research.

---

## 2. Source Register

### 2.1 Carried over from v1.0

| ID | Source | Publisher | Date | Grade | URL |
|---|---|---|---|---|---|
| S01 | Circle Line 6 project page | LTA | ~Sep 2026 | A | https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/circle_line_6.html |
| S02 | Singapore MRT 2026 guide | singaporemrt.org | 14 Jul 2026 | C | https://singaporemrt.org/ |
| S03 | Singapore MRT Map 2026 | singaporemrt.org | 2026 | C | https://singaporemrt.org/mrt-map/ |
| S04 | Singapore MRT Map 2026 guide | Trip.com | 21 Jul 2026 | C | https://sg.trip.com/guide/transport/singapore-mrt-map.html |
| S05 | What Our MRT System Could Look Like In 10 Years | TheSmartLocal | 30 Apr 2026 | C | https://thesmartlocal.com/read/mrt-network-future/ |
| S06 | Singapore MRT Line Extensions 2026 | AcademicJobs | 16 May 2026 | D | https://www.academicjobs.com/global-news/singapore-mrt-line-extensions-2026-key-plans-and-updates-20001 |
| S07 | Three new MRT stations will connect the DTL to the NSL | Time Out Singapore | 2025 | C | https://www.timeout.com/singapore/news/three-new-mrt-stations-will-connect-the-downtown-line-to-the-north-south-line-in-the-west-of-singapore-010625 |
| S08 | Potential new Tengah and Seletar MRT lines | Time Out Singapore | 2025 | C | https://www.timeout.com/singapore/news/potential-new-tengah-and-seletar-mrt-lines-to-be-operational-in-the-2040s-030625 |
| S09 | Seletar, Tengah MRT lines being studied | SGTrains blog | 8 Mar 2025 | B | https://blog.sgtrains.com/2025/03/seletar-tengah-mrt-lines-being-studied-could-be-combined-into-a-single-line-and-opened-from-2040s/ |
| S10 | Everything We Know About the Seletar & Tengah Lines | TheSmartLocal | 26 May 2026 | C | https://thesmartlocal.com/read/upcoming-seletar-tengah-mrt-lines/ |
| S11 | Seletar Line reference page | Land Transport Guru | 6 May 2026 | B | https://landtransportguru.net/train/sll/ |
| S12 | Expanding our Rail Network (COS 2025) | LTA | 5 Mar 2025 | A | https://www.lta.gov.sg/content/ltagov/en/newsroom/2025/3/news-releases/expanding_our_rail_network_and_strengthening_rail_reliability.html |
| S13 | Tender for Feasibility Studies launched for the STL | Land Transport Guru | 9 May 2026 | B | https://landtransportguru.net/stl-feasibility-study-tender-launched/ |
| S14 | Two new MRT lines under study | STOMP | 5 Mar 2025 | B | https://www.stomp.sg/trending-now/two-new-mrt-lines-tentatively-called-tengah-and-seletar-under-study |
| S15 | New MRT Plans Revealed: Tengah & Seletar Lines | Stacked Homes | 7 Jan 2026 | C | https://stackedhomes.com/new-mrt-plans-revealed-how-tengah-amp-seletar-lines-may-boost-northern-homes/ |
| S16 | Greater Southern Waterfront | Wikipedia | n/a | C | https://en.wikipedia.org/wiki/Greater_Southern_Waterfront |
| S17 | COS 2025 Rail Expansion summary | Land Transport Guru | 5 Mar 2025 | B | https://landtransportguru.net/cos-2025-rail-expansion/ |
| S18 | Speech by Acting Minister Jeffrey Siow, COS 2026 | MOT | Mar 2026 | A | https://www.mot.gov.sg/news-resources/newsroom/speech-by-acting-minister-for-transport-mr-jeffrey-siow-at-ministry-of-transport-s-committee-of-supply-debate-2026/ |
| S19 | Train (public transport overview) | MOT | ~Aug 2026 | A | https://www.mot.gov.sg/what-we-do/public-transport/train/ |
| S20 | Factsheet: The Next Phase of Rail Development | LTA | 4 Mar 2026 | A | https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/3/news-releases/next-phase-of-rail-development.html |
| S21 | 2 new MRT lines serving Tengah & Seletar being studied | Mothership | Mar 2025 | B | https://mothership.sg/2025/03/tengah-seletar-lines/ |
| S22 | Singapore LTA announces network update | Tunnelling Journal | 6 Mar 2026 | B | https://tunnellingjournal.com/singapore-lta-announces-network-update/ |
| S23 | Cross Island Line | Wikipedia | n/a | C | https://en.wikipedia.org/wiki/Cross_Island_Line |
| S24 | URA's Draft Master Plan 2025 | ERA | 26 Aug 2025 | C | https://www.era.com.sg/ura-draft-master-plan-2025/ |
| S25 | New housing areas in Dover, Defu, Newton and Paterson | Yahoo News SG | 25 Jun 2025 | B | https://sg.news.yahoo.com/housing-areas-dover-defu-newton-023000966.html |
| S26 | URA Master Plan 2025: 80,000 New Homes | Uchify | 14 Jul 2025 | C | https://uchify.com/ura-master-plan-2025/ |
| S27 | Draft Master Plan 2025 blueprint | PropNex | 2025 | C | https://www.propnex.com/news-details/10631/forward-looking-draft-master-plan-2025-lays-out-government-s-blueprint-to-inject-more-homes-in-new-areas-as-well-as-enhance-vibrancy-and-livability |
| S28 | URA DMP2025: New Housing Clusters | Darren Ong | 26 Aug 2025 | C | https://darrenong.sg/blog/singapore-ura-draft-master-plan-2025-new-housing-clusters-land-rezoning-key-transformation-areas-announced/ |
| S29 | URA's DMP2025: 80,000 New Homes | Jayson Ang | 2026 | C | https://jaysonang.com/2026/04/23/uras-draft-master-plan-2025-a-blueprint-for-80000-new-homes-across-10-estates/?bdpp_page=6 |
| S30 | URA Master Plan 2025: Key Updates | SG Luxury Condo | ~Sep 2026 | C | https://sgluxurycondo.com/ura-draft-master-plan-2025-key-updates-new-neighbourhoods-investment-opportunities/ |
| S31 | Sungei Bedok MRT Station | Land Transport Guru | n/a | B | https://landtransportguru.net/sungei-bedok-station/ |
| S32 | Bedok South MRT Station | Land Transport Guru | n/a | B | https://landtransportguru.net/bedok-south-station/ |
| S33 | Better connectivity for East Region | EdgeProp | 2024 | B | https://www.edgeprop.sg/property-news/better-connectivity-new-housing-estates-power-east-regions-transformation |
| S34 | LTA puts TEL4 into operation | Trackopedia | 2024 | C | https://trackopedia.com/en/news/asia/lta-puts-tel4-into-operation |

### 2.2 New in v2.0

| ID | Source | Publisher | Date | Grade | URL |
|---|---|---|---|---|---|
| S35 | Thomson–East Coast Line | Wikipedia | Jun 2026 | C | https://en.wikipedia.org/wiki/Thomson%E2%80%93East_Coast_MRT_line |
| S36 | Thomson-East Coast Line network page | SGTrains | n/a | B | https://www.sgtrains.com/network-tel.html |
| S37 | Thomson-East Coast Line | Land Transport Guru | 10 Jul 2026 | B | https://landtransportguru.net/train/tel/ |
| S38 | Thomson-East Coast Line project page | LTA | n/a | A | https://www.lta.gov.sg/content/ltagov/en/upcoming_projects/rail_expansion/thomson_east_coast_line.html |
| S39 | Bedok South MRT opens 2H 2026 | bayshore.sg | 28 Mar 2026 | C | https://bayshore.sg/guides/bedok-south-mrt-bayshore-2026/ |
| S40 | Jurong Region Line network page | SGTrains | n/a | B | https://www.sgtrains.com/network-jrl.html |
| S41 | JRL Stage 1 opening delayed to mid-2028 | The Online Citizen | 4 Mar 2026 | C | https://theonlinecitizen.com/2026/03/04/jurong-region-line-stage-1-opening-delayed-to-mid-2028 |
| S42 | Jurong Region Line | Land Transport Guru | 5 Mar 2026 | B | https://landtransportguru.net/train/jrl/ |
| S43 | Jurong Region Line | Wikipedia | n/a | C | https://en.wikipedia.org/wiki/Jurong_Region_Line |
| S44 | Cross Island Line Phase 1 to open in 2029 | Land Transport Guru | 26 Jan 2019 | B | https://landtransportguru.net/cross-island-line-phase-1-to-open-in-2029/ |
| S45 | Cross Island Line guide | TheSmartLocal | 2026 | C | https://thesmartlocal.com/read/cross-island-line-mrt-singapore/ |
| S46 | Future Cross Island Line stations revealed | Land Transport Guru | 2021 (updated) | B | https://landtransportguru.net/future-cross-island-line-stations-revealed-in-lta-exhibition/ |
| S47 | LTA awards two civil contracts for CRL1 | Tunnelling Journal | n/a | B | https://tunnellingjournal.com/?p=21501 |
| S48 | Cross Island Line 1 graphic | The Straits Times | 26 Jan 2019 | B | https://static1.straitstimes.com.sg/s3fs-public/attachments/2019/01/26/ST_20190126_CTANALYSIS26_4580873.pdf |
| S49 | Paya Lebar Air Base (Master Plan 2025) | URA | 29 Jul 2026 | A | https://www.ura.gov.sg/land-planning/master-plan/master-plan-2025/regional-plans/east/paya-lebar-air-base/ |
| S50 | Singapore's Paya Lebar Could Host 150k New Homes | Mingtiandi | 23 Aug 2022 | B | https://www.mingtiandi.com/real-estate/research-policy/redevelopment-of-singapores-paya-lebar-could-create-150000-new-homes/ |
| S51 | Paya Lebar Air Base will turn into 150,000 new homes | Uchify | 22 Aug 2022 | C | https://uchify.com/paya-lebar-air-base-redevelopment/ |
| S52 | A Guide: Paya Lebar Airbase Redevelopment Plans | Ohmyhome | 7 May 2024 | C | https://ohmyhome.com/en-sg/blog/a-guide-to-the-paya-lebar-airbase-redevelopment-plans-part-1/ |
| S53 | Population Trends 2025 | SingStat | 2025 | A | https://www.singstat.gov.sg/-/media/files/publications/population/population2025.pdf |
| S54 | Singapore: Planning Areas and Subzones (population table, source: SingStat) | citypopulation.de | 2026 | B | https://www.citypopulation.de/en/singapore/admin/ |
| S55 | Written reply: peak-hour frequency on NEL | MOT | 2025 | A | https://www.mot.gov.sg/news/details/written-reply-to-parliamentary-question-on-expected-increase-in-peak-hour-train-frequency-on-north-east-line-with-progressive-addition-of-six-new-trains |
| S56 | 8% of NEL commuters shifted out of peak after free off-peak rides | Mothership | Mar 2026 | B | https://mothership.sg/2026/03/northeast-line-free-off-peak-rides/ |
| S57 | Deep dive of Singapore's rail network passenger loads | Medium (Tan Yi Jie) | 21 Jan 2026 | C | https://medium.com/@simpletan/deep-dive-of-singapores-rail-network-passenger-loads-e331d3b9626b |
| S58 | Tengah #OurNeighbourhood | SG101 (Government) | n/a | A | https://www.sg101.gov.sg/resources/archives/tengah/ |
| S59 | Chencharu housing area to yield 10,000 new homes | EdgeProp | Jun 2024 | B | https://www.edgeprop.sg/property-news/chencharu-housing-area-yishun-yield-10000-new-homes-first-bto-project-launch-month |
| S60 | Sungei Kadut MRT station | Wikipedia | n/a | C | https://en.wikipedia.org/wiki/Sungei_Kadut_MRT_station |
| S61 | DTL will extend to interchange with NSL at Sungei Kadut | SGTrains blog | Jan 2025 | B | https://blog.sgtrains.com/2025/01/dtl2e-announcement/ |
| S62 | 2 new stations for DTL Stage 2 Extension | Land Transport Guru | Jan 2025 | B | https://landtransportguru.net/2-new-stations-for-downtown-line-stage-2-extension/ |
| S63 | RTS Link Singapore–JB (2026) | you.co | 2026 | C | https://www.you.co/sg/blog/rts-link/ |
| S64 | RTS Link first train demo at Woodlands North | Malay Mail | 5 Feb 2026 | B | https://www.malaymail.com/amp/news/malaysia/2026/02/05/singapore-johor-rts-link-first-train-demo-completed-at-woodlands-north-station/208180 |
| S65 | RTS Link | Land Transport Guru | n/a | B | https://landtransportguru.net/train/rts-link/ |
| S66 | 6,000 HDB flats to be built in GSW | Home & Decor | Apr 2022 | C | https://www.homeanddecor.com.sg/property/6000-hdb-flats-to-be-built-in-greater-southern-waterfront-first-bto-project-within-3-years |
| S67 | Media statement on Keppel Club site | MND | Apr 2022 | A | https://mnd.gov.sg/newsroom/speeches/view/media-statement-by-minister-desmond-lee-on-the-housing-development-plans-for-the-keppel-club-site-and-launch-of-labrador-nature-park-network |
| S68 | First BTO at GSW October 2025 | 99.co | 2025 | C | https://www.99.co/singapore/insider/first-bto-greater-southern-waterfront-october-2025/ |
| S69 | Kranji Racecourse | Wikipedia (citing Straits Times) | n/a | C | https://en.wikipedia.org/wiki/Kranji_Racecourse |
| S70 | NDR 2025 housing updates | 99.co | Aug 2025 | C | https://www.99.co/singapore/insider/ndr-2025-housing-updates/ |
| S71 | NDR 2025: 14,000 homes in Kranji, 10,000 in Sembawang | Uchify | 18 Aug 2025 | C | https://uchify.com/national-day-rally-2025-updates/ |
| S72 | LTMP 2040 Infographic | LTA | 2019 | A | https://www.lta.gov.sg/content/dam/ltagov/who_we_are/our_work/land_transport_master_plan_2040/pdf/LTA%20LTMP%202040%20Infographic%201.pdf |
| S73 | Land Transport Master Plan 2040 page | LTA | n/a | A | https://www.lta.gov.sg/content/ltaweb/en/about-lta/what-we-do/ltmp2040.html |
| S74 | Launch of the LTMP 2040 conversation | LTA | 2018 | A | https://lta.gov.sg/content/ltagov/en/newsroom/2018/9/2/launch-of-the-land-transport-master-plan-2040-conversation.html |
| S75 | Singapore's LTA announces 2040 transport Master Plan | Intelligent Transport | 4 Jun 2019 | B | https://www.intelligenttransport.com/?p=81321 |
| S76 | URA Master Plan 2025 neighbourhoods | PropertyNet.SG | 13 Aug 2026 | C | https://propertynet.sg/ura-master-plan-2025-neighbourhoods-transform-2030/ |
| S77 | Paya Lebar Air Base | Wikipedia | n/a | C | https://en.wikipedia.org/wiki/Paya_Lebar_Air_Base |
| S78 | Homes at Kranji Racecourse redevelopment | Home & Decor | Aug 2025 | C | https://www.homeanddecor.com.sg/property/hdb/kranji-racecourse-redevelopment |
| S79 | Paya Lebar Air Base Property Guide | ShiokNest | May 2026 | D | https://shioknest.com/guides/paya-lebar-air-base-property-guide?lang=en |

---

## 3. Findings: Network, Pipeline and Plans

### 3.1 Current network (September 2026)

| # | Finding | Sources | Confidence |
|---|---|---|---|
| F01 | 6 MRT lines + 3 LRT systems; 246.6 km; 146 MRT stations; ~3.5 million rides/day | S02, S03 | Medium |
| F02 | CCL6 opened 12 July 2026 (Keppel, Cantonment, Prince Edward Road); CCL is now a 33-station loop | S01, S03 | High |
| F03 | TEL5 (Bedok South, Sungei Bedok) and DTL3e (Xilin, Sungei Bedok) are scheduled for 2H 2026; as of the latest retrieved pages they were **not yet in service** | S35, S36, S37, S38 | High |
| F04 | Bedok South and Sungei Bedok must open together because they share a fire protection system with the DTL interchange | S39 | Medium |
| F05 | TEL5 has slipped from 2024 → 2025 → 2026 → 2H 2026 | S31, S32, S37 | High |
| F06 | Founders' Memorial TEL station due 2028; TEL extension to Changi T5 and Tanah Merah mid-2030s | S35, S37 | High |

### 3.2 Committed pipeline (verified)

| # | Project | Detail | Timing | Sources | Confidence |
|---|---|---|---|---|---|
| F07 | JRL Stage 1 | 10 stations, Choa Chu Kang–Boon Lay–Tawas; delayed ~6 months | Mid-2028 (was end-2027) | S20, S40, S42 | **High (now LTA-confirmed; resolves v1.0 conflict)** |
| F08 | JRL Stages 2 and 3 | Timelines under review (previously 2028 and 2029) | TBC | S41, S43 | Medium-High |
| F09 | JRL infill JS2A | Serves Forest Hill district of Tengah | Mid-2030s | S40, S42 | High |
| F10 | JRL West Coast Extension | Pandan Reservoir → West Coast (CRL), then Kent Ridge (CCL) | Late 2030s / early 2040s | S19, S43 | High |
| F11 | CRL Phase 1 | 12 stations: Aviation Park, Loyang, Pasir Ris East, Pasir Ris, Tampines North, **Defu**, Hougang, **Serangoon North**, Tavistock, Ang Mo Kio, Teck Ghee, Bright Hill | 2030 (originally 2029) | S20, S44, S47, S48 | High |
| F12 | CRL Phase 2 | 6 stations: **Turf City**, King Albert Park, Maju, Clementi, West Coast, Jurong Lake District | 2032 | S20, S45, S46 | High |
| F13 | CRL Punggol Extension | Pasir Ris, Elias, Riviera, Punggol | 2032 | S20, S45 | High |
| F14 | CRL Phase 3 | 4 stations west from JLD to Gul Circle (EWL), including a JRL interchange at Jurong Pier; serves Jurong Industrial Estate and Taman Jurong | Construction from 2027; open late 2030s | S20, S45 | High |
| F15 | DTL2e | DE1 (Sungei Kadut Avenue, near Yew Tee Village) and DE2/NS6 Sungei Kadut interchange between Yew Tee and Kranji | 2035 | S60, S61, S62 | High |
| F16 | Brickland NSL station | Serves Keat Hong, Bukit Batok West, Pavilion Park, Tengah Brickland | Mid-2030s | S05, S75 | High |
| F17 | RTS Link | Woodlands North–Bukit Chagar, 4 km, 10,000 pax/hour/direction; first train demo Feb 2026; target end-2026, some reports flag possible slip to early 2027 | End-2026 | S63, S64, S65 | Medium-High |
| F18 | CRL long-term ridership | Projected >1 million daily trips | Long term | S23, S48 | Medium |

### 3.3 Seletar–Tengah Line (STL) status

| # | Finding | Sources | Confidence |
|---|---|---|---|
| F19 | Seletar Line catchments: Woodlands, Sembawang, Sengkang West, Serangoon North, Whampoa, Kallang, Greater Southern Waterfront | S12, S19 | High |
| F20 | Tengah Line catchments: Tengah, Bukit Batok, Queensway, Bukit Merah | S12, S19 | High |
| F21 | Both may meet at GSW and may be merged into one line | S12, S13 | High |
| F22 | If feasible, opens in phases from the 2040s; >400,000 households within a 10-minute walk | S14, S19 | High |
| F23 | COS 2026: engineering studies start 2026; first priority corridor serves Sengkang West and Serangoon North, possibly connecting to CRL and CCL | S18, S20 | High |
| F24 | GeBIZ tender for STL engineering feasibility study (Contract S1006) posted 4 May 2026 | S11, S13 | Medium-High |
| F25 | Minister hoped the line might also pass parts of Toa Payoh (remark, not commitment) | S14 | High |
| F26 | LTMP 2040 rationale: relieve north-east demand; cut some commutes by up to 40 minutes | S14 | High |

### 3.4 Planning targets that constrain LTA's choices

| # | Finding | Sources | Confidence |
|---|---|---|---|
| F27 | LTMP 2040 targets: 20-minute towns; 45-minute city (9 in 10 peak journeys under 45 minutes); 9 in 10 peak journeys on public, active or shared transport | S72 | High |
| F28 | Target of 8 in 10 households within a 10-minute walk of a station by the 2030s | S19, S74 | High |
| F29 | LTA says public engagement for the **next** LTMP will begin soon; details to be published later | S73 | High |

---

## 4. Findings: Population, Housing and Crowding Data

### 4.1 Resident population by growth area, June 2020 vs June 2025

All figures from SingStat as tabulated by citypopulation.de [S54]. National resident population was 4,204,520 in 2025 [S54]; SingStat confirms Tampines as the most populous planning area at 290,090 [S53].

| # | Area (planning area / subzone) | 2020 | 2025 | Change | Rail status (verified) |
|---|---|---|---|---|---|
| F30 | **Tampines** (PA) | 259,900 | 290,090 | +30,190 | EWL, DTL; CRL 2030 |
| F31 | ↳ Tampines North (SZ) | 8,040 | 36,160 | +28,120 | CRL Tampines North 2030 [F11] |
| F32 | **Punggol** (PA) | 174,450 | 204,150 | +29,700 | NEL + LRT; CRL Punggol Ext. 2032 [F13] |
| F33 | **Tengah** (PA) | 10 | 22,960 | +22,950 | Buses only until JRL mid-2028 [F07] |
| F34 | **Toa Payoh** (PA) | 121,850 | 142,220 | +20,370 | NSL, NEL (Woodleigh), CCL |
| F35 | ↳ Sennett (SZ) / Bidadari (SZ) | 7,190 / 0 | 17,490 / 9,120 | +19,420 | Near NEL Woodleigh/Potong Pasir **[UNSOURCED proximity]** |
| F36 | **Sengkang** (PA) | 249,370 | 267,600 | +18,230 | NEL + LRT |
| F37 | ↳ **Fernvale** (SZ) | 58,800 | 71,200 | +12,400 | **LRT only** **[UNSOURCED: no MRT station inside subzone]** |
| F38 | **Clementi** (PA) | 91,990 | 104,240 | +12,250 | EWL; CRL2 2032 |
| F39 | **Sembawang** (PA) | 102,640 | 113,350 | +10,710 | NSL only |
| F40 | ↳ Sembawang East (SZ) | 17,340 | 24,620 | +7,280 | **[UNSOURCED: no station inside subzone]** |
| F41 | **Yishun** (PA) | 221,610 | 228,730 | +7,120 | NSL (Yishun, Khatib) |
| F42 | ↳ **Yishun East** (SZ) | 60,670 | 73,440 | +12,770 | **[UNSOURCED: no station inside subzone]** |
| F43 | **Bukit Batok** (PA) | 158,030 | 165,830 | +7,800 | NSL; Brickland mid-2030s |
| F44 | ↳ Brickworks (SZ) | 19,820 | 30,920 | +11,100 | Brickland NSL mid-2030s [F16] |
| F45 | **Queenstown** (PA) | 95,930 | 101,480 | +5,550 | EWL, CCL, TEL (Margaret Drive SZ 24,010) |
| F46 | **Kallang** ↳ Bendemeer (SZ) | 37,570 | 38,070 | +500 | DTL (Bendemeer) **[UNSOURCED proximity]**; STL catchment [F19] |
| F47 | Declining for comparison: Bedok (−2,630), Jurong West (−8,890), Ang Mo Kio (−3,560), Woodlands (−690) | — | — | — | Mature towns |

**Pattern:** Population growth is concentrated in the north-east (Punggol, Sengkang/Fernvale, Tampines North), north (Yishun East, Sembawang East) and west (Tengah, Brickworks). Mature towns are flat or shrinking.

### 4.2 Future housing pipeline with verified rail proximity

| # | Area | Homes | Timing | Nearest committed rail (verified) | Sources |
|---|---|---|---|---|---|
| F48 | **Paya Lebar Air Base** | Up to 150,000 on ~800 ha; comparable to Sengkang + Punggol combined | Relocation from 2030s; development over 2–3 decades | CRL Defu on the edge only [F11]; **no interior station announced** | S49, S50, S51, S52 |
| F49 | Defu (first PLAB phase) | Part of above | As industrial leases expire | CRL Defu [F11] | S24, S25 |
| F50 | Tengah | 42,000 (≈¾ of Punggol) | Ongoing | JRL mid-2028; JS2A mid-2030s; Brickland NSL | S58, F07, F09, F16 |
| F51 | Bukit Timah Turf City | 15,000–20,000 | Long term | **CRL2 Turf City station, 2032** [F12] | S28, S45, S46 |
| F52 | Kranji former racecourse | ~14,000 on ~124–130 ha | First homes ~2035; detailed planning from 2026 | **Adjacent to Kranji NSL (sheltered walkway)**; Sungei Kadut interchange 2035 | S69, S70, S78 |
| F53 | Sembawang Shipyard | ~10,000 waterfront homes (secondary source) | Shipyard relocates by 2028 | NSL Sembawang **[UNSOURCED distance]**; STL catchment [F19] | S70, S71, S24 |
| F54 | Chencharu (Yishun) | ~10,000 by 2040 on 70 ha | By 2040 | **Integrates existing Khatib NSL station** | S59 |
| F55 | Bayshore | ~10,000–12,500 | Ongoing | TEL Bayshore (open) | S76 |
| F56 | GSW Keppel Club | ~9,000 (6,000 HDB); first BTO Oct 2025 | Ongoing | CCL Labrador Park and Telok Blangah, linked by trails | S66, S67, S68 |
| F57 | Dover–Medway | ~6,000 (Phase 1) | From late 2025 | CCL one-north / Kent Ridge | S27 |
| F58 | Mediapolis / Newton / Paterson | ~5,000 / ~5,000 / ~1,000 | Medium term | Existing CCL / NSL-DTL / Orchard | S27 |
| F59 | Woodlands "Housing by the Woods" | ~4,000 | Ongoing | Woodlands area stations **[UNSOURCED which]** | S70 |

### 4.3 Crowding and demand signals

| # | Finding | Sources | Confidence |
|---|---|---|---|
| F60 | NEL can now run up to 42 trains (was 36) after Punggol Coast and new trains | S55 | High |
| F61 | LTA ran free early/late morning rides for NEL stations Punggol Coast–Kovan and all Sengkang–Punggol LRT stations to shift demand; ~8% of commuters shifted out of peak; Kovan is the busiest NEL stretch, and the shift equalled adding two trains | S56 | High |
| F62 | Five new City Direct bus services added Dec 2025 for Hougang, Sengkang and Punggol; 25 more LRT vehicles being added | S56 | High |
| F63 | An independent analysis of passenger loads found the largest AM net inflows at NEL residential stations (Serangoon, Punggol, Sengkang) and NSL northern stations (Yishun, Admiralty, Sembawang, Khatib), attributed to lack of alternatives | S57 | Low-Medium |
| F64 | LTA added City Direct 684 for Brickland/Bukit Batok West and extended 97/97e and 181 to Tengah | S20 | High |

---

## 5. The Demand Gap Index (DGI) Model

### 5.1 Formula

For each area:

**DGI = H × A × T × C**

| Term | Meaning | How it is set |
|---|---|---|
| **H** | Homes needing service, in thousands | Future areas: announced homes (midpoint if a range). Existing areas: 2025 residents ÷ 3.0 [A1] |
| **A** | Access gap (0–1) | 1 − estimated share of the area within a 10-minute walk of an existing or committed MRT station. Fixed bands: **0.2** station inside/adjacent; **0.5** station on one edge or LRT feeder only; **0.85** large site with an edge station only; **1.0** nothing nearby [A2] |
| **T** | Timing gap (0–1) | **0.25** rail opens well before residents; **0.5** roughly together; **1.0** residents arrive years before any rail [A3] |
| **C** | Crowding multiplier | **1.5** where LTA has intervened on crowding (F61–F62); **1.2** where independent data flags top AM inflow (F63); **1.0** otherwise [A4] |

### 5.2 Scores

| Rank | Area | H | A | T | C | **DGI** | Evidence for each input |
|---|---|---|---|---|---|---|---|
| 1 | **Paya Lebar Air Base** | 150 | 0.85 | 1.0 | 1.0 | **127.5** | F48 (homes, size); F11 (Defu edge only); no interior line in F07–F16 |
| 2 | **Fernvale / Sengkang West** | 23.7 | 0.5 | 1.0 | 1.5 | **17.8** | F37 (71,200 ÷ 3); LRT feeder only; STL 2040s (F22); NEL crowding (F61) |
| 3 | **Yishun East** | 24.5 | 0.5 | 1.0 | 1.2 | **14.7** | F42 (73,440 ÷ 3); NSL only, not inside subzone [UNSOURCED]; F63 |
| 4 | **Sembawang East + Shipyard** | 8.2 + 10 | 0.5 / 0.8 | 1.0 | 1.2 | **14.5** | F40, F53; STL 2040s vs shipyard homes 2030s; F63 |
| 5 | **Punggol** | 68.1 | 0.2 | 0.5 | 1.5 | **10.2** | F32; NEL + CRL-PE 2032 (F13); F61 |
| 6 | **Tengah** | 42 | 0.3 | 0.5 | 1.0 | **6.3** | F50; JRL in town but indirect to city (F07) |
| 7 | **Brickworks / Bukit Batok West** | 15.0 | 0.4 | 0.75 | 1.0 | **4.5** | F43, F44; Brickland mid-2030s (F16); bus 684 (F64) |
| 8 | Kranji racecourse | 14 | 0.3 | 0.5 | 1.0 | 2.1 | F52 (adjacent to Kranji MRT; Sungei Kadut 2035) |
| 9 | Tampines North | 12.1 | 0.3 | 0.5 | 1.0 | 1.8 | F31; CRL 2030 (F11) |
| 10 | Toa Payoh (Sennett/Bidadari) | 8.9 | 0.3 | 0.5 | 1.0 | 1.3 | F35 |
| 11 | Bukit Timah Turf City | 17.5 | 0.3 | 0.25 | 1.0 | 1.3 | F51 (CRL2 station 2032, before homes) |
| 12 | Chencharu | 10 | 0.2 | 0.25 | 1.0 | 0.5 | F54 (Khatib station integrated) |
| 13 | GSW Keppel Club | 9 | 0.2 | 0.25 | 1.0 | 0.45 | F56 |
| 14 | Dover–Medway | 6 | 0.2 | 0.25 | 1.0 | 0.3 | F57 |


### 5.3 Sensitivity test

| Change | Effect on ranking |
|---|---|
| Residents per home = 2.5 instead of 3.0 | Fernvale 21.4, Yishun East 17.6, Sembawang 14.8: order unchanged; PLAB still #1 |
| Residents per home = 3.5 | Fernvale 15.3, Yishun East 12.6, Sembawang 14.3: Sembawang moves to #3 ahead of Yishun East; top 2 unchanged |
| PLAB access gap 0.5 instead of 0.85 | PLAB 75.0; still #1 by a wide margin |
| PLAB homes halved to 75,000 | PLAB 63.8; still #1 |
| Remove all crowding multipliers | Fernvale 11.9, Yishun East 12.3, Sembawang 12.1, Punggol 6.8: top three become a near tie; PLAB still #1 |

**Robust conclusions:** PLAB is the largest gap under every tested assumption. The north / north-east cluster (Fernvale, Yishun East, Sembawang) is consistently #2–#4. Kranji, Turf City, Chencharu, GSW and the central sites stay near the bottom because verified stations already sit beside them.

---

## 6. Base Rates for Timing

### 6.1 Announcement-to-opening lead times

| Project | Announced | First opening | Lead time | Sources |
|---|---|---|---|---|
| Thomson Line (now TEL) | LTMP 2008 | Jan 2020 | ~12 years | S13, S35 |
| Cross Island Line | Jan 2013 | 2030 (target) | ~17 years | S23, S20 |
| NEL extension (Punggol Coast) | Jan 2013 | Dec 2024 | ~12 years | Punggol Coast Wikipedia page (retrieved in search; grade C) |
| JRL (final alignment) | May 2018 | Mid-2028 (target) | ~10 years | S40 |
| DTL2e / Sungei Kadut | LTMP 2040 (May 2019) | 2035 (target) | ~16 years | S61, S62 |
| Brickland NSL station | LTMP 2040 (May 2019) | Mid-2030s (target) | ~15–17 years | S75 |
| JRL JS2A infill | Mar 2026 | Mid-2030s (target) | ~9 years | S42 |
| Seletar Line | LTMP 2040 (May 2019) | "From the 2040s" | ≥21 years | S12, S19 |

**Base rate:** median ~12–16 years from first public announcement to first opening. Infill stations on existing lines run faster (~9 years).

### 6.2 Delay base rate for projects due 2024–2030

| Project | Original target | Current target | Slip |
|---|---|---|---|
| TEL4 | 2023 | Opened Jun 2024 | ~1 year (S36) |
| TEL5 | 2024 | 2H 2026 | ~2 years (F05) |
| JRL Stage 1 | 2026 | Mid-2028 | ~2 years (S42) |
| CRL1 | 2029 | 2030 | ~1 year (S44, S20) |

**Base rate:** 4 of 4 recent projects slipped by 1–2 years. Forecasts below therefore assume a meaningful chance of further slippage. Much of this was COVID-related (S42), so future projects may slip less.

---

## 7. Predictions with Probabilities

**How to read these:** each forecast is a specific, checkable statement with a deadline. Probabilities are the author's subjective estimates, derived from the DGI ranking (Section 5), the base rates (Section 6), and official statements. They are not LTA commitments. A well-calibrated set means that of all statements given ~70%, roughly 7 in 10 should come true.

### 7.1 Near-term delivery (checkable within ~4 years)

| # | Statement | Deadline | P | Reasoning |
|---|---|---|---|---|
| P01 | TEL5 and DTL3e (Bedok South, Sungei Bedok, Xilin) enter passenger service | 31 Dec 2026 | **80%** | Official 2H 2026 target reaffirmed repeatedly (F03); but not open by mid-Sep and 4/4 recent projects slipped (6.2) |
| P02 | RTS Link starts passenger service | 31 Dec 2026 | **65%** | Target end-2026, train demo done (F17); some reports flag possible early-2027 slip |
| P03 | JRL Stage 1 opens | 31 Dec 2028 | **75%** | Mid-2028 target with LTA adding manpower (S20); one slip already absorbed |
| P04 | CRL Phase 1 opens | 31 Dec 2030 | **65%** | 2030 target (F11); tunnelling-heavy; delay base rate |
| P05 | LTA publishes the next Land Transport Master Plan (successor to LTMP 2040) | 31 Dec 2028 | **55%** | LTA says engagement "soon" (F29); LTMP 2040 came ~9 months after its consultation launch (S74, S75) |

### 7.2 Seletar–Tengah Line (STL)

| # | Statement | Deadline | P | Reasoning |
|---|---|---|---|---|
| P06 | Government publicly confirms the STL (or first phase) will proceed, with named station locations | 31 Mar 2029 | **55%** | Engineering study started 2026 (F23, F24); CRL went from announcement to Phase 1 station list in ~6 years (S23, S44), but a focused first phase could be faster |
| P07 | The first announced STL phase includes a station in Fernvale / Sengkang West | At first alignment announcement | **90%** | Named top priority by the minister (F23); DGI #2 (5.2) |
| P08 | STL interchanges with CRL at or near Serangoon North | At alignment announcement | **70%** | Minister cited possible CRL connection (F23); Serangoon North is a CRL1 station (F11) and a named STL catchment (F19) |
| P09 | STL is confirmed as a single merged through-running line | At alignment announcement | **60%** | Explicitly under study (F21, F24); TEL precedent of merging lines (S13) |
| P10 | STL includes a station within ~800 m of the former Sembawang Shipyard | At alignment announcement | **50%** | Sembawang is a named catchment (F19); shipyard ~10,000 homes (F53); DGI #4 |
| P11 | STL includes a station serving Yishun East | At alignment announcement | **35%** | High DGI (#3), but Yishun is **not** a named catchment (F19), so this requires LTA to add it |
| P12 | STL's Tengah arm has a station in Bukit Batok town (beyond existing NSL stations) | At alignment announcement | **75%** | Named catchment (F20); DGI #7; commentators see Bukit Batok as main beneficiary (S15) |
| P13 | Any STL segment opens for passenger service | 31 Dec 2039 | **10%** | Official "from the 2040s" (F22); base lead times of 12–16 years from 2025–26 point to ~2038–2042 at best |
| P14 | Any STL segment opens for passenger service | 31 Dec 2045 | **55%** | Consistent with "phases from the 2040s" plus delay base rate |

### 7.3 Paya Lebar Air Base

| # | Statement | Deadline | P | Reasoning |
|---|---|---|---|---|
| P15 | Government announces a rail line, branch or extension with at least one station inside the PLAB site (not just CRL Defu on the edge) | 31 Dec 2030 | **45%** | DGI #1 by far (5.2); but relocation only "from the 2030s" and development spans 2–3 decades (F48), so detailed plans may wait |
| P16 | Same as P15 | 31 Dec 2035 | **80%** | 150,000 homes on 800 ha cannot meet the 10-minute-walk target (F28) or 45-minute city (F27) without interior rail |
| P17 | The first PLAB interior rail is delivered by extending or branching an existing/planned line (e.g., STL, CRL, DTL, TEL) rather than a brand-new standalone line | At announcement | **55%** | LTA recently favours merging and extending (F21, F10, F15); but site size could justify a new line |
| P18 | First PLAB interior station opens | 31 Dec 2045 | **45%** | Lead-time base rate of 12–16 years from a ~2030–35 announcement |

### 7.4 Areas predicted NOT to get new rail (negative forecasts)

| # | Statement | Deadline | P | Reasoning |
|---|---|---|---|---|
| P19 | No new MRT line or new station is announced specifically for the Kranji racecourse site, beyond Kranji (existing) and Sungei Kadut (2035) | 31 Dec 2032 | **80%** | Site adjoins Kranji station with a sheltered walkway; Sungei Kadut interchange coming (F52); DGI 2.1 |
| P20 | No additional station announced for Bukit Timah Turf City beyond CRL2 Turf City | 31 Dec 2032 | **85%** | CRL2 Turf City opens 2032, before homes (F12, F51) |
| P21 | No new station announced for Chencharu beyond Khatib | 31 Dec 2035 | **90%** | Estate is designed around Khatib (F54) |
| P22 | No new station announced for GSW Keppel Club, Dover–Medway, Newton or Paterson | 31 Dec 2032 | **85%** | All adjacent to existing stations (F56–F58); DGI < 1 |

### 7.5 Scoring the forecasts later

When deadlines pass, record each outcome as 1 (true) or 0 (false) and compute the Brier score: average of (P − outcome)². Lower is better; 0.25 is what always guessing 50% would score.

---

## 8. Corrections to v1.0

| v1.0 claim | What verification showed | Effect |
|---|---|---|
| Route STL through **Bukit Timah Turf City** because it lacks rail | CRL Phase 2 already has a **Turf City station** due 2032 (F12) | Prediction withdrawn; now a negative forecast (P20) |
| Route STL through **Chencharu** because Yishun relies on the NSL | Chencharu is built around the existing **Khatib** station (F54) | Prediction withdrawn (P21). Yishun **East** remains a genuine gap by population data (F42) |
| **Kranji racecourse** needs a northwest rail link | Site adjoins **Kranji station** via sheltered walkway, with Sungei Kadut interchange in 2035 (F52) | Downgraded to a negative forecast (P19) |
| **Serangoon North** needs the STL | CRL1 already has a **Serangoon North** station (F11) | Reframed: likely STL–CRL interchange (P08), not an unserved area |
| JRL Stage 1 "mid-2028" flagged as unverified | Now **LTA-confirmed** (F07) | Upgraded to high confidence |
| v1.0's self-correction said 150,000 PLAB homes exceeds Tengah + Punggol combined | Sources compare it to **Sengkang + Punggol combined** (F48) | Comparison updated |
| CRL Defu station near PLAB was unverified | **Verified** as CR7 (F11) | Moved from unsourced to sourced |
| Tengah ~42,000 homes was unsourced | **Verified** via SG101 (F50) | Moved to sourced |
| RTS Link timing was unsourced | **Verified** target end-2026 (F17) | Moved to sourced |
| Western industrial prediction proposed a JRL extension to Tuas | CRL3 already goes west to **Gul Circle**, serving Jurong Industrial Estate (F14) | Dropped as a new-line prediction |

---

## 9. Assumptions and Limitations

### 9.1 Assumptions

| ID | Assumption | Why it matters | Tested? |
|---|---|---|---|
| A1 | ~3.0 residents per home to convert population to homes-equivalent | Affects H for existing areas | Yes, 2.5–3.5 (5.3) **[UNSOURCED figure]** |
| A2 | Access-gap bands (0.2 / 0.5 / 0.85 / 1.0) | Affects A | Partly (PLAB 0.5 vs 0.85) |
| A3 | Timing-gap bands (0.25 / 0.5 / 1.0) | Affects T | No |
| A4 | Crowding multipliers (1.0 / 1.2 / 1.5) | Affects C | Yes, removed entirely (5.3) |
| A5 | Unit counts are planning ceilings; actual build-out may be lower | Affects H for future sites | Yes for PLAB (halved) |
| A6 | Government keeps LTMP 2040 targets and 10-minute-walk goal | Drives P16 | No |
| A7 | No major policy shift away from rail (e.g., toward autonomous buses as mass transit) | All long-range forecasts | No |

### 9.2 Limitations

- **No station-to-home distance calculations.** Access bands are judged from station names and descriptions, not GIS. Three key proximity claims are still **[UNSOURCED]**: Fernvale has no MRT station inside it; Yishun East is outside walking range of Yishun/Khatib; Sembawang East and the shipyard are outside walking range of Sembawang station.
- **No official line-by-line crowding data** (e.g., peak-hour load factors). Crowding inputs rely on LTA interventions (strong signal) and one independent analysis (weak signal).
- Several future unit counts come from grade C sources (PLAB 150,000 is widely repeated and traces to a Prime Minister's National Day Rally, per S50; Sembawang ~10,000 comes only from S71).
- SingStat's own PDF blocked automated access; subzone figures come from citypopulation.de, which republishes SingStat data. The Tampines figure matches SingStat directly (S53).
- Probabilities are subjective and have not yet been scored against outcomes.

---

## 10. Verification Calendar

| When | What to check | Resolves |
|---|---|---|
| By 31 Dec 2026 | TEL5/DTL3e opening; RTS Link opening | P01, P02 |
| Feb–Mar 2027 | MOT Committee of Supply debate: STL study progress, PLAB transport hints, next LTMP | P05, P06, P15 |
| 2027 | Award of STL feasibility contract S1006 (GeBIZ) | Early signal for P06–P12 |
| 2027–2028 | Next LTMP consultation and publication | P05; may resolve P06, P15 |
| Mid-2028 | JRL Stage 1 opening | P03 |
| First STL alignment announcement | Station locations | P07–P12 |
| 2030 | CRL1 opening | P04 |
| 31 Dec 2030 | PLAB interior rail announced? | P15 |
| 2032 | CRL2 / CRL Punggol Extension openings | Confirms P20 assumptions |
| 31 Dec 2032 / 2035 | Negative forecasts for Kranji, Turf City, Chencharu, central sites; PLAB by 2035 | P16, P19–P22 |
| 2039 / 2045 | STL and PLAB opening dates | P13, P14, P18 |
