/* Future rail: committed projects, projects under study, and the model's own
   speculative corridors.

   placement:
     'sited'      - station location is officially known; coords are approximate.
     'indicative' - LTA has named the station/corridor but not its exact site.
     'model'      - NOT an official alignment. This is the analysis author's
                    illustrative guess from named catchments and the Demand Gap
                    Index. Treat as a hypothesis, never as a plan.
   Every node carries: why (plain-language reason), f (finding ids),
   s (source ids), p (prediction ids), dgi (demand-gap area id). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).future = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return [
    {
      id: 'TEL5', name: 'TEL5 + DTL3e', color: '#9D5B25', klass: 'committed',
      status: 'Under construction', opens: '2H 2026', confidence: 'High',
      summary: 'The last stretch of the Thomson-East Coast Line and the Downtown Line extension meet at Sungei Bedok. The two stations must open together because they share a fire protection system.',
      f: ['F03', 'F04', 'F05'], s: ['S35', 'S36', 'S37', 'S38', 'S39'], p: ['P01'],
      stations: [
        { code: 'TE29', name: 'Bayshore', lat: 1.3130, lon: 103.9370, status: 'open', placement: 'sited' },
        { code: 'TE30', name: 'Bedok South', lat: 1.3195, lon: 103.9460, placement: 'sited', why: 'Completes TEL5 and serves the Bayshore housing area (about 10,000-12,500 homes).', f: ['F03', 'F04', 'F55'], s: ['S32', 'S39'], p: ['P01'] },
        { code: 'TE31/DT37', name: 'Sungei Bedok', lat: 1.3226, lon: 103.9548, placement: 'sited', why: 'TEL-DTL interchange. Shares a fire protection system with Bedok South, so the two open together.', f: ['F03', 'F04'], s: ['S31', 'S39'], p: ['P01'] },
        { code: 'DT36', name: 'Xilin', lat: 1.3283, lon: 103.9603, placement: 'sited', why: 'DTL3 extension station on the way from Expo to Sungei Bedok.', f: ['F03'], s: ['S37'], p: ['P01'] },
        { code: 'DT35', name: 'Expo', lat: 1.3354, lon: 103.9616, status: 'open', placement: 'sited' }
      ],
      route: ['TE29', 'TE30', 'TE31/DT37', 'DT36', 'DT35']
    },
    {
      id: 'TEL-FM', name: 'TEL Founders’ Memorial', color: '#9D5B25', klass: 'committed',
      status: 'Committed', opens: '2028', confidence: 'High',
      summary: 'Infill TEL station at Bay East Garden serving the Founders’ Memorial.',
      f: ['F06'], s: ['S35', 'S37'], p: [],
      stations: [
        { code: 'TE20', name: 'Marina Bay', lat: 1.2762, lon: 103.8546, status: 'open', placement: 'sited' },
        { code: 'TE22A', name: "Founders' Memorial", lat: 1.2836, lon: 103.8697, placement: 'sited', why: 'Infill station on the existing TEL alignment for the Founders’ Memorial at Bay East.', f: ['F06'], s: ['S35', 'S37'] },
        { code: 'TE23', name: 'Tanjong Rhu', lat: 1.2944, lon: 103.8735, status: 'open', placement: 'sited' }
      ],
      route: ['TE20', 'TE22A', 'TE23']
    },
    {
      id: 'TEL-EAST', name: 'TEL extension to Changi T5', color: '#9D5B25', klass: 'committed',
      status: 'Committed', opens: 'Mid-2030s', confidence: 'High',
      summary: 'TEL runs on from Sungei Bedok to Changi Airport Terminal 5, absorbing the Changi Airport branch and reaching Tanah Merah.',
      f: ['F06'], s: ['S35', 'S37'], p: [],
      stations: [
        { code: 'TE31/DT37', name: 'Sungei Bedok', lat: 1.3226, lon: 103.9548, placement: 'sited' },
        { code: 'TE32', name: 'Changi Terminal 5', lat: 1.3620, lon: 103.9955, placement: 'indicative', why: 'Serves the new Changi T5; LTA has committed to the extension, exact station siting follows T5 construction.', f: ['F06'], s: ['S35', 'S37'] },
        { code: 'CG2', name: 'Changi Airport', lat: 1.3573, lon: 103.9884, status: 'open', placement: 'sited' },
        { code: 'CG1', name: 'Expo', lat: 1.3354, lon: 103.9616, status: 'open', placement: 'sited' },
        { code: 'EW4', name: 'Tanah Merah', lat: 1.3272, lon: 103.9464, status: 'open', placement: 'sited' }
      ],
      route: ['TE31/DT37', 'TE32', 'CG2', 'CG1', 'EW4']
    },
    {
      id: 'RTS', name: 'Johor Bahru RTS Link', color: '#e0457b', klass: 'committed',
      status: 'Testing', opens: 'End-2026', confidence: 'Medium-High',
      summary: '4 km cross-border shuttle, 10,000 passengers per hour per direction. First train demonstration completed at Woodlands North in February 2026; some reports flag a possible slip to early 2027.',
      f: ['F17'], s: ['S63', 'S64', 'S65'], p: ['P02'],
      stations: [
        { code: 'TE1', name: 'Woodlands North', lat: 1.4482, lon: 103.7857, status: 'open', placement: 'sited' },
        { code: 'RTS', name: 'Bukit Chagar (Johor Bahru)', lat: 1.4620, lon: 103.7655, placement: 'sited', why: 'Malaysian terminus of the RTS Link; replaces the causeway bus crawl for 10,000 passengers per hour per direction.', f: ['F17'], s: ['S64', 'S65'], p: ['P02'] }
      ],
      route: ['TE1', 'RTS']
    },
    {
      id: 'JRL1', name: 'Jurong Region Line - Stage 1', color: '#0099aa', klass: 'committed',
      status: 'Under construction', opens: 'Mid-2028 (was end-2027)', confidence: 'High',
      summary: 'Ten stations from Choa Chu Kang through Tengah to Boon Lay and Tawas. Delayed about six months; LTA has added manpower. This is the first rail Tengah gets - its population went from 10 people in 2020 to 22,960 in 2025 with buses only.',
      f: ['F07', 'F33', 'F50', 'F64'], s: ['S20', 'S40', 'S41', 'S42'], p: ['P03'], dgi: 'tengah',
      stations: [
        { code: 'JS1', name: 'Choa Chu Kang', lat: 1.3854, lon: 103.7443, placement: 'sited', why: 'NSL interchange and northern terminus of the JRL.', f: ['F07'], s: ['S40'] },
        { code: 'JS2', name: 'Choa Chu Kang West', lat: 1.3826, lon: 103.7352, placement: 'sited', f: ['F07'], s: ['S40'] },
        { code: 'JS3', name: 'Tengah', lat: 1.3640, lon: 103.7280, placement: 'sited', why: 'Tengah town centre. Tengah is planned for about 42,000 homes and had no rail at all until this opens.', f: ['F07', 'F33', 'F50'], s: ['S58', 'S40'], p: ['P03'], dgi: 'tengah' },
        { code: 'JS4', name: 'Hong Kah', lat: 1.3560, lon: 103.7215, placement: 'sited', f: ['F07'], s: ['S40'] },
        { code: 'JS5', name: 'Corporation', lat: 1.3480, lon: 103.7160, placement: 'sited', f: ['F07'], s: ['S40'] },
        { code: 'JS6', name: 'Jurong West', lat: 1.3430, lon: 103.7075, placement: 'sited', f: ['F07'], s: ['S40'] },
        { code: 'JS7', name: 'Bahar Junction', lat: 1.3462, lon: 103.6990, placement: 'sited', why: 'Junction where the JRL splits towards Boon Lay and towards Nanyang.', f: ['F07'], s: ['S40'] },
        { code: 'JS8', name: 'Boon Lay', lat: 1.3385, lon: 103.7060, placement: 'sited', why: 'EWL interchange.', f: ['F07'], s: ['S40'] },
        { code: 'JW1', name: 'Gek Poh', lat: 1.3480, lon: 103.6940, placement: 'sited', f: ['F07'], s: ['S40'] },
        { code: 'JW2', name: 'Tawas', lat: 1.3430, lon: 103.6855, placement: 'sited', why: 'Western limit of JRL Stage 1.', f: ['F07'], s: ['S40'] }
      ],
      route: ['JS1', 'JS2', 'JS3', 'JS4', 'JS5', 'JS6', 'JS7', 'JS8'],
      routes: [['JS1', 'JS2', 'JS3', 'JS4', 'JS5', 'JS6', 'JS7', 'JS8'], ['JS7', 'JW1', 'JW2']]
    },
    {
      id: 'JRL23', name: 'Jurong Region Line - Stages 2 & 3', color: '#0099aa', klass: 'committed',
      status: 'Timelines under review', opens: 'TBC (was 2028 and 2029)', confidence: 'Medium-High',
      summary: 'Stage 2 runs east from Tengah to Jurong East and Pandan Reservoir; Stage 3 runs south to the industrial estates and west to Nanyang. Both timelines were put under review when Stage 1 slipped.',
      f: ['F08'], s: ['S41', 'S43'], p: [],
      stations: [
        { code: 'JE1', name: 'Tengah Plantation', lat: 1.3610, lon: 103.7350, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JE2', name: 'Tengah Park', lat: 1.3570, lon: 103.7420, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JE3', name: 'Bukit Batok West', lat: 1.3510, lon: 103.7440, placement: 'sited', why: 'Serves the Bukit Batok West / Brickworks growth area, which added about 11,100 residents between 2020 and 2025.', f: ['F08', 'F44'], s: ['S43', 'S54'], dgi: 'brickworks' },
        { code: 'JE4', name: 'Toh Guan', lat: 1.3370, lon: 103.7470, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JE5', name: 'Jurong East', lat: 1.3331, lon: 103.7422, placement: 'sited', why: 'Interchange with NSL, EWL and the future CRL at Jurong Lake District.', f: ['F08', 'F12'], s: ['S43'] },
        { code: 'JE6', name: 'Jurong Town Hall', lat: 1.3300, lon: 103.7395, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JE7', name: 'Pandan Reservoir', lat: 1.3180, lon: 103.7480, placement: 'sited', why: 'Current eastern terminus; the West Coast Extension continues from here.', f: ['F08', 'F10'], s: ['S43'] },
        { code: 'JS9', name: 'Enterprise', lat: 1.3300, lon: 103.7050, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JS10', name: 'Tukang', lat: 1.3230, lon: 103.7010, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JS11', name: 'Jurong Hill', lat: 1.3160, lon: 103.7020, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JS12', name: 'Jurong Pier', lat: 1.3110, lon: 103.7080, placement: 'sited', why: 'Planned interchange with CRL Phase 3.', f: ['F08', 'F14'], s: ['S43', 'S45'] },
        { code: 'JW3', name: 'Nanyang Gateway', lat: 1.3455, lon: 103.6810, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JW4', name: 'Nanyang Crescent', lat: 1.3485, lon: 103.6790, placement: 'sited', f: ['F08'], s: ['S43'] },
        { code: 'JW5', name: 'Peng Kang Hill', lat: 1.3400, lon: 103.6790, placement: 'sited', f: ['F08'], s: ['S43'] }
      ],
      routes: [
        ['JS3', 'JE1', 'JE2', 'JE3', 'JE4', 'JE5', 'JE6', 'JE7'],
        ['JS8', 'JS9', 'JS10', 'JS11', 'JS12'],
        ['JW2', 'JW3', 'JW4', 'JW5']
      ],
      anchors: {
        JS3: [1.3640, 103.7280], JS8: [1.3385, 103.7060], JW2: [1.3430, 103.6855]
      }
    },
    {
      id: 'JRL-INFILL', name: 'JRL infill station JS2A (Forest Hill)', color: '#0099aa', klass: 'committed',
      status: 'Committed', opens: 'Mid-2030s', confidence: 'High',
      summary: 'Infill station for the Forest Hill district of Tengah, announced March 2026. Infill stations on an existing line run faster than new lines - roughly nine years from announcement.',
      f: ['F09'], s: ['S40', 'S42'], p: [], dgi: 'tengah',
      stations: [
        { code: 'JS2', name: 'Choa Chu Kang West', lat: 1.3826, lon: 103.7352, placement: 'sited' },
        { code: 'JS2A', name: 'JS2A (Forest Hill)', lat: 1.3745, lon: 103.7315, placement: 'indicative', why: 'Serves the Forest Hill district of Tengah between Choa Chu Kang West and Tengah.', f: ['F09', 'F50'], s: ['S40', 'S42'], dgi: 'tengah' },
        { code: 'JS3', name: 'Tengah', lat: 1.3640, lon: 103.7280, placement: 'sited' }
      ],
      route: ['JS2', 'JS2A', 'JS3']
    },
    {
      id: 'JRL-WCE', name: 'JRL West Coast Extension', color: '#0099aa', klass: 'committed',
      status: 'Announced', opens: 'Late 2030s / early 2040s', confidence: 'High',
      summary: 'Extends the JRL from Pandan Reservoir to West Coast (CRL interchange) and on to Kent Ridge (CCL).',
      f: ['F10'], s: ['S19', 'S43'], p: [],
      stations: [
        { code: 'JE7', name: 'Pandan Reservoir', lat: 1.3180, lon: 103.7480, placement: 'sited' },
        { code: 'JE8', name: 'West Coast', lat: 1.3020, lon: 103.7580, placement: 'indicative', why: 'Interchange with CRL Phase 2 at West Coast.', f: ['F10', 'F12'], s: ['S19', 'S43'] },
        { code: 'JE9', name: 'Kent Ridge', lat: 1.2934, lon: 103.7845, placement: 'indicative', why: 'Ties the JRL into the CCL, giving western commuters a direct route to the south-west.', f: ['F10'], s: ['S19', 'S43'] }
      ],
      route: ['JE7', 'JE8', 'JE9']
    },
    {
      id: 'CRL1', name: 'Cross Island Line - Phase 1', color: '#97c616', klass: 'committed',
      status: 'Under construction', opens: '2030 (originally 2029)', confidence: 'High',
      summary: 'Twelve stations from Aviation Park to Bright Hill. The CRL is projected to carry more than a million daily trips in the long run. Two stations here, Defu and Serangoon North, changed the conclusions of this analysis - see the corrections.',
      f: ['F11', 'F18'], s: ['S20', 'S44', 'S47', 'S48'], p: ['P04'],
      stations: [
        { code: 'CR1', name: 'Aviation Park', lat: 1.3830, lon: 103.9975, placement: 'indicative', f: ['F11'], s: ['S46', 'S48'] },
        { code: 'CR2', name: 'Loyang', lat: 1.3740, lon: 103.9760, placement: 'indicative', f: ['F11'], s: ['S46'] },
        { code: 'CR3', name: 'Pasir Ris East', lat: 1.3755, lon: 103.9600, placement: 'indicative', f: ['F11'], s: ['S46'] },
        { code: 'CR4', name: 'Pasir Ris', lat: 1.3721, lon: 103.9493, placement: 'sited', why: 'EWL interchange and junction for the Punggol Extension.', f: ['F11', 'F13'], s: ['S46'] },
        { code: 'CR5', name: 'Tampines North', lat: 1.3800, lon: 103.9390, placement: 'indicative', why: 'Tampines North went from 8,040 residents in 2020 to 36,160 in 2025 - the fastest-filling subzone in the country. The station arrives with the residents, which is why its demand-gap score is low despite the growth.', f: ['F11', 'F30', 'F31'], s: ['S46', 'S54'], dgi: 'tampines-north' },
        { code: 'CR6', name: 'Defu', lat: 1.3608, lon: 103.8920, placement: 'indicative', why: 'Sits on the EDGE of the Paya Lebar Air Base site - the single most important station in this analysis. It is the only committed rail anywhere near 150,000 future homes, and it only touches the boundary.', f: ['F11', 'F48', 'F49'], s: ['S46', 'S49', 'S25'], p: ['P15', 'P16'], dgi: 'plab' },
        { code: 'CR7', name: 'Hougang', lat: 1.3714, lon: 103.8925, placement: 'sited', why: 'NEL interchange. The NEL is the line LTA has actively intervened on for crowding.', f: ['F11', 'F61'], s: ['S46', 'S56'] },
        { code: 'CR8', name: 'Serangoon North', lat: 1.3690, lon: 103.8720, placement: 'indicative', why: 'Named as part of the first priority corridor for the Seletar Line, and already a CRL1 station - so the likely form is an STL-CRL interchange here, not a new catchment.', f: ['F11', 'F19', 'F23'], s: ['S46', 'S18', 'S20'], p: ['P08'] },
        { code: 'CR9', name: 'Tavistock', lat: 1.3660, lon: 103.8600, placement: 'indicative', f: ['F11'], s: ['S46'] },
        { code: 'CR10', name: 'Ang Mo Kio', lat: 1.3700, lon: 103.8496, placement: 'sited', why: 'NSL interchange.', f: ['F11'], s: ['S46'] },
        { code: 'CR11', name: 'Teck Ghee', lat: 1.3690, lon: 103.8400, placement: 'indicative', f: ['F11'], s: ['S46'] },
        { code: 'CR12', name: 'Bright Hill', lat: 1.3629, lon: 103.8331, placement: 'sited', why: 'TEL interchange and the western end of Phase 1.', f: ['F11'], s: ['S46'] }
      ],
      route: ['CR1', 'CR2', 'CR3', 'CR4', 'CR5', 'CR6', 'CR7', 'CR8', 'CR9', 'CR10', 'CR11', 'CR12']
    },
    {
      id: 'CRL-PE', name: 'CRL Punggol Extension', color: '#97c616', klass: 'committed',
      status: 'Under construction', opens: '2032', confidence: 'High',
      summary: 'Four stations branching north from Pasir Ris to Punggol. Punggol added 29,700 residents between 2020 and 2025 and is served only by the NEL and its LRT.',
      f: ['F13', 'F32', 'F61'], s: ['S20', 'S45'], p: [], dgi: 'punggol',
      stations: [
        { code: 'CP4', name: 'Pasir Ris', lat: 1.3721, lon: 103.9493, placement: 'sited' },
        { code: 'CP3', name: 'Elias', lat: 1.3830, lon: 103.9430, placement: 'indicative', f: ['F13'], s: ['S45'] },
        { code: 'CP2', name: 'Riviera', lat: 1.3960, lon: 103.9160, placement: 'indicative', why: 'Punggol LRT interchange.', f: ['F13'], s: ['S45'] },
        { code: 'CP1', name: 'Punggol', lat: 1.4052, lon: 103.9024, placement: 'sited', why: 'Gives Punggol a second heavy-rail line. Punggol is DGI rank 5: big and growing, but already on the NEL and getting the CRL, so the gap is timing rather than absence.', f: ['F13', 'F32', 'F61'], s: ['S45', 'S56'], dgi: 'punggol' }
      ],
      route: ['CP4', 'CP3', 'CP2', 'CP1']
    },
    {
      id: 'CRL2', name: 'Cross Island Line - Phase 2', color: '#97c616', klass: 'committed',
      status: 'Committed', opens: '2032', confidence: 'High',
      summary: 'Six stations west from Bright Hill to Jurong Lake District. Turf City station here killed one of v1.0’s predictions: the 15,000-20,000 homes planned at Bukit Timah Turf City already have committed rail, arriving before the residents.',
      f: ['F12', 'F51'], s: ['S20', 'S45', 'S46'], p: ['P20'],
      stations: [
        { code: 'CR13', name: 'Turf City', lat: 1.3340, lon: 103.8020, placement: 'indicative', why: 'Serves the 15,000-20,000 homes planned at Bukit Timah Turf City - and opens in 2032, before most of them are built. This is why the analysis now forecasts NO further station here.', f: ['F12', 'F51'], s: ['S45', 'S46', 'S28'], p: ['P20'], dgi: 'turf-city' },
        { code: 'CR14', name: 'King Albert Park', lat: 1.3355, lon: 103.7836, placement: 'sited', why: 'DTL interchange.', f: ['F12'], s: ['S45'] },
        { code: 'CR15', name: 'Maju', lat: 1.3230, lon: 103.7770, placement: 'indicative', f: ['F12'], s: ['S45'] },
        { code: 'CR16', name: 'Clementi', lat: 1.3152, lon: 103.7653, placement: 'sited', why: 'EWL interchange. Clementi added 12,250 residents 2020-2025.', f: ['F12', 'F38'], s: ['S45', 'S54'] },
        { code: 'CR17', name: 'West Coast', lat: 1.3020, lon: 103.7580, placement: 'indicative', why: 'Future JRL West Coast Extension interchange.', f: ['F12', 'F10'], s: ['S45'] },
        { code: 'CR18', name: 'Jurong Lake District', lat: 1.3331, lon: 103.7400, placement: 'indicative', why: 'Ties the CRL into Jurong East and the JRL.', f: ['F12'], s: ['S45'] }
      ],
      routes: [['CR12', 'CR13', 'CR14', 'CR15', 'CR16', 'CR17', 'CR18']],
      anchors: { CR12: [1.3629, 103.8331] }
    },
    {
      id: 'CRL3', name: 'Cross Island Line - Phase 3', color: '#97c616', klass: 'committed',
      status: 'Construction from 2027', opens: 'Late 2030s', confidence: 'High',
      summary: 'Four stations west from Jurong Lake District to Gul Circle on the EWL, with a JRL interchange at Jurong Pier, serving Jurong Industrial Estate and Taman Jurong. This is why v1.0’s proposed JRL extension to Tuas was dropped - the west is already covered.',
      f: ['F14'], s: ['S20', 'S45'], p: [],
      stations: [
        { code: 'CR19', name: 'CRL3 station (Taman Jurong area)', lat: 1.3230, lon: 103.7240, placement: 'indicative', why: 'Station names for Phase 3 are not all public; position shown from the announced corridor.', f: ['F14'], s: ['S45'] },
        { code: 'CR20', name: 'Jurong Pier (JRL interchange)', lat: 1.3110, lon: 103.7080, placement: 'indicative', why: 'Interchange with the JRL, linking the industrial west into the CRL.', f: ['F14'], s: ['S45'] },
        { code: 'CR21', name: 'CRL3 station (Jurong Industrial Estate)', lat: 1.3150, lon: 103.6830, placement: 'indicative', f: ['F14'], s: ['S45'] },
        { code: 'CR22', name: 'Gul Circle', lat: 1.3195, lon: 103.6606, placement: 'sited', why: 'EWL interchange and the western terminus of the CRL.', f: ['F14'], s: ['S45'] }
      ],
      routes: [['CR18', 'CR19', 'CR20', 'CR21', 'CR22']],
      anchors: { CR18: [1.3331, 103.7400] }
    },
    {
      id: 'DTL2E', name: 'Downtown Line Stage 2 Extension', color: '#005ec4', klass: 'committed',
      status: 'Committed', opens: '2035', confidence: 'High',
      summary: 'Two stations extending the DTL north from Bukit Panjang to an interchange with the NSL at Sungei Kadut. Announced under LTMP 2040 in 2019, opening 2035 - a 16-year lead time.',
      f: ['F15'], s: ['S60', 'S61', 'S62'], p: ['P19'],
      stations: [
        { code: 'DT1', name: 'Bukit Panjang', lat: 1.3786, lon: 103.7625, placement: 'sited' },
        { code: 'DE1', name: 'Sungei Kadut Avenue', lat: 1.4030, lon: 103.7530, placement: 'indicative', why: 'Near Yew Tee Village.', f: ['F15'], s: ['S61', 'S62'] },
        { code: 'DE2/NS6', name: 'Sungei Kadut', lat: 1.4130, lon: 103.7560, placement: 'indicative', why: 'New NSL interchange between Yew Tee and Kranji. Together with Kranji station it is why the 14,000-home racecourse redevelopment is forecast NOT to need any new station.', f: ['F15', 'F52'], s: ['S60', 'S61', 'S62'], p: ['P19'], dgi: 'kranji' },
        { code: 'NS7', name: 'Kranji', lat: 1.4251, lon: 103.7620, status: 'open', placement: 'sited' }
      ],
      routes: [['DT1', 'DE1', 'DE2/NS6'], ['DE2/NS6', 'NS7']]
    },
    {
      id: 'NS3A', name: 'Brickland NSL station', color: '#d42e12', klass: 'committed',
      status: 'Committed', opens: 'Mid-2030s', confidence: 'High',
      summary: 'Infill NSL station between Bukit Gombak and Choa Chu Kang, serving Keat Hong, Bukit Batok West, Pavilion Park and Tengah Brickland. Announced under LTMP 2040 - a 15-17 year lead time.',
      f: ['F16', 'F44', 'F64'], s: ['S05', 'S75'], p: [], dgi: 'brickworks',
      stations: [
        { code: 'NS3', name: 'Bukit Gombak', lat: 1.3588, lon: 103.7517, status: 'open', placement: 'sited' },
        { code: 'NS3A', name: 'Brickland', lat: 1.3665, lon: 103.7480, placement: 'indicative', why: 'The Brickworks subzone added about 11,100 residents 2020-2025 and LTA has already put City Direct bus 684 there as a stopgap. The station is still a decade out, which is what keeps this area at DGI rank 7.', f: ['F16', 'F43', 'F44', 'F64'], s: ['S05', 'S75', 'S54', 'S20'], dgi: 'brickworks' },
        { code: 'NS4', name: 'Choa Chu Kang', lat: 1.3854, lon: 103.7443, status: 'open', placement: 'sited' }
      ],
      route: ['NS3', 'NS3A', 'NS4']
    },
    {
      id: 'STL-SEL', name: 'Seletar Line (arm of the STL)', color: '#00a19c', klass: 'study',
      status: 'Engineering study from 2026', opens: 'Phases from the 2040s', confidence: 'Corridor is official; alignment is NOT',
      summary: 'LTA has named the catchments - Woodlands, Sembawang, Sengkang West, Serangoon North, Whampoa, Kallang, Greater Southern Waterfront - but has published no alignment and no station list. The corridor drawn here is this analysis’s illustration of those catchments, not a plan. The first priority corridor is Sengkang West and Serangoon North.',
      f: ['F19', 'F21', 'F22', 'F23', 'F24', 'F26'], s: ['S12', 'S18', 'S19', 'S13', 'S11'], p: ['P06', 'P07', 'P08', 'P13', 'P14'],
      stations: [
        { code: 'STL-W', name: 'Woodlands (STL)', lat: 1.4369, lon: 103.7865, placement: 'model', why: 'Woodlands is a named Seletar Line catchment and an existing NSL-TEL interchange, so a northern anchor here is the obvious reading.', f: ['F19'], s: ['S12', 'S19'] },
        { code: 'STL-SY', name: 'Sembawang Shipyard area', lat: 1.4640, lon: 103.8270, placement: 'model', why: 'The shipyard relocates by 2028 and about 10,000 waterfront homes are planned. Sembawang is a named catchment. Forecast: 50% chance the STL puts a station within 800 m of the site.', f: ['F19', 'F53'], s: ['S12', 'S70', 'S71'], p: ['P10'], dgi: 'sembawang' },
        { code: 'STL-SE', name: 'Sembawang East', lat: 1.4420, lon: 103.8450, placement: 'model', why: 'The Sembawang East subzone added 7,280 residents 2020-2025 with no station inside it, on the NSL only. Independent load data flags Sembawang among the largest morning inflows.', f: ['F39', 'F40', 'F63'], s: ['S54', 'S57'], p: ['P10'], dgi: 'sembawang' },
        { code: 'STL-YE', name: 'Yishun East', lat: 1.4200, lon: 103.8480, placement: 'model', why: 'DGI rank 3 - 73,440 residents, no station inside the subzone, NSL only. But Yishun is NOT one of LTA’s named catchments, so this station requires LTA to add it. Forecast probability: 35%.', f: ['F41', 'F42', 'F63'], s: ['S54', 'S57'], p: ['P11'], dgi: 'yishun-east' },
        { code: 'STL-FV', name: 'Fernvale / Sengkang West', lat: 1.3912, lon: 103.8760, placement: 'model', why: 'DGI rank 2 and the single most likely STL station: 71,200 residents on LRT only, named by the minister as the first priority corridor, on a line LTA has already intervened on for crowding. Forecast probability: 90%.', f: ['F19', 'F23', 'F36', 'F37', 'F61'], s: ['S18', 'S20', 'S54', 'S56'], p: ['P07'], dgi: 'fernvale' },
        { code: 'STL-SN', name: 'Serangoon North (STL/CRL)', lat: 1.3690, lon: 103.8720, placement: 'model', why: 'Named in the first priority corridor and already a CRL1 station - so the value is the interchange, not new coverage. Forecast probability of an STL-CRL interchange here: 70%.', f: ['F11', 'F19', 'F23'], s: ['S18', 'S20', 'S46'], p: ['P08'] },
        { code: 'STL-WP', name: 'Whampoa', lat: 1.3230, lon: 103.8560, placement: 'model', why: 'Named catchment. The minister also hoped the line might pass parts of Toa Payoh - a remark, not a commitment.', f: ['F19', 'F25', 'F34'], s: ['S12', 'S14'] },
        { code: 'STL-KL', name: 'Kallang', lat: 1.3115, lon: 103.8714, placement: 'model', why: 'Named catchment. Bendemeer nearby is already on the DTL and barely grew (+500 residents), so this is about through-running, not unmet local demand.', f: ['F19', 'F46'], s: ['S12', 'S54'] },
        { code: 'STL-GSW', name: 'Greater Southern Waterfront', lat: 1.2725, lon: 103.8265, placement: 'model', why: 'Both STL arms are studied as meeting at the GSW. The Keppel Club homes themselves already sit beside CCL Labrador Park and Telok Blangah, which is why GSW scores near the bottom on demand gap (0.45) despite being a headline site.', f: ['F19', 'F21', 'F56'], s: ['S12', 'S13', 'S66', 'S67'], p: ['P09', 'P22'], dgi: 'gsw' }
      ],
      route: ['STL-W', 'STL-SY', 'STL-SE', 'STL-YE', 'STL-FV', 'STL-SN', 'STL-WP', 'STL-KL', 'STL-GSW']
    },
    {
      id: 'STL-TEN', name: 'Tengah Line (arm of the STL)', color: '#00a19c', klass: 'study',
      status: 'Engineering study from 2026', opens: 'Phases from the 2040s', confidence: 'Corridor is official; alignment is NOT',
      summary: 'Named catchments are Tengah, Bukit Batok, Queensway and Bukit Merah. The two arms may be merged into a single through-running line meeting at the Greater Southern Waterfront - forecast at 60%.',
      f: ['F20', 'F21', 'F22', 'F24'], s: ['S12', 'S19', 'S13'], p: ['P09', 'P12', 'P13', 'P14'],
      stations: [
        { code: 'STL-TG', name: 'Tengah (STL)', lat: 1.3640, lon: 103.7280, placement: 'model', why: 'Named catchment. Tengah gets the JRL in 2028, but the JRL is an indirect route to the city - which is the gap a Tengah Line would close.', f: ['F20', 'F07', 'F50'], s: ['S12', 'S58'], dgi: 'tengah' },
        { code: 'STL-BB', name: 'Bukit Batok (STL)', lat: 1.3490, lon: 103.7496, placement: 'model', why: 'Named catchment; commentators read Bukit Batok as the main beneficiary of the Tengah Line. Forecast probability of a station in Bukit Batok town beyond the existing NSL stations: 75%.', f: ['F20', 'F43'], s: ['S12', 'S15'], p: ['P12'], dgi: 'brickworks' },
        { code: 'STL-QW', name: 'Queensway', lat: 1.2900, lon: 103.8000, placement: 'model', why: 'Named catchment. Queenstown added 5,550 residents and already has EWL, CCL and TEL coverage, so this is a corridor link rather than a coverage fix.', f: ['F20', 'F45'], s: ['S12', 'S54'] },
        { code: 'STL-BM', name: 'Bukit Merah', lat: 1.2830, lon: 103.8180, placement: 'model', why: 'Named catchment; one of the larger mature estates without a station at its centre.', f: ['F20'], s: ['S12', 'S19'] },
        { code: 'STL-GSW', name: 'Greater Southern Waterfront', lat: 1.2725, lon: 103.8265, placement: 'model', why: 'Where the two arms are studied as meeting.', f: ['F21'], s: ['S12', 'S13'], p: ['P09'] }
      ],
      route: ['STL-TG', 'STL-BB', 'STL-QW', 'STL-BM', 'STL-GSW']
    },
    {
      id: 'PLAB', name: 'Paya Lebar Air Base interior rail (model only)', color: '#b45cf0', klass: 'model',
      status: 'Not announced - this analysis’s inference', opens: 'Announcement forecast by 2035 (80%); opening by 2045 (45%)', confidence: 'Speculative',
      summary: 'No interior rail has been announced for Paya Lebar Air Base. This corridor is an inference: 150,000 homes on about 800 ha cannot meet the government’s own 10-minute-walk target or 45-minute city target on a single edge station at Defu. The most likely delivery form is an extension or branch of an existing line (55%) rather than a brand-new standalone line.',
      f: ['F48', 'F49', 'F27', 'F28'], s: ['S49', 'S50', 'S51', 'S52', 'S77'], p: ['P15', 'P16', 'P17', 'P18'], dgi: 'plab',
      stations: [
        { code: 'CR6', name: 'Defu (CRL, committed)', lat: 1.3608, lon: 103.8920, placement: 'indicative', why: 'The only committed station touching the site, and it is on the edge.', f: ['F11', 'F48'], s: ['S46', 'S49'], dgi: 'plab' },
        { code: 'PLAB-N', name: 'PLAB north (model)', lat: 1.3720, lon: 103.9050, placement: 'model', why: 'Illustrative interior station. No such station has been announced.', f: ['F48'], s: ['S49'], p: ['P15', 'P16'], dgi: 'plab' },
        { code: 'PLAB-C', name: 'PLAB centre (model)', lat: 1.3570, lon: 103.9110, placement: 'model', why: 'Illustrative interior station at the centre of the 800 ha site - the point furthest from any committed rail.', f: ['F48', 'F28'], s: ['S49', 'S19'], p: ['P15', 'P16'], dgi: 'plab' },
        { code: 'PLAB-S', name: 'PLAB south (model)', lat: 1.3430, lon: 103.9060, placement: 'model', why: 'Illustrative interior station linking the site down to Paya Lebar interchange.', f: ['F48'], s: ['S49'], p: ['P17'], dgi: 'plab' },
        { code: 'EW8', name: 'Paya Lebar', lat: 1.3177, lon: 103.8925, placement: 'sited', why: 'Existing EWL-CCL interchange at the southern end of the site.', f: ['F48'], s: ['S49'] }
      ],
      route: ['CR6', 'PLAB-N', 'PLAB-C', 'PLAB-S', 'EW8']
    }
  ];
});
