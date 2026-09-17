# CLAUDE.md

This project's agent instructions live in **[AGENTS.md](AGENTS.md)** — read it
before changing anything. It covers the ground rules (what must never be
presented as official), the data model, how to run and verify, and the gotchas.

For keeping the map current as Singapore's rail plans change — what to watch,
which sources to search, and what to edit when news lands — see
**[UPDATING.md](UPDATING.md)**.

To reproduce the research itself with a different model — the point being that
a result which only holds under one reasoner is worth knowing about — see
**[research/README.md](research/README.md)**.

Quick reference:

```bash
npm test                  # both suites, no dependencies
npm start                 # http://localhost:8080
npm run research:compare  # offline model comparison, no API keys
```
