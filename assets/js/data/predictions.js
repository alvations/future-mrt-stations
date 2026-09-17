/* Section 7: dated, falsifiable forecasts with subjective probabilities.
   These are the analysis author's estimates, NOT LTA/MOT/URA/HDB policy. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).predictions = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function p(id, group, statement, deadline, prob, reasoning, f) {
    return { id: id, group: group, statement: statement, deadline: deadline, p: prob, reasoning: reasoning, f: f.split(',') };
  }
  return [
    p('P01', 'Near-term delivery', 'TEL5 and DTL3e (Bedok South, Sungei Bedok, Xilin) enter passenger service', '31 Dec 2026', 0.80, 'Official 2H 2026 target reaffirmed repeatedly, but not open by mid-September and 4 of 4 recent projects slipped.', 'F03,F05'),
    p('P02', 'Near-term delivery', 'RTS Link starts passenger service', '31 Dec 2026', 0.65, 'Target end-2026 and the first train demo is done; some reports flag a possible early-2027 slip.', 'F17'),
    p('P03', 'Near-term delivery', 'JRL Stage 1 opens', '31 Dec 2028', 0.75, 'Mid-2028 target with LTA adding manpower; one slip already absorbed.', 'F07'),
    p('P04', 'Near-term delivery', 'CRL Phase 1 opens', '31 Dec 2030', 0.65, '2030 target, tunnelling-heavy, against a delay base rate of 4 in 4.', 'F11'),
    p('P05', 'Near-term delivery', 'LTA publishes the next Land Transport Master Plan (successor to LTMP 2040)', '31 Dec 2028', 0.55, 'LTA says engagement begins "soon"; LTMP 2040 came about nine months after its consultation launch.', 'F29'),
    p('P06', 'Seletar-Tengah Line', 'Government publicly confirms the STL (or first phase) will proceed, with named station locations', '31 Mar 2029', 0.55, 'Engineering study started 2026. The CRL took about six years from announcement to a Phase 1 station list, though a focused first phase could be faster.', 'F23,F24'),
    p('P07', 'Seletar-Tengah Line', 'The first announced STL phase includes a station in Fernvale / Sengkang West', 'At first alignment announcement', 0.90, 'Named top priority by the minister; demand-gap rank 2.', 'F23,F37'),
    p('P08', 'Seletar-Tengah Line', 'STL interchanges with the CRL at or near Serangoon North', 'At alignment announcement', 0.70, 'The minister cited a possible CRL connection; Serangoon North is a CRL1 station and a named STL catchment.', 'F11,F19,F23'),
    p('P09', 'Seletar-Tengah Line', 'STL is confirmed as a single merged through-running line', 'At alignment announcement', 0.60, 'Explicitly under study, with the TEL precedent of merging two lines.', 'F21,F24'),
    p('P10', 'Seletar-Tengah Line', 'STL includes a station within about 800 m of the former Sembawang Shipyard', 'At alignment announcement', 0.50, 'Sembawang is a named catchment and the shipyard frees about 10,000 homes; demand-gap rank 4.', 'F19,F53'),
    p('P11', 'Seletar-Tengah Line', 'STL includes a station serving Yishun East', 'At alignment announcement', 0.35, 'High demand gap (rank 3), but Yishun is NOT a named catchment, so this requires LTA to add it.', 'F19,F42'),
    p('P12', 'Seletar-Tengah Line', 'STL’s Tengah arm has a station in Bukit Batok town beyond the existing NSL stations', 'At alignment announcement', 0.75, 'Named catchment; commentators see Bukit Batok as the main beneficiary.', 'F20,F43'),
    p('P13', 'Seletar-Tengah Line', 'Any STL segment opens for passenger service', '31 Dec 2039', 0.10, 'Official line is "from the 2040s"; base lead times of 12-16 years from 2025-26 point to about 2038-2042 at best.', 'F22'),
    p('P14', 'Seletar-Tengah Line', 'Any STL segment opens for passenger service', '31 Dec 2045', 0.55, 'Consistent with "phases from the 2040s" plus the delay base rate.', 'F22'),
    p('P15', 'Paya Lebar Air Base', 'Government announces a rail line, branch or extension with at least one station INSIDE the PLAB site (not just CRL Defu on the edge)', '31 Dec 2030', 0.45, 'Demand-gap rank 1 by a wide margin, but relocation is only "from the 2030s" and development spans 2-3 decades, so detailed plans may wait.', 'F48'),
    p('P16', 'Paya Lebar Air Base', 'Same as P15, by the later deadline', '31 Dec 2035', 0.80, '150,000 homes on 800 ha cannot meet the 10-minute-walk target or the 45-minute city target without interior rail.', 'F48,F27,F28'),
    p('P17', 'Paya Lebar Air Base', 'The first PLAB interior rail is delivered by extending or branching an existing/planned line rather than a brand-new standalone line', 'At announcement', 0.55, 'LTA recently favours merging and extending, but the site size could justify a new line.', 'F21,F10,F15'),
    p('P18', 'Paya Lebar Air Base', 'First PLAB interior station opens', '31 Dec 2045', 0.45, 'Lead-time base rate of 12-16 years from a 2030-35 announcement.', 'F48'),
    p('P19', 'Negative forecasts', 'No new MRT line or station is announced specifically for the Kranji racecourse site, beyond existing Kranji and Sungei Kadut (2035)', '31 Dec 2032', 0.80, 'The site adjoins Kranji station with a sheltered walkway and the Sungei Kadut interchange is coming.', 'F52,F15'),
    p('P20', 'Negative forecasts', 'No additional station is announced for Bukit Timah Turf City beyond CRL2 Turf City', '31 Dec 2032', 0.85, 'CRL2 Turf City opens in 2032, before the homes.', 'F12,F51'),
    p('P21', 'Negative forecasts', 'No new station is announced for Chencharu beyond Khatib', '31 Dec 2035', 0.90, 'The estate is designed around Khatib.', 'F54'),
    p('P22', 'Negative forecasts', 'No new station is announced for GSW Keppel Club, Dover-Medway, Newton or Paterson', '31 Dec 2032', 0.85, 'All are adjacent to existing stations; demand gap below 1.', 'F56,F57,F58')
  ];
});
