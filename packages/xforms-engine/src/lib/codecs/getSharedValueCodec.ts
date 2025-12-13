import type { ValueType } from '../../client/ValueType.ts';
import type { DatetimeInputValue, DatetimeRuntimeValue } from './DateValueCodec.ts';
import { DateValueCodec } from './DateValueCodec.ts';
import {
	type DecimalInputValue,
	type DecimalRuntimeValue,
	DecimalValueCodec,
} from './DecimalValueCodec.ts';
import type { GeopointInputValue, GeopointRuntimeValue } from './geolocation/Geopoint.ts';
import { GeopointValueCodec } from './geolocation/GeopointValueCodec.ts';
import type { GeoshapeInputValue, GeoshapeRuntimeValue } from './geolocation/Geoshape.ts';
import { GeoshapeValueCodec } from './geolocation/GeoshapeValueCodec.ts';
import type { GeotraceInputValue, GeotraceRuntimeValue } from './geolocation/Geotrace.ts';
import { GeotraceValueCodec } from './geolocation/GeotraceValueCodec.ts';
import { type IntInputValue, type IntRuntimeValue, IntValueCodec } from './IntValueCodec.ts';
import { StringValueCodec } from './StringValueCodec.ts';
import type { ValueCodec } from './ValueCodec.ts';
import { ValueTypePlaceholderCodec } from './ValueTypePlaceholderCodec.ts';

interface RuntimeValuesByType {
	readonly string: string;
	readonly int: IntRuntimeValue;
	readonly decimal: DecimalRuntimeValue;
	readonly boolean: string;
	readonly date: DatetimeRuntimeValue;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: GeopointRuntimeValue;
	readonly geotrace: GeotraceRuntimeValue;
	readonly geoshape: GeoshapeRuntimeValue;
	readonly binary: string;
	readonly barcode: string;
	readonly intent: string;
}

export type RuntimeValue<V extends ValueType> = RuntimeValuesByType[V];

interface RuntimeInputValuesByType {
	readonly string: string;
	readonly int: IntInputValue;
	readonly decimal: DecimalInputValue;
	readonly boolean: string;
	readonly date: DatetimeInputValue;
	readonly time: string;
	readonly dateTime: string;
	readonly geopoint: GeopointInputValue;
	readonly geotrace: GeotraceInputValue;
	readonly geoshape: GeoshapeInputValue;
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
	decimal: new DecimalValueCodec(),
	boolean: new ValueTypePlaceholderCodec('boolean'),
	date: new DateValueCodec(),
	time: new ValueTypePlaceholderCodec('time'),
	dateTime: new ValueTypePlaceholderCodec('dateTime'),
	geopoint: new GeopointValueCodec(),
	geotrace: new GeotraceValueCodec(),
	geoshape: new GeoshapeValueCodec(),
	binary: new ValueTypePlaceholderCodec('binary'),
	barcode: new ValueTypePlaceholderCodec('barcode'),
	intent: new ValueTypePlaceholderCodec('intent'),
};

export const getSharedValueCodec = <V extends ValueType>(valueType: V): SharedValueCodec<V> => {
	return sharedValueCodecs[valueType];
};
