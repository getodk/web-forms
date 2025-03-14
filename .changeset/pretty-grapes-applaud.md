---
'@getodk/xforms-engine': minor
---

**BREAKING CHANGE** instance payload data is always produced as a tuple. The shape for a "chunked" payload is unchanged. The shape for a "monolithic" payload is now more like a "chunked" payload, except that it is guaranteed to always have only one item.
