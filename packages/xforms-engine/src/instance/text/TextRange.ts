import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { Nodes } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';

import type {
	TextRange as ClientTextRange,
	TextChunk,
	TextOrigin,
	TextRole,
} from '../../client/TextRange.ts';

export interface MediaSources {
	image?: JRResourceURL;
	video?: JRResourceURL;
	audio?: JRResourceURL;
}

interface MarkdownElement {
  elementName?: string;
	value?: string;
  properties?: Record<string, unknown>;
  children?: MarkdownElement[];
}

function mdastToOdkMarkdown(tree: Nodes): MarkdownElement {
	if (tree.type === 'root') {
		const children = tree.children
			.map(child => mdastToOdkMarkdown(child))
			.filter(child => !!child);
		return {
			children
		};
	}
	if (tree.type === 'paragraph') {
		const children = tree.children
			.map(child => mdastToOdkMarkdown(child))
			.filter(child => !!child);
		return {
			elementName: 'p',
			children
		};
	}
	if (tree.type === 'strong') {
		const children = tree.children
			.map(child => mdastToOdkMarkdown(child))
			.filter(child => !!child);
		return {
			elementName: 'strong',
			children
		};
	}
	if (tree.type === 'emphasis') {
		const children = tree.children
			.map(child => mdastToOdkMarkdown(child))
			.filter(child => !!child);
		return {
			elementName: 'em',
			children
		};
	}
	if (tree.type === 'text') {
		return {
			value: tree.value
		};
	} 
	if (tree.type === 'inlineCode') {
		return {
			value: tree.value
		};
	}
	return {};
	// throw new Error('unsupported markdown type: ' + tree.type);
};

export class TextRange<Role extends TextRole, Origin extends TextOrigin>
	implements ClientTextRange<Role, Origin>
{
	*[Symbol.iterator]() {
		yield* this.chunks;
	}

	get formatted(): MarkdownElement {
		console.log('getting formatted');
		const str = this.chunks.map((chunk) => {
			if (chunk.source === 'output') {
				console.log('chunk.asString', chunk.asString);
				return chunk.asString ? '`' + ( chunk.asString) + '`' : ''; // backticks so it doesn't get markeddown
			} else {
				return chunk.asString
			}
		}).join('');
		const tree = fromMarkdown(str);
		// consider unrolling the first child - always seems to be a <p>
		const odkMarkdownTree = mdastToOdkMarkdown(tree);
		console.log({ str, tree, odkMarkdownTree });
		return odkMarkdownTree;
	}

	get asString(): string {
		console.log('getting string');
		return this.chunks.map((chunk) => chunk.asString).join('');
	}

	get imageSource(): JRResourceURL | undefined {
		return this.mediaSources?.image;
	}

	get audioSource(): JRResourceURL | undefined {
		return this.mediaSources?.audio;
	}

	get videoSource(): JRResourceURL | undefined {
		return this.mediaSources?.video;
	}

	constructor(
		readonly origin: Origin,
		readonly role: Role,
		protected readonly chunks: readonly TextChunk[],
		protected readonly mediaSources?: MediaSources
	) {
		console.log('construcing');
	}
}
