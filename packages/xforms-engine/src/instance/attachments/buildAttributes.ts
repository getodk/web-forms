import { Attribute } from "../Attribute";
import type { AnyNode } from "../hierarchy";

export const buildAttributes = (owner: AnyNode): Attribute[] => {
  if (!owner.definition.attributes) {
    return []; // TODO should all definitions have attributes?
  }
  return Array.from(owner.definition.attributes?.values()).map(defn => {
    return new Attribute(owner, defn, defn.template);
  });
}
