/* DuckDuckGo HTML endpoint - no key, but no stability guarantees either.

   Fine for exploration, poor for a published comparison: results move between
   runs and the endpoint may rate-limit or change shape without notice. Prefer
   a self-hosted SearXNG, or the offline fixtures, when the numbers matter. */
'use strict';

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

async function search(query, opts) {
  var k = (opts && opts.k) || 5;
  var res = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query), {
    headers: { 'user-agent': 'future-mrt-stations research harness', accept: 'text/html' }
  });
  if (!res.ok) throw new Error('duckduckgo ' + res.status);
  var html = await res.text();
  var out = [];
  var re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  var m;
  while ((m = re.exec(html)) && out.length < k) {
    var href = decode(m[1]);
    var uddg = href.match(/[?&]uddg=([^&]+)/);
    out.push({ url: uddg ? decodeURIComponent(uddg[1]) : href, title: decode(m[2].replace(/<[^>]+>/g, '')).trim(), snippet: '' });
  }
  return out;
}

module.exports = { search, id: 'duckduckgo' };
