import type { RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Heading, MarkdownNode, StyleProperty } from '../../client';
import type { TextChunk } from '../../client/TextRange.ts';

const STYLE_PROPERTY_REGEX = /style\s*=\s*("([^"]*)"|'([^']*)')/i;

function parseStyle(tag: string): StyleProperty {
	const styleProperty = STYLE_PROPERTY_REGEX.exec(tag);
	if (!styleProperty || styleProperty.length < 2) {
		return {};
	}
	const styleValue = styleProperty[2] ?? '';
	const properties = styleValue.split(';');
	const result: StyleProperty = {};
	properties.forEach((property) => {
		const [name, value] = property.split(':');
		if (!name || !value) {
			return;
		}
		if (name === 'color') {
			result.color = value;
		} else if (name === 'font-family') {
			result['font-family'] = value;
		}
	});
	return result;
}

function mdastToOdkMarkdown(elements: RootContent[]): MarkdownNode[] {
	const result: MarkdownNode[] = [];
	for (let i = 0; i < elements.length; i++) {
		const tree = elements[i]!;
		if (tree.type === 'paragraph') {
			result.push({
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'strong') {
			result.push({
				elementName: 'strong',
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'emphasis') {
			result.push({
				elementName: 'em',
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'link') {
			result.push({
				elementName: 'a',
				url: tree.url,
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'list') {
			result.push({
				elementName: tree.ordered ? 'ol' : 'ul',
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'listItem') {
			result.push({
				elementName: 'li',
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'heading') {
			let elementName: Heading;
			if (tree.depth <= 1) elementName = 'h1';
			else if (tree.depth === 2) elementName = 'h2';
			else if (tree.depth === 3) elementName = 'h3';
			else if (tree.depth === 4) elementName = 'h4';
			else if (tree.depth === 5) elementName = 'h5';
			else elementName = 'h6';
			result.push({
				elementName,
				children: mdastToOdkMarkdown(tree.children),
			});
		}
		if (tree.type === 'text' || tree.type === 'inlineCode') {
			result.push({ value: tree.value });
		}
		if (tree.type === 'html' && tree.value.startsWith('<span ')) {
			const children = [];
			let next = elements[++i];
			while (next && !(next.type === 'html' && next.value === '</span>')) {
				children.push(next);
				next = elements[++i];
			}

			result.push({
				elementName: 'span',
				properties: { style: parseStyle(tree.value) },
				children: mdastToOdkMarkdown(children),
			});
		}
	}
	return result;
}

function escapeEditableChunks(chunks: readonly TextChunk[]) {
	return chunks
		.map((chunk) => {
			if (chunk.source === 'output') {
				return chunk.asString ? '`' + chunk.asString + '`' : ''; // backticks so it doesn't get markeddown
			} else {
				return chunk.asString;
			}
		})
		.join('');
}

export function format(chunks: readonly TextChunk[]): MarkdownNode[] {
	const str = escapeEditableChunks(chunks);
	const tree = fromMarkdown(str);
	const odkMarkdownTree = mdastToOdkMarkdown(tree.children);
	return odkMarkdownTree;
}
