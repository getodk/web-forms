import type { Heading, RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { type MarkdownNode, type StyleProperty } from '../../client';
import type { TextChunk } from '../../client/TextRange.ts';
import {
	Anchor,
	ChildMarkdownNode,
	Emphasis,
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
	Html,
	ListItem,
	OrderedList,
	Paragraph,
	Span,
	Strong,
	UnorderedList,
} from '../markdown/MarkdownNode.ts';

const STYLE_PROPERTY_REGEX = /style\s*=\s*("([^"]*)"|'([^']*)')/i;

function parseStyle(tag: string): StyleProperty {
	const styleProperty = STYLE_PROPERTY_REGEX.exec(tag);
	let color;
	let font;
	if (styleProperty && styleProperty.length > 1) {
		const styleValue = styleProperty[2] ?? '';
		const properties = styleValue.split(';');
		properties.forEach((property) => {
			const [name, value] = property.split(':');
			if (!name || !value) {
				return;
			}
			if (name === 'color') {
				color = value;
			} else if (name === 'font-family') {
				font = value;
			}
		});
	}
	return {
		color,
		'font-family': font,
	};
}

function mdastHeading(tree: Heading, children: MarkdownNode[]): MarkdownNode {
	if (tree.depth === 1) {
		return new Heading1(children);
	}
	if (tree.depth === 2) {
		return new Heading2(children);
	}
	if (tree.depth === 3) {
		return new Heading3(children);
	}
	if (tree.depth === 4) {
		return new Heading4(children);
	}
	if (tree.depth === 5) {
		return new Heading5(children);
	}
	return new Heading6(children);
}

function mdastNodeToOdkMarkdown(tree: RootContent): MarkdownNode | undefined {
	if (tree.type === 'text' || tree.type === 'inlineCode') {
		return new ChildMarkdownNode(tree.value);
	}
	if (tree.type === 'html') {
		return new Html(tree.value);
	}
	if ('children' in tree) {
		const children = mdastToOdkMarkdown(tree.children);
		if (tree.type === 'paragraph') {
			return new Paragraph(children);
		}
		if (tree.type === 'strong') {
			return new Strong(children);
		}
		if (tree.type === 'emphasis') {
			return new Emphasis(children);
		}
		if (tree.type === 'link') {
			return new Anchor(children, tree.url);
		}
		if (tree.type === 'list') {
			if (tree.ordered) {
				return new OrderedList(children);
			} else {
				return new UnorderedList(children);
			}
		}
		if (tree.type === 'listItem') {
			return new ListItem(children);
		}
		if (tree.type === 'heading') {
			return mdastHeading(tree, children);
		}
	}
	return;
}

function mdastToOdkMarkdown(elements: RootContent[]): MarkdownNode[] {
	const result: MarkdownNode[] = [];
	for (let i = 0; i < elements.length; i++) {
		const tree = elements[i]!;
		if (tree.type === 'html' && tree.value.startsWith('<span ')) {
			// SPECIAL CASE in mdast processing
			// span children are parsed into siblings in the mdast for some reason
			// so we need to advance `i` as we consume siblings
			const children: RootContent[] = [];
			let next = elements[++i];
			while (next && !(next.type === 'html' && next.value === '</span>')) {
				children.push(next);
				next = elements[++i];
			}
			result.push(new Span(mdastToOdkMarkdown(children), { style: parseStyle(tree.value) }));
		} else {
			const odkMarkdown = mdastNodeToOdkMarkdown(tree);
			if (odkMarkdown) {
				result.push(odkMarkdown);
			}
		}
	}
	return result;
}

function escapeEditableChunks(chunks: readonly TextChunk[]) {
	return chunks
		.map((chunk) => {
			if (chunk.source === 'output') {
				return chunk.asString ? '`' + chunk.asString + '`' : ''; // backticks so it doesn't get markeddown
			}
			return chunk.asString;
		})
		.join('');
}

export function format(chunks: readonly TextChunk[]): MarkdownNode[] {
	const str = escapeEditableChunks(chunks);
	const tree = fromMarkdown(str);
	return mdastToOdkMarkdown(tree.children);
}
