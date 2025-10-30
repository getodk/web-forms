import { Attribute } from "../Attribute";
import type { AnyNode } from "../hierarchy";

export const buildAttributes = (group: AnyNode): Attribute[] => {
  return Array.from(group.definition.attributes.values()).map(defn => {
    return new Attribute(group, defn);
  })
}
