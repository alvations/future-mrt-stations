/* Prompt templates.

   Templates are plain markdown with {{placeholders}} and live in
   research/prompts/. Deliberately plain: no XML tagging, no role-play, no
   provider-specific tricks, nothing tuned to one family's quirks. A prompt that
   flatters one model invalidates the comparison. */
'use strict';
var fs = require('fs');
var path = require('path');

var DIR = path.join(__dirname, '..', 'prompts');
var cache = {};

function load(name) {
  if (!cache[name]) cache[name] = fs.readFileSync(path.join(DIR, name + '.md'), 'utf8');
  return cache[name];
}

function render(name, vars) {
  return load(name).replace(/\{\{(\w+)\}\}/g, function (_, k) {
    return k in (vars || {}) ? String(vars[k]) : '';
  });
}

module.exports = { render, load, DIR };
