export type Heading = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface MarkdownNode { // TODO more type discrimintation ( as per https://github.com/getodk/web-forms/issues/198 )
  elementName?: 'strong' | 'em' | 'span' | 'a' | Heading;
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
