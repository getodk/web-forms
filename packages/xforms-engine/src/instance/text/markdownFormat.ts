import type { Heading, RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { type MarkdownNode, type MarkdownProperty, type StyleProperty } from '../../client';
import type { TextChunk } from '../../client/TextRange.ts';
import {
	Anchor,
	ChildMarkdownNode,
	Div,
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
const END_TAG_REGEX = /(<\s*\/span\s*>)|(<\s*\/div\s*>)|(<\s*\/p\s*>)/i;

const supportedHtmlTags = [
	{
		openRegex: /^s*<s*span/i,
		closeRegex: /<\s*\/span\s*>/i,
		create: (children: MarkdownNode[], properties: MarkdownProperty): MarkdownNode => {
			return new Span(children, properties);
		},
	},
	{
		openRegex: /^s*<s*div/i,
		closeRegex: /<\s*\/div\s*>/i,
		create: (children: MarkdownNode[], properties: MarkdownProperty): MarkdownNode => {
			return new Div(children, properties);
		},
	},
	{
		openRegex: /^s*<s*p/i,
		closeRegex: /<\s*\/p\s*>/i,
		create: (children: MarkdownNode[], properties: MarkdownProperty): MarkdownNode => {
			return new Paragraph(children, properties);
		},
	},
];

let outputStrings: Map<string, string>;

function parseStyle(tag: string): StyleProperty {
	const styleProperty = STYLE_PROPERTY_REGEX.exec(tag);
	let color;
	let font;
	let align;
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
			} else if (
				name === 'text-align' &&
				(value === 'center' || value === 'left' || value === 'right')
			) {
				align = value;
			}
		});
	}
	return {
		color,
		'font-family': font,
		'text-align': align,
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
		const outputString = outputStrings.get(tree.value);
		if (outputString) {
			const children = toOdkMarkdown(outputString);
			return new Span(children, undefined);
		}
		return new ChildMarkdownNode(tree.value);
	}
	if ('children' in tree) {
		const children = mdastToOdkMarkdown(tree.children);
		if (tree.type === 'paragraph') {
			return new Paragraph(children, undefined);
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
		if (tree.type === 'html') {
			const tag = supportedHtmlTags.find((supportedTag) => supportedTag.openRegex.test(tree.value));
			if (tag && !tag.closeRegex.test(tree.value)) {
				// SPECIAL CASE in mdast processing
				// span children are parsed into siblings in the mdast for some reason
				// so we need to advance `i` as we consume siblings
				const children: RootContent[] = [];
				let next = elements[++i];
				while (next && !(next.type === 'html' && END_TAG_REGEX.test(next.value))) {
					children.push(next);
					next = elements[++i];
				}
				const odkChildren = mdastToOdkMarkdown(children);
				const properties = { style: parseStyle(tree.value) };
				result.push(tag.create(odkChildren, properties));
			} else {
				result.push(new Html(tree.value));
			}
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
		.map((chunk, i) => {
			const str = chunk.asString;
			if (str && chunk.source === 'output') {
				// we need to process this separately otherwise user entered markup will
				// interract with form markup in unexpected ways
				const id = `--ODK-OUTPUT-STRING-${i}--`;
				outputStrings.set(id, str);
				return '`' + id + '`';
			}
			return str ?? '';
		})
		.join('');
}

function toOdkMarkdown(str: string): MarkdownNode[] {
	const tree = fromMarkdown(str);
	return mdastToOdkMarkdown(tree.children);
}

export function format(chunks: readonly TextChunk[]): MarkdownNode[] {
	outputStrings = new Map<string, string>();
	const str = escapeEditableChunks(chunks);
	return toOdkMarkdown(str);
}
