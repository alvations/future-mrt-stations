/* The three LRT systems.

   The map left these out at first, which undersold its own central argument:
   Fernvale is the second-ranked demand area precisely BECAUSE its 71,200
   residents have light rail and no MRT. An argument about what a place lacks
   reads better when you can see what it has.

   These are deliberately NOT part of assets/js/data/network.js, because
   assets/js/access.js measures the access gap against heavy rail. Folding LRT
   into the MRT network would quietly close the very gap the analysis is about.

   Coordinates are approximate, as everywhere else on this map. Loops are listed
   in running order and close back on their interchange. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else (root.MRT = root.MRT || {}).lrt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function st(a) { return { code: a[0], name: a[1], lat: a[2], lon: a[3] }; }
  function line(id, name, color, rows, note) {
    return { id: id, name: name, color: color, klass: 'lrt', note: note, stations: rows.map(st) };
  }

  return [
    line('BPLRT', 'Bukit Panjang LRT', '#99aabb', [
      ['BP1', 'Choa Chu Kang', 1.3854, 103.7443],
      ['BP2', 'South View', 1.3804, 103.7452],
      ['BP3', 'Keat Hong', 1.3786, 103.7490],
      ['BP4', 'Teck Whye', 1.3766, 103.7538],
      ['BP5', 'Phoenix', 1.3786, 103.7580],
      ['BP6', 'Bukit Panjang', 1.3786, 103.7625],
      ['BP7', 'Petir', 1.3777, 103.7667],
      ['BP8', 'Pending', 1.3760, 103.7713],
      ['BP9', 'Bangkit', 1.3800, 103.7725],
      ['BP10', 'Fajar', 1.3843, 103.7707],
      ['BP11', 'Segar', 1.3878, 103.7693],
      ['BP12', 'Jelapang', 1.3866, 103.7645],
      ['BP13', 'Senja', 1.3828, 103.7623],
      ['BP6b', 'Bukit Panjang', 1.3786, 103.7625]
    ], 'Serves Bukit Panjang town; feeds the DTL and the NSL at Choa Chu Kang.'),

    line('SKLRT-W', 'Sengkang LRT, West Loop', '#99aabb', [
      ['STC', 'Sengkang', 1.3916, 103.8950],
      ['SW1', 'Cheng Lim', 1.3964, 103.8938],
      ['SW2', 'Farmway', 1.3971, 103.8892],
      ['SW3', 'Kupang', 1.3983, 103.8818],
      ['SW4', 'Thanggam', 1.3972, 103.8756],
      ['SW5', 'Fernvale', 1.3918, 103.8762],
      ['SW6', 'Layar', 1.3918, 103.8800],
      ['SW7', 'Tongkang', 1.3894, 103.8858],
      ['SW8', 'Renjong', 1.3870, 103.8900],
      ['STCb', 'Sengkang', 1.3916, 103.8950]
    ], 'The only rail inside Fernvale, the second-ranked demand area: it feeds the NEL at Sengkang rather than reaching the city.'),

    line('SKLRT-E', 'Sengkang LRT, East Loop', '#99aabb', [
      ['STC', 'Sengkang', 1.3916, 103.8950],
      ['SE1', 'Compassvale', 1.3944, 103.9004],
      ['SE2', 'Rumbia', 1.3915, 103.9057],
      ['SE3', 'Bakau', 1.3880, 103.9053],
      ['SE4', 'Kangkar', 1.3838, 103.9020],
      ['SE5', 'Ranggung', 1.3836, 103.8968],
      ['STCb', 'Sengkang', 1.3916, 103.8950]
    ], null),

    line('PGLRT-E', 'Punggol LRT, East Loop', '#99aabb', [
      ['PTC', 'Punggol', 1.4052, 103.9024],
      ['PE1', 'Cove', 1.3994, 103.9060],
      ['PE2', 'Meridian', 1.3970, 103.9088],
      ['PE3', 'Coral Edge', 1.3940, 103.9125],
      ['PE4', 'Riviera', 1.3945, 103.9163],
      ['PE5', 'Kadaloor', 1.3996, 103.9165],
      ['PE6', 'Oasis', 1.4024, 103.9125],
      ['PE7', 'Damai', 1.4053, 103.9085],
      ['PTCb', 'Punggol', 1.4052, 103.9024]
    ], 'Riviera becomes a CRL interchange in 2032; LTA is adding 25 more vehicles across the Sengkang and Punggol systems.'),

    line('PGLRT-W', 'Punggol LRT, West Loop', '#99aabb', [
      ['PTC', 'Punggol', 1.4052, 103.9024],
      ['PW1', 'Sam Kee', 1.4098, 103.9050],
      ['PW2', 'Teck Lee', 1.4128, 103.9065],
      ['PW3', 'Punggol Point', 1.4170, 103.9065],
      ['PW4', 'Samudera', 1.4157, 103.9020],
      ['PW5', 'Nibong', 1.4118, 103.9004],
      ['PW6', 'Sumang', 1.4085, 103.8985],
      ['PW7', 'Soo Teck', 1.4053, 103.8977],
      ['PTCb', 'Punggol', 1.4052, 103.9024]
    ], null)
  ];
});
