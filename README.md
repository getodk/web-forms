# ODK Web Forms

With ODK Web Forms, you can define forms with powerful logic using the spreadsheet-based [XLSForm standard](https://docs.getodk.org/xlsform/). Use [our Vue-based frontend](/packages/web-forms/) or build your own user experience around [the engine](/packages/xforms-engine/)!

The packages are available [on npm](https://www.npmjs.com/search?q=getodk).

> [!WARNING]
> This repository is archived

Development of ODK Web Forms has moved to the [ODK Central Frontend](https://github.com/getodk/central-frontend) repository. This allows us to write end-to-end tests that cover the full form-filling experience, which speeds up development and helps us catch regressions early. We timed this change to coincide with Web Forms becoming the default for new forms in ODK Central.

We continue to publish the following packages to npm:

- [`@getodk/web-forms`](https://www.npmjs.com/package/@getodk/web-forms) — Vue component for form filling
- [`@getodk/xforms-engine`](https://www.npmjs.com/package/@getodk/xforms-engine) — XForms engine
- [`@getodk/xpath`](https://www.npmjs.com/package/@getodk/xpath) — XPath evaluator with ODK XForms extensions
- [`@getodk/tree-sitter-xpath`](https://www.npmjs.com/package/@getodk/tree-sitter-xpath) — XPath grammar for tree-sitter

**For fork maintainers:** if you maintain a fork of this repository or of Central Frontend with local changes, you should be able to migrate those changes without manually recreating moved files. We recommend planning your update after the Central v2026.2 release in June 2026. For more details and guidance, see the [announcement on the ODK forum](https://forum.getodk.org/t/migrating-web-forms-code-to-central-frontend-repository/58177).

### Feature matrix

This section is auto generated. Please update `feature-matrix.json` and then run `npm run feature-matrix` from the repository's root to update it.

<!-- autogen: feature-matrix -->

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Question types (basic functionality)<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜ 91\%

  </summary>
  <br/>

| Feature <img width=250px/>                                 | Progress |
| ---------------------------------------------------------- | :------: |
| text                                                       |    ✅    |
| integer                                                    |    ✅    |
| decimal                                                    |    ✅    |
| note                                                       |    ✅    |
| select_one                                                 |    ✅    |
| select_multiple                                            |    ✅    |
| select\_\*\_from_file                                      |    ✅    |
| repeat                                                     |    ✅    |
| group                                                      |    ✅    |
| geopoint                                                   |    ✅    |
| geotrace                                                   |    ✅    |
| geoshape                                                   |    ✅    |
| start-geopoint                                             |    ✅    |
| range                                                      |    ✅    |
| image                                                      |    ✅    |
| barcode                                                    |          |
| audio                                                      |    ✅    |
| background-audio                                           |          |
| video                                                      |    ✅    |
| [file](https://github.com/getodk/web-forms/issues/370)     |    ✅    |
| [date](https://github.com/getodk/web-forms/issues/311)     |    ✅    |
| [time](https://github.com/getodk/web-forms/issues/590)     |    ✅    |
| [datetime](https://github.com/getodk/web-forms/issues/697) |    ✅    |
| rank                                                       |    ✅    |
| csv-external                                               |    ✅    |
| acknowledge                                                |    ✅    |
| start                                                      |    ✅    |
| end                                                        |    ✅    |
| today                                                      |    ✅    |
| deviceid                                                   |    ✅    |
| username                                                   |    ✅    |
| phonenumber                                                |    ✅    |
| email                                                      |    ✅    |
| audit                                                      |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Appearances<br/>🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜ 47\%

  </summary>
  <br/>

| Feature <img width=250px/>                                      | Progress |
| --------------------------------------------------------------- | :------: |
| numbers                                                         |    ✅    |
| multiline                                                       |    ✅    |
| url                                                             |          |
| ex:                                                             |          |
| thousands-sep                                                   |    ✅    |
| bearing                                                         |          |
| [vertical](https://github.com/getodk/web-forms/issues/271)      |          |
| [no-ticks](https://github.com/getodk/web-forms/issues/271)      |          |
| picker                                                          |          |
| [rating](https://github.com/getodk/web-forms/issues/711)        |    ✅    |
| new                                                             |          |
| new-front                                                       |          |
| draw                                                            |          |
| [annotate](https://github.com/getodk/web-forms/issues/15)       |          |
| signature                                                       |          |
| [no-calendar](https://github.com/getodk/web-forms/issues/781)   |          |
| [month-year](https://github.com/getodk/web-forms/issues/782)    |    ✅    |
| [year](https://github.com/getodk/web-forms/issues/782)          |    ✅    |
| [ethiopian](https://github.com/getodk/web-forms/issues/315)     |          |
| [coptic](https://github.com/getodk/web-forms/issues/315)        |          |
| [islamic](https://github.com/getodk/web-forms/issues/315)       |          |
| [bikram-sambat](https://github.com/getodk/web-forms/issues/315) |          |
| [myanmar](https://github.com/getodk/web-forms/issues/315)       |          |
| [persian](https://github.com/getodk/web-forms/issues/315)       |          |
| placement-map                                                   |    ✅    |
| maps                                                            |    ✅    |
| hide-input                                                      |          |
| minimal                                                         |    ✅    |
| search / autocomplete                                           |    ✅    |
| [quick](https://github.com/getodk/web-forms/issues/515)         |          |
| columns-pack                                                    |    ✅    |
| columns                                                         |    ✅    |
| columns-n                                                       |    ✅    |
| no-buttons                                                      |    ✅    |
| image-map                                                       |          |
| likert                                                          |    ✅    |
| map                                                             |    ✅    |
| field-list                                                      |    ✅    |
| label                                                           |    ✅    |
| list-nolabel                                                    |    ✅    |
| list                                                            |    ✅    |
| table-list                                                      |    ✅    |
| counter                                                         |          |
| hidden-answer                                                   |          |
| printer                                                         |          |
| masked                                                          |    ✅    |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Parameters<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 66\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                                         | Progress |
| ---------------------------------------------------------------------------------------------------------------------------------- | :------: |
| randomize                                                                                                                          |    ✅    |
| seed                                                                                                                               |    ✅    |
| value                                                                                                                              |    ✅    |
| label                                                                                                                              |    ✅    |
| rows                                                                                                                               |    ✅    |
| geopoint capture-accuracy,<br/>warning-accuracy, allow-mock-accuracy                                                               |    ✅    |
| range start, end, step                                                                                                             |    ✅    |
| [image max-pixels](https://github.com/getodk/web-forms/issues/397)                                                                 |    ✅    |
| audio quality                                                                                                                      |          |
| Audit: location-priority,<br/>location-min-interval, location-max-age,<br/>track-changes, track-changes-reasons,<br/>identify-user |          |
| [geotrace/shape incremental=true](https://github.com/getodk/web-forms/issues/562)                                                  |          |
| range labels, placeholder                                                                                                          |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Form logic<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100\%

  </summary>
  <br/>

| Feature <img width=250px/>                      | Progress |
| ----------------------------------------------- | :------: |
| calculate                                       |    ✅    |
| relevant                                        |    ✅    |
| required                                        |    ✅    |
| required message                                |    ✅    |
| custom constraint                               |    ✅    |
| constraint message                              |    ✅    |
| read only                                       |    ✅    |
| dynamic defaults (including trigger<br/>column) |    ✅    |
| choice filter                                   |    ✅    |
| default                                         |    ✅    |
| repeat_count                                    |    ✅    |
| create or update Entities                       |    ✅    |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Descriptions and annotations<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 75\%

  </summary>
  <br/>

| Feature <img width=250px/>                                     | Progress |
| -------------------------------------------------------------- | :------: |
| label                                                          |    ✅    |
| hint                                                           |    ✅    |
| [guidance hint](https://github.com/getodk/web-forms/issues/53) |          |
| form translations                                              |    ✅    |
| form translations with ref to other<br/>field                  |    ✅    |
| Markdown                                                       |    ✅    |
| Inline HTML                                                    |    ✅    |
| [image](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| big-image                                                      |          |
| [audio](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| [video](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| autoplay                                                       |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Theme and layouts<br/>🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 30\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                 | Progress |
| -------------------------------------------------------------------------- | :------: |
| [grid](https://github.com/getodk/web-forms/issues/16)                      |          |
| [pages](https://github.com/getodk/web-forms/issues/254)                    |          |
| [logo](https://github.com/getodk/web-forms/issues/353)                     |          |
| [application translations](https://github.com/getodk/web-forms/issues/332) |          |
| [theme color](https://github.com/getodk/web-forms/issues/43)               |          |
| preview form                                                               |    ✅    |
| send instance                                                              |    ✅    |
| view instance                                                              |          |
| edit instance                                                              |    ✅    |
| table of contents                                                          |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### XPath<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 98\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                    | Progress |
| ------------------------------------------------------------------------------------------------------------- | :------: |
| operators                                                                                                     |    ✅    |
| predicates                                                                                                    |    ✅    |
| axes                                                                                                          |    ✅    |
| string(\* arg)                                                                                                |    ✅    |
| concat(string arg*\|node-set arg*)                                                                            |    ✅    |
| join(string separator, node-set nodes\*)                                                                      |    ✅    |
| substr(string value, number start,<br/>number end?)                                                           |    ✅    |
| substring-before(string, string)                                                                              |    ✅    |
| substring-after(string, string)                                                                               |    ✅    |
| translate(string, string, string)                                                                             |    ✅    |
| string-length(string arg)                                                                                     |    ✅    |
| normalize-space(string arg?)                                                                                  |    ✅    |
| contains(string haystack, string needle)                                                                      |    ✅    |
| starts-with(string haystack, string<br/>needle)                                                               |    ✅    |
| ends-with(string haystack, string<br/>needle)                                                                 |    ✅    |
| uuid(number?)                                                                                                 |    ✅    |
| digest(string src, string algorithm,<br/>string encoding?)                                                    |    ✅    |
| pulldata(string instance_id, string<br/>desired_element, string query_element,<br/>string query)              |    ✅    |
| if(boolean condition, _ then, _ else)                                                                         |    ✅    |
| coalesce(string arg1, string arg2)                                                                            |    ✅    |
| once(string calc)                                                                                             |    ✅    |
| true()                                                                                                        |    ✅    |
| false()                                                                                                       |    ✅    |
| boolean(\* arg)                                                                                               |    ✅    |
| boolean-from-string(string arg)                                                                               |    ✅    |
| not(boolean arg)                                                                                              |    ✅    |
| regex(string value, string expression)                                                                        |    ✅    |
| checklist(number min, number max, string<br/>v\*)                                                             |    ✅    |
| weighted-checklist(number min, number<br/>max, [string v, string w]\*)                                        |    ✅    |
| number(\* arg)                                                                                                |    ✅    |
| random()                                                                                                      |    ✅    |
| int(number arg)                                                                                               |    ✅    |
| sum(node-set arg)                                                                                             |    ✅    |
| max(node-set arg\*)                                                                                           |    ✅    |
| min(node-set arg\*)                                                                                           |    ✅    |
| round(number arg, number decimals?)                                                                           |    ✅    |
| pow(number value, number power)                                                                               |    ✅    |
| log(number arg)                                                                                               |    ✅    |
| log10(number arg)                                                                                             |    ✅    |
| abs(number arg)                                                                                               |    ✅    |
| sin(number arg)                                                                                               |    ✅    |
| cos(number arg)                                                                                               |    ✅    |
| tan(number arg)                                                                                               |    ✅    |
| asin(number arg)                                                                                              |    ✅    |
| acos(number arg)                                                                                              |    ✅    |
| atan(number arg)                                                                                              |    ✅    |
| atan2(number arg, number arg)                                                                                 |    ✅    |
| sqrt(number arg)                                                                                              |    ✅    |
| exp(number arg)                                                                                               |    ✅    |
| exp10(number arg)                                                                                             |    ✅    |
| pi()                                                                                                          |    ✅    |
| count(node-set arg)                                                                                           |    ✅    |
| count-non-empty(node-set arg)                                                                                 |    ✅    |
| position(node arg?)                                                                                           |    ✅    |
| instance(string id)                                                                                           |    ✅    |
| current()                                                                                                     |    ✅    |
| randomize(node-set arg, number seed)                                                                          |    ✅    |
| today()                                                                                                       |    ✅    |
| now()                                                                                                         |    ✅    |
| format-date(date value, string format)                                                                        |    ✅    |
| format-date-time(dateTime value, string<br/>format)                                                           |    ✅    |
| date(\* value)                                                                                                |    ✅    |
| decimal-date-time(dateTime value)                                                                             |    ✅    |
| decimal-time(time value)                                                                                      |    ✅    |
| selected(string list, string value)                                                                           |    ✅    |
| selected-at(string list, number index)                                                                        |    ✅    |
| count-selected(node node)                                                                                     |    ✅    |
| jr:choice-name(node node, string value)                                                                       |    ✅    |
| jr:itext(string id)                                                                                           |    ✅    |
| indexed-repeat(node-set arg, node-set<br/>repeat1, number index1, [node-set<br/>repeatN, number indexN]{0,2}) |    ✅    |
| area(node-set ns\|geoshape gs)                                                                                |    ✅    |
| distance(node-set ns\|geoshape<br/>gs\|geotrace gt\|(geopoint\|string)<br/>arg\*)                             |    ✅    |
| geofence(geopoint p, geoshape gs)                                                                             |    ✅    |
| base64-decode(base64Binary input)                                                                             |    ✅    |
| [intersects(geoshape gs\|geotrace gt)](https://github.com/getodk/web-forms/issues/572)                        |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Misc<br/>⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                       | Progress |
| -------------------------------------------------------------------------------- | :------: |
| [last saved instance](https://github.com/getodk/web-forms/issues/306)            |          |
| [defaults from query parameters](https://github.com/getodk/web-forms/issues/464) |          |
| multi-form app-like experience                                                   |          |
| [prevent multiple submissions](https://github.com/getodk/web-forms/issues/461)   |          |
| configure end of form experience                                                 |          |
| save as draft                                                                    |          |
| offline entities                                                                 |          |
| MBtiles / offline map layers                                                     |          |
| [submission encryption](https://github.com/getodk/web-forms/issues/448)          |          |

</details>

<!-- /autogen: feature-matrix -->

## Q&A

### Why not evolve [Enketo](https://github.com/enketo/enketo/)?

Enketo is critical infrastructure for a number of organizations and used in many different ways. As its maintainer, we found deeper changes to be challenging because they often led to regressions, many times in functionality that we don't use ourselves. We hope that the narrower scope of ODK Web Forms (in particular, no transformation step and no standalone service) will allow us to iterate quickly and align more closely with Collect while allowing organizations that have built infrastructure around Enketo to continue using it as they prefer.

### Why not build a web frontend around [JavaRosa](https://github.com/getodk/javarosa/)?

After many years of maintaining JavaRosa and a few maintaining Enketo, we have learned a lot about how we'd like to structure an ODK XForms engine to isolate concerns and reduce the risk of regressions. We believe a fresh start will give us an opportunity to build strong patterns that will allow for a faster development pace with fewer bugs and performance issues.

### Why use web technologies?

There exist more and more ways to run code written with web technologies in different environments and web technologies continue to increase in popularity. We believe this choice will give us a lot of flexibility in how these packages can be used.

### Why have a strong separation between the form engine and its frontend?

We aspire to use the engine to drive other kinds of frontends such as test runners and eventually mobile applications. Additionally, our experience maintaining JavaRosa and Enketo suggests that blurring the engine/frontend line can be the cause of many surprising bugs that are hard to troubleshoot.

### Why Vue and PrimeVue?

Vue powers [Central frontend](https://github.com/getodk/central-frontend/) where it has served us well. For Web Forms, we've selected to use a component library to help us build a consistent, accessible, and user-friendly experience in minimal time. We chose PrimeVue for its development pace, approach to extensibility, and dedication to backwards compatibility.

### Why not use browsers' XPath parser and evaluator (e.g. [Enketo's wrapper around them](https://github.com/enketo/enketo/tree/main/packages/openrosa-xpath-evaluator))?

We want to be able to use this code in browsers but also in backends and eventually wrapped by mobile applications. Taking control of XPath evaluation gives us more portability and also has the advantage of giving us the opportunity to make targeted performance improvements.

### Why not build an engine that operates directly on XLSForms?

While XLSForm is a powerful form authoring format, it doesn't have clearly defined engine semantics or a formal specification. An XLSForm engine would have to refer to the underlying ODK XForms specification for much of its behavior and represent the form in a way that's appropriate for XPath querying.

### Why move development to Central Frontend?

Developing Web Forms inside Central Frontend allows us to write end-to-end tests covering the full form-filling experience in its primary distribution environment. This speeds up development and helps us catch regressions early. See the [announcement on the ODK forum](https://forum.getodk.org/t/migrating-web-forms-code-to-central-frontend-repository/58177) for more details.
