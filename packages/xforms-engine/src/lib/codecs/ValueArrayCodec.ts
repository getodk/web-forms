import type { ValueType } from '../../client/ValueType.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { RuntimeValue, SharedValueCodec } from './getSharedValueCodec.ts';
import type { CodecDecoder, CodecDecoderToString, CodecEncoder } from './ValueCodec.ts';
import { ValueCodec } from './ValueCodec.ts';

export type SplitInstanceValues = (value: string) => readonly string[];

export type JoinInstnaceValues = (values: readonly string[]) => string;

export type RuntimeItemValue<V extends ValueType> = NonNullable<RuntimeValue<V>>;

export type RuntimeValues<V extends ValueType> = ReadonlyArray<RuntimeItemValue<V>>;

export abstract class ValueArrayCodec<
	V extends ValueType,
	Values extends RuntimeValues<V> = RuntimeValues<V>,
> extends ValueCodec<V, Values, Values> {
	readonly decodeItemValue: CodecDecoder<RuntimeItemValue<V>>;
	readonly decodeItemValueToString: CodecDecoderToString<RuntimeItemValue<V>>;

	constructor(
		baseCodec: SharedValueCodec<V>,
		encodeValue: CodecEncoder<Values>,
		decodeValue: CodecDecoder<Values>,
		decodeValueToString: CodecDecoderToString<Values>
	) {
		const decodeItemValue: CodecDecoder<RuntimeItemValue<V>> = (value) => {
			const decoded = baseCodec.decodeValue(value);

			if (decoded == null) {
				throw new ErrorProductionDesignPendingError(
					`Failed to decode item value: ${JSON.stringify(value)}`
				);
			}

			return decoded;
		};

		const decodeToString = (value: RuntimeItemValue<V>) => {
			return value == null ? null : baseCodec.decodeToString(value);
		};

		super(baseCodec.valueType, encodeValue, decodeValue, decodeValueToString);

		this.decodeItemValue = decodeItemValue;
		this.decodeItemValueToString = decodeToString;
	}
}
