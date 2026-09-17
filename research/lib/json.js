/* Tolerant JSON extraction.

   Small open models wrap JSON in prose, fence it, add trailing commas or emit
   single quotes. Failing them on formatting would measure politeness, not
   capability, so the harness repairs what it safely can and reports a
   schema_ok rate separately. Every repair is recorded, so "needed repair" is
   itself a comparable metric. */
'use strict';

function stripFences(s) {
  return s.replace(/```(?:json|JSON)?\s*([\s\S]*?)```/g, '$1');
}

/* Find the first balanced {...} or [...] , respecting strings and escapes. */
function firstBalanced(s) {
  var open = null, depth = 0, start = -1, inStr = false, quote = null, esc = false;
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; quote = c; continue; }
    if (c === '{' || c === '[') {
      if (start < 0) { start = i; open = c; depth = 0; }
      if (c === open) depth++;
    } else if ((c === '}' && open === '{') || (c === ']' && open === '[')) {
      depth--;
      if (depth === 0 && start >= 0) return s.slice(start, i + 1);
    }
  }
  return start >= 0 ? s.slice(start) : null;
}

/* Repairs are applied CUMULATIVELY - malformed output usually has more than one
   problem at once (bare keys AND single quotes, say) - and only after the raw
   text has already failed to parse, so a valid document is never touched. */
var REPAIRS = [
  function (x) { return x.replace(/,\s*([}\]])/g, '$1'); },              // trailing commas
  function (x) { return x.replace(/\bNaN\b|\bInfinity\b/g, 'null'); },  // non-JSON numbers
  function (x) { return x.replace(/([{,]\s*)([A-Za-z_][\w-]*)(\s*:)/g, '$1"$2"$3'); }, // bare keys
  function (x) { return x.replace(/'/g, '"'); }                          // single quotes
];

function candidates(raw) {
  var out = [raw], cur = raw;
  for (var i = 0; i < REPAIRS.length; i++) { cur = REPAIRS[i](cur); out.push(cur); }
  return out;
}

/* Returns { ok, value, repaired, error }. Never throws. */
function extractJson(text) {
  if (text == null) return { ok: false, value: null, repaired: false, error: 'empty response' };
  var candidate = firstBalanced(stripFences(String(text))) || String(text).trim();
  var tries = candidates(candidate), last = null;
  for (var i = 0; i < tries.length; i++) {
    try {
      return { ok: true, value: JSON.parse(tries[i]), repaired: i > 0, error: null };
    } catch (e) {
      last = e;
    }
  }
  return { ok: false, value: null, repaired: false, error: String(last && last.message || 'unparseable') };
}

/* Some tasks want a bare number ("0.65", "65%", "about 0.65"). */
function extractNumber(text) {
  var j = extractJson(text);
  if (j.ok && typeof j.value === 'number') return { ok: true, value: j.value, repaired: false };
  if (j.ok && j.value && typeof j.value === 'object') {
    var keys = Object.keys(j.value);
    for (var i = 0; i < keys.length; i++) {
      if (typeof j.value[keys[i]] === 'number') return { ok: true, value: j.value[keys[i]], repaired: j.repaired };
    }
  }
  var m = String(text == null ? '' : text).match(/-?\d+(?:\.\d+)?\s*%?/);
  if (!m) return { ok: false, value: null, repaired: false, error: 'no number found' };
  var n = parseFloat(m[0]);
  if (/%/.test(m[0])) n = n / 100;
  return { ok: true, value: n, repaired: true };
}

module.exports = { extractJson, extractNumber, firstBalanced, stripFences, candidates };
