---
'@getodk/xforms-engine': patch
---

Fix: relax parsing of `jr:preload` and `jr:preloadParams`. Any value for either attribute is accepted. Known (specified in ODK XForms, at time of writing) values are provided as type hints, similarly to how known appearances are specified.
