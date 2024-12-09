import type { ValueType } from '../../client/ValueType.ts';
import { IntValueCodec, type IntInputValue, type IntRuntimeValue } from './IntValueCodec.ts';
import { StringValueCodec } from './StringValueCodec.ts';
import type { ValueCodec } from './ValueCodec.ts';
import { ValueTypePlaceholderCodec } from './ValueTypePlaceholderCodec.ts';

interface RuntimeValuesByType {
	readonly string: string;
	readonly int: IntRuntimeValue;
	readonly decimal: string;
	readonly boolean: string;
	readonly date: string;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: string;
	readonly geotrace: string;
	readonly geoshape: string;
	readonly binary: string;
	readonly barcode: string;
	readonly intent: string;
}

export type RuntimeValue<V extends ValueType> = RuntimeValuesByType[V];

interface RuntimeInputValuesByType {
	readonly string: string;
	readonly int: IntInputValue;
	readonly decimal: string;
	readonly boolean: string;
	readonly date: string;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: string;
	readonly geotrace: string;
	readonly geoshape: string;
	readonly binary: string;
	readonly barcode: string;
	readonly intent: string;
}

export type RuntimeInputValue<V extends ValueType> = RuntimeInputValuesByType[V];

type SharedValueCodecs = {
	readonly [V in ValueType]: ValueCodec<V, RuntimeValue<V>, RuntimeInputValue<V>>;
};

export type SharedValueCodec<V extends ValueType> = SharedValueCodecs[V];

/**
 * Provides codecs for each {@link ValueType | value type}, for nodes with a
 * common representation of those value types.
 */
export const sharedValueCodecs: SharedValueCodecs = {
	string: new StringValueCodec(),

	int: new IntValueCodec(),
	decimal: new ValueTypePlaceholderCodec('decimal'),
	boolean: new ValueTypePlaceholderCodec('boolean'),
	date: new ValueTypePlaceholderCodec('date'),
	time: new ValueTypePlaceholderCodec('time'),
	dateTime: new ValueTypePlaceholderCodec('dateTime'),
	geopoint: new ValueTypePlaceholderCodec('geopoint'),
	geotrace: new ValueTypePlaceholderCodec('geotrace'),
	geoshape: new ValueTypePlaceholderCodec('geoshape'),
	binary: new ValueTypePlaceholderCodec('binary'),
	barcode: new ValueTypePlaceholderCodec('barcode'),
	intent: new ValueTypePlaceholderCodec('intent'),
};

export const getSharedValueCodec = <V extends ValueType>(valueType: V): SharedValueCodec<V> => {
	return sharedValueCodecs[valueType];
};