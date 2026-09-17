/* Demand Gap Index areas (Section 5) plus the areas the analysis forecasts will
   NOT get new rail (Section 7.4).

   DGI = sum over components of H x A x T x C
     H = homes needing service, in thousands
     A = access gap 0-1   (1 - share within a 10-min walk of existing/committed rail)
     T = timing gap 0-1   (does rail arrive before, with, or after the residents)
     C = crowding multiplier (1.5 LTA has intervened; 1.2 independent data flags it)
   kind: 'population' scales with the residents-per-home assumption;
         'homes' is an announced unit count; 'stated' is fixed in the source table. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).areas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return [
    {
      id: 'plab', name: 'Paya Lebar Air Base', rank: 1, docDGI: 127.5, verdict: 'gap',
      lat: 1.3590, lon: 103.9090,
      components: [{ label: 'Announced homes', kind: 'homes', homes: 150, A: 0.85, T: 1.0, C: 1.0 }],
      note: '150,000 homes on 800 ha with one committed station on the edge',
      inputs: 'A = 0.85: a large site with only an edge station (CRL Defu). T = 1.0: residents arrive years before any interior rail. C = 1.0: no crowding signal yet, because nobody lives there.',
      why: 'Up to 150,000 homes on about 800 ha - comparable to Sengkang and Punggol combined - with one committed station on the boundary. It is the largest gap under every tested assumption: halve the homes and it still ranks first; cut the access gap from 0.85 to 0.5 and it still ranks first by a wide margin.',
      f: ['F48', 'F49', 'F11', 'F27', 'F28'], s: ['S49', 'S50', 'S51', 'S52'], p: ['P15', 'P16', 'P17', 'P18']
    },
    {
      id: 'fernvale', name: 'Fernvale / Sengkang West', rank: 2, docDGI: 17.8, verdict: 'gap',
      lat: 1.3912, lon: 103.8760,
      components: [{ label: 'Fernvale subzone residents', kind: 'population', population: 71200, A: 0.5, T: 1.0, C: 1.5 }],
      note: '71,200 residents on LRT only, feeding an already-crowded NEL',
      inputs: 'A = 0.5: LRT feeder only, no MRT station inside the subzone. T = 1.0: the STL is a 2040s proposition and the residents are already there. C = 1.5: LTA has actively intervened on NEL crowding.',
      why: '71,200 residents in 2025, up 12,400 in five years, served by LRT feeding an already-crowded NEL. LTA ran free off-peak rides here to shift about 8% of commuters out of peak - the equivalent of adding two trains. The minister named Sengkang West as the first priority corridor for the Seletar Line.',
      f: ['F36', 'F37', 'F61', 'F62', 'F19', 'F23'], s: ['S54', 'S56', 'S18', 'S20'], p: ['P07']
    },
    {
      id: 'yishun-east', name: 'Yishun East', rank: 3, docDGI: 14.7, verdict: 'gap',
      lat: 1.4200, lon: 103.8480,
      components: [{ label: 'Yishun East subzone residents', kind: 'population', population: 73440, A: 0.5, T: 1.0, C: 1.2 }],
      note: '73,440 residents, NSL only, no station inside the subzone',
      inputs: 'A = 0.5: NSL only, with no station inside the subzone (this proximity claim is unsourced - judged from station names, not GIS). C = 1.2: independent load analysis flags Yishun among the largest morning inflows.',
      why: '73,440 residents and growing, on a single line. The catch: Yishun is not one of LTA’s named Seletar Line catchments, so a station here needs LTA to add one - which is why the forecast sits at only 35% despite the third-highest demand gap.',
      f: ['F41', 'F42', 'F63'], s: ['S54', 'S57'], p: ['P11']
    },
    {
      id: 'sembawang', name: 'Sembawang East + Shipyard', rank: 4, docDGI: 14.5, verdict: 'gap',
      lat: 1.4530, lon: 103.8350,
      components: [
        { label: 'Sembawang East subzone residents', kind: 'population', population: 24620, A: 0.5, T: 1.0, C: 1.2 },
        { label: 'Sembawang Shipyard homes', kind: 'homes', homes: 10, A: 0.8, T: 1.0, C: 1.2 }
      ],
      note: 'Shipyard homes land in the 2030s; the studied line is a 2040s proposition',
      inputs: 'Two components: existing residents (A = 0.5, NSL only) and the shipyard redevelopment (A = 0.8, waterfront site away from the station). T = 1.0 for both: the shipyard homes land in the 2030s, the STL in the 2040s.',
      why: 'The shipyard relocates by 2028, freeing roughly 10,000 waterfront homes, on top of a subzone that added 7,280 residents with no station inside it. Sembawang is a named Seletar Line catchment, but the timing is backwards - homes in the 2030s, rail in the 2040s.',
      f: ['F39', 'F40', 'F53', 'F63', 'F19'], s: ['S54', 'S70', 'S71', 'S57', 'S12'], p: ['P10']
    },
    {
      id: 'punggol', name: 'Punggol', rank: 5, docDGI: 10.2, verdict: 'gap',
      lat: 1.4052, lon: 103.9024,
      components: [{ label: 'Punggol residents', kind: 'population', population: 204150, A: 0.2, T: 0.5, C: 1.5 }],
      note: '+29,700 residents in five years - a capacity problem, not an access one',
      inputs: 'A = 0.2: stations are inside the town. T = 0.5: the CRL extension arrives roughly alongside continued growth. C = 1.5: LTA has intervened on NEL crowding.',
      why: 'Added 29,700 residents in five years. Not an access problem - it is a capacity problem, and LTA is already treating it as one: free off-peak rides, five new City Direct bus services, 25 more LRT vehicles, NEL capacity up from 36 to 42 trains.',
      f: ['F32', 'F60', 'F61', 'F62', 'F13'], s: ['S54', 'S55', 'S56', 'S45'], p: []
    },
    {
      id: 'tengah', name: 'Tengah', rank: 6, docDGI: 6.3, verdict: 'gap',
      lat: 1.3640, lon: 103.7280,
      components: [{ label: 'Planned homes', kind: 'homes', homes: 42, A: 0.3, T: 0.5, C: 1.0 }],
      note: '42,000 homes; rail arrives 2028, but only an indirect route to the city',
      inputs: 'A = 0.3: the JRL runs through the town. T = 0.5: rail and residents arrive at roughly the same time, though the JRL slipped to mid-2028.',
      why: 'From 10 residents in 2020 to 22,960 in 2025 with buses only, heading for about 42,000 homes. The JRL fixes access in 2028, but it is an indirect route to the city - which is the gap the studied Tengah Line would close. LTA has extended bus routes 97/97e and 181 as a stopgap.',
      f: ['F33', 'F50', 'F07', 'F09', 'F16', 'F20', 'F64'], s: ['S54', 'S58', 'S20', 'S40'], p: []
    },
    {
      id: 'brickworks', name: 'Brickworks / Bukit Batok West', rank: 7, docDGI: 4.5, verdict: 'gap',
      lat: 1.3620, lon: 103.7480,
      components: [{ label: 'Homes needing service (stated)', kind: 'stated', H: 15.0, A: 0.4, T: 0.75, C: 1.0 }],
      note: '+11,100 residents; Brickland station is still a decade away',
      inputs: 'H is taken as stated in the source table (15.0k); it exceeds the Brickworks subzone population alone, so it covers the wider Bukit Batok West area. T = 0.75: Brickland is still a decade away.',
      why: 'The Brickworks subzone added 11,100 residents in five years. Brickland NSL station is committed but not until the mid-2030s, and LTA has filled the gap with City Direct bus 684 - a reliable tell that the demand is real and early.',
      f: ['F43', 'F44', 'F16', 'F64'], s: ['S54', 'S05', 'S75', 'S20'], p: ['P12']
    },
    {
      id: 'kranji', name: 'Kranji racecourse', rank: 8, docDGI: 2.1, verdict: 'covered',
      lat: 1.4200, lon: 103.7530,
      components: [{ label: 'Planned homes', kind: 'homes', homes: 14, A: 0.3, T: 0.5, C: 1.0 }],
      note: 'Adjoins Kranji station; Sungei Kadut interchange opens 2035',
      inputs: 'A = 0.3: the site adjoins Kranji station via a sheltered walkway.',
      why: 'v1.0 of this analysis called for a new north-west link here. Verification killed it: the site adjoins Kranji NSL station with a sheltered walkway, and the Sungei Kadut interchange opens in 2035. Now a negative forecast - 80% chance no new station is announced for the site by end-2032.',
      f: ['F52', 'F15'], s: ['S69', 'S70', 'S78', 'S60'], p: ['P19']
    },
    {
      id: 'tampines-north', name: 'Tampines North', rank: 9, docDGI: 1.8, verdict: 'covered',
      lat: 1.3800, lon: 103.9390,
      components: [{ label: 'Tampines North residents', kind: 'population', population: 36160, A: 0.3, T: 0.5, C: 1.0 }],
      note: 'Fastest-filling subzone in the country - and its CRL station is committed',
      inputs: 'A = 0.3 and T = 0.5: the CRL station is committed for 2030, roughly alongside the build-out.',
      why: 'The fastest-filling subzone in the country - 8,040 residents in 2020 to 36,160 in 2025 - and it still scores low, because the CRL station is already committed for 2030. Growth alone does not make a gap.',
      f: ['F30', 'F31', 'F11'], s: ['S53', 'S54', 'S46'], p: []
    },
    {
      id: 'toa-payoh', name: 'Toa Payoh (Sennett / Bidadari)', rank: 10, docDGI: 1.3, verdict: 'covered',
      lat: 1.3350, lon: 103.8650,
      components: [{ label: 'Sennett + Bidadari residents', kind: 'population', population: 26610, A: 0.3, T: 0.5, C: 1.0 }],
      note: 'Bidadari and Sennett filled fast, but both sit near existing NEL stations',
      inputs: 'A = 0.3: near NEL Woodleigh and Potong Pasir, though this proximity claim is unsourced.',
      why: 'Bidadari went from zero to 9,120 residents and Sennett more than doubled, but both sit near existing NEL stations. The minister has mused that the STL might pass parts of Toa Payoh - a remark, not a commitment.',
      f: ['F34', 'F35', 'F25'], s: ['S54', 'S14'], p: []
    },
    {
      id: 'turf-city', name: 'Bukit Timah Turf City', rank: 11, docDGI: 1.3, verdict: 'covered',
      lat: 1.3340, lon: 103.8020,
      components: [{ label: 'Planned homes (midpoint of 15-20k)', kind: 'homes', homes: 17.5, A: 0.3, T: 0.25, C: 1.0 }],
      note: 'CRL2 Turf City opens 2032, ahead of the homes',
      inputs: 'T = 0.25: rail opens well before the residents arrive.',
      why: 'v1.0 wanted to route the Seletar-Tengah Line through here. Verification killed it: CRL Phase 2 already includes a Turf City station opening in 2032, ahead of the homes. Now a negative forecast at 85%.',
      f: ['F51', 'F12'], s: ['S28', 'S45', 'S46'], p: ['P20']
    },
    {
      id: 'chencharu', name: 'Chencharu (Yishun)', rank: 12, docDGI: 0.5, verdict: 'covered',
      lat: 1.4180, lon: 103.8270,
      components: [{ label: 'Planned homes', kind: 'homes', homes: 10, A: 0.2, T: 0.25, C: 1.0 }],
      note: 'Estate designed around the existing Khatib station',
      inputs: 'A = 0.2: the estate is designed around the existing Khatib station.',
      why: 'v1.0 wanted a station here too. The estate is planned around the existing Khatib NSL station on a 70 ha site, so the forecast is now 90% that no new station is announced by end-2035. Note the contrast with Yishun East, a few kilometres away, which remains a genuine gap.',
      f: ['F54', 'F41', 'F42'], s: ['S59', 'S54'], p: ['P21']
    },
    {
      id: 'gsw', name: 'Greater Southern Waterfront (Keppel Club)', rank: 13, docDGI: 0.45, verdict: 'covered',
      lat: 1.2725, lon: 103.8265,
      components: [{ label: 'Planned homes', kind: 'homes', homes: 9, A: 0.2, T: 0.25, C: 1.0 }],
      note: 'Keppel Club homes already sit beside two CCL stations',
      inputs: 'A = 0.2: CCL Labrador Park and Telok Blangah sit beside the site, linked by trails.',
      why: 'A headline redevelopment with a low demand gap, because the rail is already there. The GSW still matters to the map as the place both STL arms are studied as meeting - a network role, not a coverage need.',
      f: ['F56', 'F19', 'F21'], s: ['S66', 'S67', 'S68', 'S12'], p: ['P22', 'P09']
    },
    {
      id: 'dover', name: 'Dover - Medway', rank: 14, docDGI: 0.3, verdict: 'covered',
      lat: 1.3080, lon: 103.7840,
      components: [{ label: 'Phase 1 homes', kind: 'homes', homes: 6, A: 0.2, T: 0.25, C: 1.0 }],
      note: 'Dropped between existing CCL stations',
      inputs: 'A = 0.2: CCL one-north and Kent Ridge are adjacent.',
      why: 'About 6,000 homes in Phase 1 from late 2025, dropped between existing CCL stations. Grouped with Newton and Paterson in the negative forecast at 85%.',
      f: ['F57', 'F58'], s: ['S27', 'S25'], p: ['P22']
    }
  ];
});
