/* Search registry. Same idea as the provider registry: retrieval is a research
   component, so it is swappable and recorded, not hard-wired.

   Which backend you pick changes what a retrieval score means:
     fixtures    offline, deterministic, closed corpus - use for comparisons
     searxng     live web, self-hosted, reproducible if you pin the instance
     duckduckgo  live web, no key, not reproducible - exploration only */
'use strict';

var BACKENDS = {
  fixtures: require('./fixtures.js'),
  searxng: require('./searxng.js'),
  duckduckgo: require('./duckduckgo.js')
};

function resolve(id) {
  var b = BACKENDS[id || 'fixtures'];
  if (!b) throw new Error('unknown search backend "' + id + '" (have: ' + Object.keys(BACKENDS).join(', ') + ')');
  return b;
}

module.exports = { BACKENDS, resolve };
