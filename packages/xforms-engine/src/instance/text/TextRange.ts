import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
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

	get imageSource(): JRResourceURL | null {
		return this.getMediaSourceURL(this.textMediaSource?.image);
	}

	get audioSource(): JRResourceURL | null {
		return this.getMediaSourceURL(this.textMediaSource?.audio);
	}

	get videoSource(): JRResourceURL | null {
		return this.getMediaSourceURL(this.textMediaSource?.video);
	}

	constructor(
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly textMediaSource?: TextMediaSource
	) {}

	private getMediaSourceURL(mediaSource: string | undefined): JRResourceURL | null {
		if (mediaSource == null || !JRResourceURL.isJRResourceReference(mediaSource)) {
			return null;
		}

		return JRResourceURL.from(mediaSource);
	}
}
