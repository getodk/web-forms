import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { PartiallyKnownString } from '@getodk/common/types/string/PartiallyKnownString.ts';
import type { PreloadProperties } from '../../client/index.ts';
import { now, today } from '../../lib/date-format.ts';
import type { BindElement } from './BindElement.ts';
import { XFORM_EVENT, type XFormEvent } from './Event.ts';

/**
 * Per {@link https://getodk.github.io/xforms-spec/#preload-attributes:~:text=concatenation%20of%20%E2%80%98uuid%3A%E2%80%99%20and%20uuid()}
 */
const PRELOAD_UID_EXPRESSION = 'concat("uuid:", uuid())';

type PartiallyKnownPreloadParameter<Known extends string> = PartiallyKnownString<
	NonNullable<Known>
>;

interface PreloadParametersByType {
	readonly uid: string | null;
	readonly date: PartiallyKnownPreloadParameter<'today'>;
	readonly timestamp: PartiallyKnownPreloadParameter<'end' | 'start'>;

	readonly property: PartiallyKnownPreloadParameter<
		// prettier-ignore
		'deviceid' | 'email' | 'phonenumber' | 'username'
	>;
}

type PreloadType = PartiallyKnownString<keyof PreloadParametersByType>;

// prettier-ignore
type PreloadParameter<Type extends PreloadType> =
	Type extends keyof PreloadParametersByType
		? PreloadParametersByType[Type]
		: string | null;

interface PreloadInput<Type extends PreloadType> {
	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;
}

type AnyPreloadInput = {
	[Type in PreloadType]: PreloadInput<Type>;
}[PreloadType];

const getPreloadInput = (bindElement: BindElement): AnyPreloadInput | null => {
	const type = bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'preload');

	if (type == null) {
		return null;
	}

	const parameter: PreloadParameter<typeof type> = bindElement.getAttributeNS(
		JAVAROSA_NAMESPACE_URI,
		'preloadParams'
	);

	return {
		type,
		parameter,
	};
};

/**
 * Parsed representation of
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | Preload Attributes}.
 * If specified on a
 * {@link https://getodk.github.io/xforms-spec/#bindings | binding}, this will
 * be parsed to define:
 *
 * - {@link type}, a `jr:preload`
 * - {@link parameter}, an associated `jr:preloadParams` value
 */
export class BindPreloadDefinition<Type extends PreloadType> implements PreloadInput<Type> {
	static from(bindElement: BindElement): AnyBindPreloadDefinition | null {
		const input = getPreloadInput(bindElement);

		if (input == null) {
			return null;
		}

		return new this(input);
	}

	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;
	readonly event: XFormEvent;

	getValue(properties: PreloadProperties): PreloadValue | undefined {
		if (this.type === 'uid') {
			return { type: 'expression', expression: PRELOAD_UID_EXPRESSION };
		}
		if (this.type === 'timestamp' && this.parameter === 'start') {
			return { type: 'literal', literal: now() };
		}
		if (this.type === 'date' && this.parameter === 'today') {
			return { type: 'literal', literal: today() };
		}
		if (this.type === 'property') {
			if (this.parameter === 'deviceid') {
				return { type: 'literal', literal: properties.deviceid ?? '' };
			}
			if (this.parameter === 'email') {
				return { type: 'literal', literal: properties.email ?? '' };
			}
			if (this.parameter === 'phonenumber') {
				return { type: 'literal', literal: properties.phonenumber ?? '' };
			}
			if (this.parameter === 'username') {
				return { type: 'literal', literal: properties.username ?? '' };
			}
		}
		return;
	}

	private constructor(input: PreloadInput<Type>) {
		this.type = input.type;
		this.parameter = input.parameter;
		this.event =
			this.type === 'timestamp' && this.parameter === 'end'
				? XFORM_EVENT.xformsRevalidate
				: XFORM_EVENT.odkInstanceFirstLoad;
	}
}

interface LiteralPreloadValue {
	type: 'literal';
	literal: string;
}
interface ExpressionPreloadValue {
	type: 'expression';
	expression: string;
}

export type PreloadValue = ExpressionPreloadValue | LiteralPreloadValue;

// prettier-ignore
export type AnyBindPreloadDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| BindPreloadDefinition<'uid'>
	| BindPreloadDefinition<'timestamp'>
	| BindPreloadDefinition<'property'>
	| BindPreloadDefinition<string>;
