#!/usr/bin/env node
/* Audit every demand area's access gap against the map's own geometry.

     node tools/access-check.js           # table
     node tools/access-check.js --json    # machine-readable

   Exits non-zero if any area's declared access band contradicts the distance
   to the nearest open or committed station. The test suite runs the same check,
   so adding a station that changes an area's access gap cannot pass silently.

   The distances are straight lines between approximate coordinates, not walks.
   See assets/js/access.js for what that does and does not support. */
'use strict';
var path = require('path');
var root = path.join(__dirname, '..');
var access = require(path.join(root, 'assets', 'js', 'access.js'));
var areas = require(path.join(root, 'assets', 'js', 'data', 'areas.js'));
var network = require(path.join(root, 'assets', 'js', 'data', 'network.js'));
var future = require(path.join(root, 'assets', 'js', 'data', 'future.js'));

var report = access.audit(areas, network, future);
var json = process.argv.indexOf('--json') >= 0;

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Access gap vs geometry   (straight line from each area\'s plotted centre;');
  console.log('                          a 10-minute walk is about ' + access.WALK_M + ' m, margin ' + access.MARGIN_M + ' m)\n');
  console.log('area'.padEnd(28) + 'A'.padEnd(9) + 'nearest open'.padEnd(26) + 'nearest open|committed'.padEnd(30) + 'verdict');
  console.log('-'.repeat(104));
  report.forEach(function (r) {
    var A = r.components.map(function (c) { return c.A; }).join('/');
    var open = r.nearestOpen ? r.nearestOpen.name + ' ' + access.format(r.nearestOpen.metres) : '-';
    var any = r.nearestAny ? r.nearestAny.name + ' ' + access.format(r.nearestAny.metres) +
      (r.nearestAny.kind === 'committed' ? ' (committed)' : '') : '-';
    var verdict = r.contradictions.length ? 'CONTRADICTS' : (r.withinWalk ? 'consistent, within walk' : 'consistent');
    console.log(r.name.slice(0, 27).padEnd(28) + String(A).padEnd(9) + open.slice(0, 25).padEnd(26) + any.slice(0, 29).padEnd(30) + verdict);
  });
  var bad = report.filter(function (r) { return r.contradictions.length; });
  if (bad.length) {
    console.log('\nContradictions:');
    bad.forEach(function (r) {
      r.contradictions.forEach(function (c) { console.log('  ' + r.name + ': ' + c.reason); });
    });
  } else {
    console.log('\nNo contradictions: every declared access band is compatible with the geometry.');
  }
}

process.exit(report.some(function (r) { return r.contradictions.length; }) ? 1 : 0);
