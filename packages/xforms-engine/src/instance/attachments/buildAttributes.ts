import { Attribute } from '../Attribute';
import type { AnyParentNode } from '../hierarchy';

export function buildAttributes(parent: AnyParentNode): Attribute[] {
	return Array.from(parent.definition.attributes.values()).map((defn) => {
		return new Attribute(parent, defn, defn.template); // TODO don't pass in template?
	});
}
