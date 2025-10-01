export type Heading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type ElementName = Heading | 'a' | 'em' | 'img' | 'li' | 'ol' | 'span' | 'strong' | 'ul';

export interface MarkdownNode {
	// TODO more type discrimintation ( as per https://github.com/getodk/web-forms/issues/198 )
	elementName?: ElementName;
	value?: string;
	properties?: {
		style: StyleProperty;
	};
	children?: MarkdownNode[];
	url?: string;
}

export interface StyleProperty {
	color?: string;
	'font-family'?: string;
}
