/* SearXNG backend - open source, self-hostable, no API key.

     docker run -p 8888:8080 searxng/searxng
     SEARXNG_URL=http://localhost:8888 node research/run.js --search searxng ...

   Needs `search.formats: [json]` enabled in the instance's settings.yml.
   Self-hosting matters for a comparison: a public instance rate-limits and
   reorders results, so runs stop being reproducible. */
'use strict';

async function search(query, opts) {
  var base = (process.env.SEARXNG_URL || 'http://localhost:8888').replace(/\/$/, '');
  var k = (opts && opts.k) || 5;
  var url = base + '/search?q=' + encodeURIComponent(query) + '&format=json&safesearch=0';
  var res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error('searxng ' + res.status + ' (is search.formats: [json] enabled?)');
  var json = await res.json();
  return (json.results || []).slice(0, k).map(function (r) {
    return { title: r.title, url: r.url, snippet: r.content || '', engine: r.engine };
  });
}

module.exports = { search, id: 'searxng' };
