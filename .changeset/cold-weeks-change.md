---
'@getodk/xforms-engine': minor
---

- Compute `jr:preload="uid"` on form initialization.
- Ensure submission XML incluces `instanceID` metadata. If not present in form definition, defaults to computing `jr:preload="uid"`.
- Support for use of non-default (XForms) namespaces by primary instance elements, including:
  - Production of form-defined namespace declarations in submission XML;
  - Preservation of form-defined namespace prefix;
  - Use of namespace prefix in bind nodeset;
  - Use of namespace prefix in computed expressions.
- Support for use of non-default namespaces by internal secondary instances.
- Partial support for use of non-default namespaces by external XML secondary instances. (Namespaces may be resolved to engine-internal defaults.)
