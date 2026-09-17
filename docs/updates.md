# Update log

Newest first. One entry per real-world change absorbed into the data. See
[UPDATING.md](../UPDATING.md) for what belongs here.

---

## 2026-09-17 — initial build

Built the map from *Where Singapore's Next MRT Lines Could Go* v2.0
(16 Sep 2026), vendored at [`analysis-v2.0.md`](analysis-v2.0.md).

- **Data:** 79 sources, 64 findings, 7 operating lines (175 station entries), 17 future projects (97 station nodes), 14 demand-gap areas, 22 forecasts.
- **Provenance:** the test suite verifies every source id, grade and URL, every forecast probability and deadline, and all 14 index scores against the vendored document.
- **Unresolved forecasts:** all 22. No Brier score yet.
- **Known discrepancy:** the document's sensitivity table prints 14.8 / 14.3 for Sembawang at 2.5 / 3.5 residents per home; recomputation from its stated inputs gives 15.5 / 13.8. Conclusions unaffected; app shows computed values.
- **Next checkpoints:** TEL5 / DTL3e and RTS Link by 31 Dec 2026 (P01, P02); MOT Committee of Supply, Feb–Mar 2027 (P05, P06, P15).
