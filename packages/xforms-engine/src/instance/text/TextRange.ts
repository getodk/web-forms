import type {
	TextRange as ClientTextRange,
	TextChunk,
	TextOrigin,
	TextRole,
} from '../../client/TextRange.ts';
import {
	EngineXPathEvaluator,
	isEngineXPathEvaluator,
} from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { MediaResource } from '../../parse/attachments/MediaResource.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
import { FormattedTextStub } from './FormattedTextStub.ts';

interface TextMediaSource {
	image: string | null;
	video: string | null;
	audio: string | null;
}

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

	get image(): Promise<MediaResource> | null {
		if (this.media?.image == null || !isEngineXPathEvaluator(this.evaluator)) {
			return null;
		}

		return (this.evaluator.rootNode as PrimaryInstance).loadMediaResources(this.media.image);
	}

	constructor(
		readonly evaluator: EngineXPathEvaluator | null, // TODO: can it be null?
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly media: TextMediaSource | null
	) {}
}
