import { For, Match, Show, Switch, createSignal } from 'solid-js';
import ArrowDropDown from 'suid/icons-material/ArrowDropDown';
import ArrowRight from 'suid/icons-material/ArrowRight';
import MoreHoriz from 'suid/icons-material/MoreHoriz';
import { Stack, styled } from 'suid/material';

const isNonEmpty = <T,>(array: readonly T[]): array is readonly [T, ...T[]] => {
	return array.length > 0;
};

const childElements = (element: Element): readonly [Element, ...Element[]] | null => {
	const children = Array.from(element.children);

	return isNonEmpty(children) ? children : null;
};

const elementAttributes = (element: Element): readonly [Attr, ...Attr[]] | null => {
	const attributes = Array.from(element.attributes);

	return isNonEmpty(attributes) ? attributes : null;
};

const elementValue = (element: Element): string | null => {
	const { textContent } = element;

	if (textContent !== '') {
		return textContent;
	}

	return null;
};

const HighlightAttributeName = styled('span')({
	color: '#0184bc',
});

const HighlightAttributeValue = styled('span')({
	color: '#50a14f',
});

const HighlightTag = styled('span')({
	color: '#a626a4',
});

const HighlightExpandableTag = styled(HighlightTag)({
	cursor: 'pointer',
});

const ElementTreeNode = styled('pre')({
	lineHeight: 1.375,
	marginBlock: 0,
	paddingBlock: 0,
	paddingInlineStart: '1.25rem',
	whiteSpace: 'pre-wrap',
});

interface AttributeProps {
	readonly attribute: Attr;
}

const Attribute = (props: AttributeProps) => {
	return (
		<>
			<HighlightAttributeName>{props.attribute.name}</HighlightAttributeName>=
			<HighlightAttributeValue>
				"{props.attribute.value.replaceAll('"', '&quot;')}"
			</HighlightAttributeValue>
		</>
	);
};

interface ElementTreeProps {
	readonly element: Element;
}

const Attributes = (props: ElementTreeProps) => {
	return (
		<Show when={elementAttributes(props.element)} keyed={true}>
			{(attributes) => {
				return (
					<For each={attributes}>
						{(attribute) => {
							return (
								<>
									{' '}
									<Attribute attribute={attribute} />
								</>
							);
						}}
					</For>
				);
			}}
		</Show>
	);
};

const SubtreeIcon = styled('div')({
	display: 'block',
	position: 'relative',
	width: '1.25rem',
	height: '1.25rem',
	marginInlineStart: '-1.25rem',
	overflow: 'hidden',
	flexShrink: 0,

	'& > svg': {
		marginBlockStart: 0,
		marginInlineStart: '-0.125em',
	},
});

const OpenTag = (props: ElementTreeProps) => {
	return (
		<HighlightTag>
			&lt;
			{props.element.tagName}
			<Attributes element={props.element} />
			&gt;
		</HighlightTag>
	);
};

const ExpandableOpenTag = (props: ElementTreeProps) => {
	return (
		<HighlightExpandableTag>
			&lt;
			{props.element.tagName}
			<Attributes element={props.element} />
			&gt;
		</HighlightExpandableTag>
	);
};

const CloseTag = (props: ElementTreeProps) => {
	return <HighlightTag>&lt;/{props.element.tagName}&gt;</HighlightTag>;
};

const SelfClosedTag = (props: ElementTreeProps) => {
	return (
		<HighlightTag>
			&lt;
			{props.element.tagName}
			<Attributes element={props.element} />
			/&gt;
		</HighlightTag>
	);
};

const Ellipse = styled(MoreHoriz)({
	color: '#fff',
	backgroundColor: '#999',
	borderRadius: '3px',
	cursor: 'pointer',
	fontSize: '1em',
	marginInlineStart: '0.5em',
	verticalAlign: 'bottom',
});

export const ElementTree = (props: ElementTreeProps) => {
	const [isExpanded, setIsExpanded] = createSignal(false);
	const toggle = () => setIsExpanded((value) => !value);

	return (
		<ElementTreeNode>
			<Switch fallback={<SelfClosedTag element={props.element} />}>
				<Match when={childElements(props.element)} keyed={true}>
					{(children) => {
						return (
							<>
								<Stack
									direction="row"
									alignItems="center"
									role="button"
									onClick={() => {
										toggle();
									}}
								>
									<SubtreeIcon>
										<Show when={isExpanded()} fallback={<ArrowRight fontSize="small" />}>
											<ArrowDropDown fontSize="small" />
										</Show>
									</SubtreeIcon>
									<ExpandableOpenTag element={props.element} />
									<Show when={!isExpanded()}>
										<Ellipse />
									</Show>
								</Stack>
								<Show when={isExpanded()}>
									<For each={children}>
										{(child) => {
											return <ElementTree element={child} />;
										}}
									</For>
									<CloseTag element={props.element} />
								</Show>
							</>
						);
					}}
				</Match>
				<Match when={elementValue(props.element)} keyed={true}>
					{(value) => {
						return (
							<>
								<OpenTag element={props.element} />
								{value}
								<CloseTag element={props.element} />
							</>
						);
					}}
				</Match>
			</Switch>
		</ElementTreeNode>
	);
};
