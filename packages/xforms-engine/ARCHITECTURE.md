# `@getodk/xforms-engine`: architecture, design, and key concepts

## Guiding principles and assumptions

1. `@getodk/xforms-engine` (interchangeably referred to as "the engine") is conceived as a software implementation of the data and computational models defined by the [ODK XForms Specification](https://getodk.github.io/xforms-spec/).

2. The engine is conceptually similar to [JavaRosa](https://github.com/getodk/javarosa), which serves as an engine for [ODK Collect](https://github.com/getodk/collect). Alignment with JavaRosa's behavior and functionality is a primary goal, and that project is a primary point of reference, e.g.:

   - for understanding, interpreting and disambiguating important details specified by ODK XForms

   - for prioritization of feature support

   - for identification of _bug-for-bug_ compatibility goals

   In **most cases**, JavaRosa is assumed to be the "source of truth" when answering questions about spec and requirements. Cases where we deviate tend to involve increased spec support; in all cases, interoperability between the two ODK form implementations is of utmost importance.

3. ODK forms are typically authored in the [XLSForms](https://xlsform.org/en/) format, which simplifies many ODK XForms concepts for form designers. The format is an _abstraction_ over ODK XForms. For the purposes of the engine:

   - The XLSForms format establishes requirements and priority of features. ODK XForms features which _can be expressed_ in an XLSForm are higher priority than those which cannot.

   - The format provides guidance—_but is not a source of truth_—on questions terminology, feature semantics, user concepts, etc. As an abstraction, XLSForms ultimately defers to ODK XForms as its underlying specification, and the engine does in kind. Especially in terms of naming and spec references, the engine's internals tend to stick close to ODK XForms; XLSForms concepts are more appropriate at the package boundary (usually called the "client interface").

4. The engine is intentionally designed to be "client agnostic", in terms of:

   - Presentation and interaction: the engine supports integration and presentation as a conventional form UI on the web (hence the name "ODK Web Forms"); programmatically (as is the case in the `@getodk/scenario` integration test client); hypothetically as a graphical interface for non-web (e.g. mobile or desktop native) platforms, or even as a command line other text-first interface.

   - Rendering technology: the engine is not coupled to any particular UI library or framework (web or otherwise). It is a goal of the engine to support integration with a client's choice of component framework, or even its own bespoke presentation layer.

   - Model of state over time: the engine provides a minimal interface for clients to integrate their own model for observing state changes as they occur. The behavior of this interface is treated as opaque within the engine. It's generally assumed that clients will use and integrate an implementation of reactivity to handle state changes. But the interface is fully optional (for instance it is unused by the vast majority of tests in `@getodk/scenario`).

5. The engine has a _synchronous, consistent computational model_:

   - **Synchronous to read:** Once the engine has initialized a form's state, a client may access any of that state **by reading object properties**. These properties may be implemented internally by `get` accessors and/or `Proxy` traps, but they always produce a _synchronous value_ (i.e. not a `Promise` or other access mechanism which unblocks the main thread's event loop).

   - **Synchronous to write:** APIs provided by the engine for clients to make any state change will perform that state change in the same event loop tick.

   - **Consistent (on read, after every write):** The engine ensures that any computations which must be performed to produce state to a client are performed before the client accesses that state. When a client issues any state change to the engine, any state subsequently read by that client will be a product of the complete and consistent result of any computations dependent (directly or indirectly) on that state change.

   The engine _may_ defer certain computations (e.g. to optimize performance), but any deferred computations **will** be performed before a client acccesses the computation's result (or any other computation which depends on it). The engine may perform deferred computations either on client demand (e.g. in a `get` accessor or `Proxy` trap) or in the background (e.g. asynchrony which is not observable by a client).

   - (Likely to change) **Every write method returns the complete form state**: early in the engine's design, we established a _convention_ for client-facing write method signatures where any write method for any aspect of a form's state will return the complete state of the form. This was intended as an _implied contract_ of the engine's guarantees of synchrony and consistency. While this has some philosophical value, we've found it doesn't have much _practical value_. So we will probably eliminate this convention, probably in favor of a more idiomatic convention like write methods returning the directly written state.

## Engine parsing flow

1. **`initializeForm` (client entrypoint):** accepts a `FormResource` (XForms XML string, or URL reference to XForms XML resource), and a client's options configuring certain form init/runtime behavior.

2. **Retrieve form definition (via client-configured `fetchFormDefinition`):** a `fetch`-like function. If the client provides the `FormResource` as a URL, the engine will use this option to request the form definition.

3. **Initial/pre-parse (engine-internal `XFormDOM`):**

   - Parses the form definition from its XForms XML string input into a traversable tree.
   - Performs some minor pre-processing to normalize certain ambiguous structures specified by ODK XForms.
   - Identifies key aspects of the form definition for reference in later stages of parsing.

4. **Resolve form attachments (via client-configured `fetchFormAttachment`, `FormAttachmentResource`):** a `fetch`-like function. Form attachment references are identified in the `XFormDOM` structure. These references are then retrieved by the client-provided `fetchFormAttachment` function. The retrieved resources are represented internally by a `FormAttachmentResource`, which may be referenced for further parsing or other form functionality.

5. **Parse secondary instances (`FormAttachmentResource`, `SecondaryInstanceDefinition`, etc):** Forms may reference secondary instances in computations, generally to populate `<itemset>` items (for `<select>`, `<select1>`, `<odk:rank>` controls). Each secondary instance is parsed into a `SecondaryInstanceDefinition`, which is a common internal representation suitable for evaluation by references in XPath expressions.

   - [Internal secondary instances](https://getodk.github.io/xforms-spec/#secondary-instances---internal) are referenced and parsed from the `XFormDOM` structure.

   - [External secondary instances](https://getodk.github.io/xforms-spec/#secondary-instances---external) are referenced from their respective `FormAttachmentResource`s, then parsed from their source format (XML, CSV, GeoJSON).

6. **Parse form body (`XFormDefinition` -> `BodyDefinition` -> `BodyElementDefinition`\*):** the body of a form definition (representing its "view", or user-facing structure, controls, supporting text labels/hints) parsed into an internal `BodyDefinition` representation, collecting key information about how a form should be presented to a user. The `BodyDefinition` contains references to parsed descendants of the body, as concrete implementations of the abstract `BodyElementDefinition` base class. Each `BodyElementDefinition` implementation provides details about the specific control or view structure which are used to direct behavior for nodes in the form's model which they reference.

   While `BodyDefinition` is _parsed as a tree_, it is ultimately used to produce a `Map` where each `BodyElementDefinition` is keyed by its reference to a corresponding model node.

   `BodyElementDefinition` is used to represent body elements which are either:

   - Form controls (`<input>`, etc)
   - Structural elements (`<group>`, `<repeat>`) containing those controls (or other sub-structures)

   Each `BodyElementDefinition` may _also reference_ parsed representations of _supporting elements_:

   - Representing text (`<label>`, `<hint>`)
   - Representing a control's items (`<item>`, `<itemset>`)

   These supporting elements are represented by different base classes associated with the semantics they provide to their associated control or body structure (e.g. as computational expressions).

7. **Parse a coherent model of the form definition (`XFormDefinition` -> `ModelDefinition`):**

   - **`ModelDefinition` -> `ModelBindMap` -> `BindDefinition`\*:** Each of a form definition's `<bind>` elements is parsed into a `BindDefinition`, representing its type information and (most of) the computations associated with the node. As with `BodyDefinition`, the `BindDefinition`s are then collected into a `Map` keyed by their model node references.

   - **`ModelDefinition` -> `NodeDefinition`\*:** A form definition's primary `<instance>` subtree is parsed into a tree of `NodeDefinition`s, defining the core structure of a form instance's state. `NodeDefinition` is also an abstract base class, with several more specific concrete implementations associated with key semantics about each node.

   Among those key semantics, each `NodeDefinition` is associated with the `BindDefinition` referencing it (`NodeDefinition.bind`; if one does not exist, a definition will be constructed for it with default values).

   If a form's model node is also referenced by a body element, its `NodeDefinition` representation will have a reference back to that body element's (as `NodeDefinition.bodyElement: BodyElementDefinition`; this property will be `null` if the node is model-only). This association with a body element also influences which concrete `NodeDefinition` implementation is used for its representation.

   - `RootDefinition`: always represents the root node of the form's primary instance model. A form's `RootNode` it is not directly associated with a `BodyElementDefinition`, but it is conceptually linked to the body itself (being the "root" of the form's body/view)

   - `SubtreeDefinition`: represents descendants of the `RootNode` which contain other descendants. Each `SubtreeDefinition` _may or may not_ be associated with a `BodyElementDefinition` corresponding to a `<group>` element. A subtree node's descendants are parsed recursively.

   - `RepeatRangeDefinition`: represents _one or more contiguous nodes_ referenced by a `<repeat>` in the form definition's body, and always has:

     - One `RepeatTemplateDefinition`: represents _either_ a model node explicitly designated as a `jr:template` (if one exists) _or_ the first node in contiguous sequence.

     - Any number of `RepeatInstanceDefinition`\*: each representing one contiguous model node which is _NOT_ explicitly designated as a `jr:template`.

       Descendants of each `RepeatTemplateDefinition` and `RepeatInstanceDefinition` are parsed recursively.

   - `LeafNodeDefinition`: represents a form's primary instance leaf nodes (currently only elements with no element children; we expect to use the same to represent attributes as well). Each `LeafNodeDefinition` _may or may not_ be associated with a `BodyElementDefinition` (specifically a `ControlDefinition`, as leaf nodes may only be associated with form controls).

     - `NoteNodeDefinition` (special case): represents nodes we treat as a special "note" type, where a `LeafNodeDefinition` is associated with an `<input>` (`bodyElement: InputControlDefinition`), and where its `BindDefinition` has a `readonly` expression which will _always produce a `true` value_.

   - **`ModelDefinition` -> `ItextTranslationsDefinition`:** a form's translations are parsed into a set of subtree structures, which support evaluation of `jr:itext(itextId)` XPath expressions. (They share the same underlying implementation as `SecondaryInstanceDefinition`s.)

8. **Initialize a form's primary instance state:** This warrants an entirely new section. See below!

## Primary instance state: client interface

Once parsing is complete, the engine has collected all pertinent details about a _form definition_ into the data structures it will use to initialize a primary instance. This is the engine's representation of a form's state, as it is being filled.

Importantly, the engine has _two representations_ of primary instance state:

- The engine's **client interface**, defined as a set of TypeScript types, in the [`src/client` directory](./src/client/).
- The engine's _internal implementation_ of that client interface, satisfying those TypeScript types, (currently) with a set of classes which mostly mirrors the client interfaces they implement.

### Client interface: concept and definition

The term "client" may be a bit surprising, in the context of a web project which is published to NPM, and effectively consumed _as a library_. It's a term more commonly associated with consumers of networked services, or other software with conceptually similar access protocols.

That is, in fact, the intent of our use of the term "client". The design of the `@getodk/xforms-engine` **package boundary** follows principles similar to those we might apply to, say, a server-based API accessed over HTTP. And in turn, one can conceive of the engine's internal implementation as analogous to a server's implementation of such an HTTP API.

The engine's client interface is:

- Explicitly designed to provide a simple, consistent model for a client to access and interact with a form's primary instance state.

- Designed to support all of the Web Forms project's functionality and targeted use cases (often mindful of potential future use cases).

- Intentionally distinct from the engine's implementation, providing clear bounds for documentation and relative stability of the engine's functionality.

- Often a point of entry for engine development, if/when a change to add functionality or fix a bug may require a change to client integrations.

### Client interface: design (broad strokes)

The engine's client interface essentially represents a form's primary instance state as a tree of nodes. Currently, that tree is almost (but not quite) analogous to its structure in the form definition's model.

There are several distinct _node types_, each with semantics combining the various details of the node determined in the parsing stage described above, and associating them with functionality semantically appropriate to those combined details.

Because different node types have different semantics and functionality, their respective interfaces vary slightly. But they all have a common shape, simplified for documentation purposes here:

<!-- prettier-ignore -->
```ts
interface ClientInterfaceNode {
  // Every node has a distinct identifier
  nodeId: string;

  // Every node specifies its node type. Every node _with the same_ `nodeType`
  // has the same shape and capabilities.
  nodeType: string;

  // Nodes which _can have a value_ specify their "value type". Which types are
  // supported depend on the node type's semantics.
  valueType: string | null;

  // Some node types may be defined with "appearances", which are used to
  // direct specific presentation and/or behavior _in clients_.
  //
  // Note: the actual type provides _hints_ about which appearances may be
  // expected for certain node types, but this type is otherwise _accurate_,
  // in that any appearance from a form definition will be included (whether
  // the engine knows it by name, or not).
  appearances: { [key: string]: boolean } | null;

  // Each node has a "definition". This is determined by the various parsed
  // details about that node, from the source form definition.
  //
  // Note: this concept doesn't ultimately provide much value to clients. To
  // the extent it's still in use at all, we expect to provide simpler and
  // clearer client APIs to the pertinent details. It's likely this property
  // will eventually be deprecated in the client interface, and may ultimately
  // be removed from the engine-internal implementation as well.
  definition: object;

  // Every node provides access to the root (topmost) node in its tree.
  root: RootNode;

  // Every node provides access to its parent node, if any.
  //
  // Note:
  //
  // - Every node except the `root` node has a parent.
  // - This is a top-level property because it is constant for the lifetime
  //   of the node (i.e. a node never moves from one parent to another).
  parent: ParentNode | null;

  // Every node has state which may _change over time_. Clients may configure
  // an implementation of reactivity, in which case all of a node's
  // `currentState` properties will be (shallowly) reactive, using that
  // client-configured implementation.
  //
  // Design implication: any node state which might change over time is
  // structured under a sub-property with a `State` suffix. Properties outside
  // of such sub-properties are guaranteed to be constant for the duration of
  // a client's access to that node.
  currentState: {
    // Each node has an (XPath) reference.
    //
    // Note: this is stateful, not constant, because it may change as repeat
    // instances are added and/or removed (for the repeat instances themselves,
    // as well as any of their descendants).
    reference: string;

    // The state of common node computations, as defined on the node's `<bind>`
    readonly: boolean;
    relevant: boolean;
    required: boolean;

    // Parent nodes have `children` state.
    //
    // Note: this is stateful, not constant, because it may change as repeat
    // instances are added and/or removed. It is modeled the same way for other
    // parent/child relationships to maintain a consistent interface.
    children: ClientInterfaceNode[] | null;

    // Leaf (value) nodes have value state.
    //
    // Note: `T` is used here as a shorthand to suggest that the a node's runtime
    // value type varies depending on the node's semantics and `valueType`.
    value: T | null;

    // Some node types provide a set of values from which their `value` may be
    // chosen. This is null for nodes which allow arbitrary values (of their
    // respective value type/`T`).
    valueOptions: { value: T /* ... */ }[] | null;

    // All leaf (value) nodes, and some parent nodes _may_ have a label.
    label: { asString: string /* ... */ } | null;

    // All leaf (value) nodes _may_ have a hint.
    hint: { asString: string /* ... */ } | null;

    /* ...
     *
     * In _rare cases_, specific node types may have additional node-specific
     * state properties. This is generally avoided where possible, but a few
     * exceptions are made for pragmatic reasons. Overall, the intent is that
     * nodes have _nearly identical_ structure, for consistency and
     * predictability (of usage, naming, application of concepts, etc).
     */
  };

  // Every node provides access to the current state of either that node's own
  // validity, or the validity of its descendants.
  validationState:
    // Parent nodes aggregate validation violations about their descendants.
    | { violations: object[] }

    // Leaf nodes provide details of their own validation violation, if any.
    | { violation: object | null /* ... */ };

  // Each node can serialize its own submission XML (and implicity, that of either
  // its descendants or its value).
  //
  // Note:
  //
  // - In typical usage, this would be accessed from the `root` node.
  // - This odd single-property object structure reflects (a) the `State` suffix
  //   as an indicator that the value may change over time and (b) a tradeoff in
  //   the design for client-configured reactivity (where all client-reactive
  //   state is read and written from reactive objects, typically backed by a
  //   `Proxy` or similar mechanism).
  submissionState: {
    submissionXML: string;
  };

  /**
   * ... Many node types, typically leaf/value nodes, will have additional
   * _methods_ beyond the common properties above. These are (mostly) used to
   * provide **write access** to their state, and are generally defined with
   * the specific node type's semantics in mind.
   *
   * The below is **NOT** common among all node types, it is presented here
   * as an example of the concept.
   *
   * Note: by convention, currently all node setters return the `root` node.
   * This hasn't proved particularly useful, and is likely to change in the
   * near future.
   */
  setValue(value: T): object;
}
```

### Client interface: node types (broad strokes)

(Note: the following list is intentionally **not exhaustive**, as it is an active work in progress. The intent is to document the broad conceptual distinction between node types.)

- `RootNode`: every primary instance has a "root" (topmost) node, from which all other primary instance nodes descend. As such, `RootNode` is not a child node.

- Repeats:

  - `RepeatRangeNode`: represents a contiguous set of repeat instances
  - `RepeatInstanceNode`: represents a single repeat instance

  Each `RepeatRangeNode` may have any number of `RepeatInstanceNode` children. It cannot have children of any other node type.

  Each `RepeatInstanceNode` is a child of a `RepeatRangeNode`. It cannot have a parent of any other node type.

- "General" parent nodes—`RootNode`, `GroupNode`, `RepeatInstanceNode`, `SubreeNode`—may have children of any child node type _except_ `RepeatInstanceNode`.

- Value (leaf) nodes: all other node types, which (roughly) correspond to the ODK XForms form controls (body elements used to control values), as well as `ModelValueNode` (which corresponds to a model node with no child elements, and no associated form control/body element).

## Primary instance state: engine-internal implementation

Each node type defined by the engine's client interface has a corresponding internal implementation in the engine. Currently, each node type is implemented by a class with a similar name. These classes _satisfy_ their corresponding client interface, but they also _exceed_ it:

- To support the engine's **other** main interface boundary, with `@getodk/xpath`, each node type's class implements functionality required for evaluation of the node in terms of XPath semantics.

- To implement various engine-internal implementation details _in support_ of their client interface.

In both cases, the engine's client interface ensures a strictly limited contract with clients. Any behavior beyond that interface is considered internal and private to the engine (even where such internal behavior may incidentally be observable by clients).

### Integration with `@getodk/xpath`, `XPathDOMAdapter`

As mentioned above, in addition to implementing the client interface, the engine's internal representation of primary instance state also supports XPath evaluation, integrating with the `@getodk/xpath` `XPathDOMAdapter` interface. This integration allows each node to be treated as an _XPath node_, by providing XPath-specific semantics (e.g. traversal through children, access to node values).

This functionality is crucial to proper support for ODK XForms semantics in the engine, but it's otherwise intentionally encapsulated so clients don't need to reason about the many complexities of a form's computations.

**Most** of the XPath-specific functionality implemented by each engine node is described by the `XFormsXPathNode` interface and its related types.

(TODO: At time of writing, it turns out this interface is incomplete! There are other XPath-specific semantics which the engine's `XPathDOMAdapter` reference _implicitly_ based on its knowledge of the concrete node implementations, which is a mistake.)

### Reactivity: implementation detail of ODK XForms dependency graph

[...]

### Reactivity: bridging state between engine and client

[...]
