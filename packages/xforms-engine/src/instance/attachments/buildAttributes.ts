import { Attribute } from "../Attribute";
import type { GeneralParentNode } from "../hierarchy";

export const buildAttributes = (parent: GeneralParentNode): Attribute[] => {
  return Array.from(parent.definition.attributes.values()).map(defn => {
    return new Attribute(parent, defn);
  })
}
