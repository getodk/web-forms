import type {
	TextRange as ClientTextRange,
	TextChunk,
	TextOrigin,
	TextRole,
	TextMediaSource,
} from '../../client/TextRange.ts';
import { FormattedTextStub } from './FormattedTextStub.ts';

export class TextRange<Role extends TextRole, Origin extends TextOrigin>
	implements ClientTextRange<Role, Origin>
{
	*[Symbol.iterator]() {
		yield* this.chunks;
	}

	get formatted() {
		return FormattedTextStub;
	}

	get asString(): string {
		return this.chunks.map((chunk) => chunk.asString).join('');
	}

	get imageSource(): string {
		return this.textMediaSource?.image ?? '';
	}

	constructor(
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly textMediaSource?: TextMediaSource
	) {}
}
