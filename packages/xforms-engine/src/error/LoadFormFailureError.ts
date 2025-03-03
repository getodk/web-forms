import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type { Primitive } from '@getodk/common/types/Primitive.ts';
import type { FormResource } from '../client/form/FormResource.ts';

// prettier-ignore
type PartiallyKnownType<T> =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| T
	| UnknownObject
	| Primitive;

/**
 * A {@link Blob}, which _may be_ a {@link File}.
 *
 * Extends {@link Blob} with optional properties corresponding to {@link File}'s
 * own extensions of the same interface, allowing inspection without an
 * unnecessary type cast, and without unnecessary runtime/type reconciliation.
 *
 * @todo There's almost certainly no reason that this couldn't be a part of the
 * client-facing {@link FormResource} union type. It's kept internal here for
 * now, in case that could cause confusion in client integrations.
 */
interface MaybeFile extends Blob {
	readonly lastModified?: PartiallyKnownType<number>;
	readonly name?: PartiallyKnownType<string>;
	readonly webkitRelativePath?: PartiallyKnownType<string>;
}

const blobDescription = (resource: MaybeFile): string => {
	const { name } = resource;

	if (typeof name === 'string') {
		return name;
	}

	let commonConstructorName: 'Blob' | 'File';

	if (resource instanceof File) {
		commonConstructorName = 'File';
	} else {
		commonConstructorName = 'Blob';
	}

	return `Unknown ${commonConstructorName} data`;
};

const formResourceDescription = (resource: FormResource): string => {
	if (resource instanceof Blob) {
		return blobDescription(resource);
	}

	if (resource instanceof URL) {
		return resource.href;
	}

	return `Raw string data (continued below)\n\n${resource}`;
};

/**
 * @todo This is a placeholder class, given a name so it can be referenced in
 * client interfaces for form loading. It is pending design of errors (broadly)
 * and modeling of form loading errors (specifically).
 */
export class LoadFormFailureError extends AggregateError {
	constructor(resource: FormResource, errors: readonly Error[]) {
		const description = formResourceDescription(resource);
		const message = `Failed to load form resource: ${description}`;

		super(errors, message);
	}
}
