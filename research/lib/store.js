/* Run storage: JSONL records, a response cache, and run directories.

   The cache is keyed by everything that affects a response, so re-scoring or
   adding a model never re-spends on calls already made. Raw responses are kept
   verbatim: a comparison nobody can audit is not a comparison. */
'use strict';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var ROOT = path.join(__dirname, '..', 'runs');

function ensure(dir) { fs.mkdirSync(dir, { recursive: true }); return dir; }

function runDir(id) { return ensure(path.join(ROOT, id)); }

function runId(stamp) {
  var d = stamp || new Date();
  return d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function appendJsonl(file, obj) {
  ensure(path.dirname(file));
  fs.appendFileSync(file, JSON.stringify(obj) + '\n');
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(function (l) {
    try { return JSON.parse(l); } catch (e) { return null; }
  }).filter(Boolean);
}

function cacheKey(parts) {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
}

function cachePath(key) { return path.join(ensure(path.join(ROOT, 'cache')), key + '.json'); }

function cacheGet(key) {
  var p = cachePath(key);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
}

function cacheSet(key, value) {
  fs.writeFileSync(cachePath(key), JSON.stringify(value));
  return value;
}

module.exports = { ROOT, ensure, runDir, runId, appendJsonl, readJsonl, cacheKey, cacheGet, cacheSet };
