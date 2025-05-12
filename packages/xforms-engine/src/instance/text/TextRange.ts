import type {
	TextRange as ClientTextRange,
	TextChunk,
	TextOrigin,
	TextRole,
	TextMediaContext,
} from '../../client/TextRange.ts';
import { isEngineXPathEvaluator } from '../../integration/xpath/EngineXPathEvaluator.ts';
import type { MediaResource } from '../../parse/attachments/MediaResource.ts';
import type { PrimaryInstance } from '../PrimaryInstance.ts';
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

	get image(): Promise<MediaResource> {
		if (this.textMediaContext == null || !isEngineXPathEvaluator(this.textMediaContext.evaluator)) {
			return Promise.reject(new Error('No media available'));
		}

		const rootNode = this.textMediaContext.evaluator.rootNode as PrimaryInstance;
		return rootNode.loadMediaResources(this.textMediaContext.mediaSource.image ?? '');
	}

	constructor(
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		readonly textMediaContext?: TextMediaContext
	) {}
}
