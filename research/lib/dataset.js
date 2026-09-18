/* The one place the harness touches the dataset it is scored against.

   Before this existed, six files reached across the tree into ../../assets,
   which meant the harness could only ever run inside this repo and against
   this one corpus. Everything now goes through here, so:

     - the package has a single, documented dependency on its data
     - a missing dataset fails with an explanation instead of MODULE_NOT_FOUND
     - the harness can be pointed at a DIFFERENT corpus, which is the point of
       packaging it: the tasks are about research process, not about Singapore

   Resolution order:
     1. MRT_DATA_ROOT            - an explicit directory, for an external dataset
     2. the linked data package  - when installed as a workspace/dependency
     3. ../../assets             - the repo checkout this package lives in

   A dataset root is a directory containing js/data/{sources,findings,areas,
   predictions}.js and js/dgi.js, each a UMD module exporting its array (see
   AGENTS.md section 6 for the shapes). */
'use strict';
var fs = require('fs');
var path = require('path');

var FILES = {
  sources: 'js/data/sources.js',
  findings: 'js/data/findings.js',
  areas: 'js/data/areas.js',
  predictions: 'js/data/predictions.js',
  network: 'js/data/network.js',
  future: 'js/data/future.js',
  dgi: 'js/dgi.js'
};

var REQUIRED = ['sources', 'findings', 'areas', 'predictions', 'dgi'];

function looksLikeRoot(dir) {
  return !!dir && REQUIRED.every(function (k) { return fs.existsSync(path.join(dir, FILES[k])); });
}

function candidates() {
  var out = [];
  if (process.env.MRT_DATA_ROOT) out.push({ source: 'env', why: 'MRT_DATA_ROOT', dir: path.resolve(process.env.MRT_DATA_ROOT) });
  try {
    /* Present when the harness is installed alongside a published dataset
       package rather than used inside the repo. */
    out.push({ source: 'package', why: 'mrt-map-data package', dir: path.dirname(require.resolve('mrt-map-data/package.json')) });
  } catch (e) { /* not installed - normal inside the repo */ }
  out.push({ source: 'repo', why: 'repo checkout', dir: path.resolve(__dirname, '..', '..', 'assets') });
  return out;
}

var chosen = null;
function root() {
  if (chosen) return chosen;
  var tried = candidates();
  for (var i = 0; i < tried.length; i++) {
    if (looksLikeRoot(tried[i].dir)) { chosen = tried[i]; return chosen; }
  }
  throw new Error(
    'No dataset found. The harness scores models against a corpus, and could not locate one.\n' +
    'Looked in:\n' + tried.map(function (t) { return '  - ' + t.dir + '  (' + t.why + ')'; }).join('\n') + '\n' +
    'A dataset root holds ' + REQUIRED.map(function (k) { return FILES[k]; }).join(', ') + '.\n' +
    'Set MRT_DATA_ROOT to point at one.'
  );
}

var cache = {};
function load(id) {
  if (!FILES[id]) throw new Error('unknown dataset module "' + id + '" (have: ' + Object.keys(FILES).join(', ') + ')');
  if (!cache[id]) {
    var file = path.join(root().dir, FILES[id]);
    /* network and future are not in REQUIRED - the six tasks do not need them,
       so an external corpus need not supply them. Asking for one that is
       absent must say so, rather than surfacing a bare MODULE_NOT_FOUND. */
    if (!fs.existsSync(file)) {
      throw new Error('dataset module "' + id + '" is not in this corpus.\n' +
        '  expected: ' + file + '\n' +
        (REQUIRED.indexOf(id) < 0
          ? '  (optional: the six tasks do not need it, but something asked for it)'
          : '  (required by the tasks)'));
    }
    cache[id] = require(file);
  }
  return cache[id];
}

/* Recorded in every run's meta.json, so a report always says which corpus
   produced it. */
function describe() {
  var r = root();
  return {
    root: r.dir,
    resolvedVia: r.source,
    counts: {
      sources: load('sources').length,
      findings: load('findings').length,
      areas: load('areas').length,
      predictions: load('predictions').length
    }
  };
}

module.exports = {
  FILES: FILES,
  root: root,
  load: load,
  describe: describe,
  get sources() { return load('sources'); },
  get findings() { return load('findings'); },
  get areas() { return load('areas'); },
  get predictions() { return load('predictions'); },
  get network() { return load('network'); },
  get future() { return load('future'); },
  get dgi() { return load('dgi'); }
};
