import { For, Match, Show, Switch, createSignal } from 'solid-js';
import ArrowDropDown from 'suid/icons-material/ArrowDropDown';
import ArrowRight from 'suid/icons-material/ArrowRight';
import { Stack, styled } from 'suid/material';
import { ElementTree } from './ElementTree.tsx';

const SubtreeIcon = styled('span')({
	display: 'inline-block',
	position: 'relative',
	width: '1.125rem',
	height: '1rem',
	overflow: 'hidden',
	flexShrink: 0,
	color: '#000',

	'& > svg': {
		marginInlineStart: '-0.125em',
	},
});

const Key = styled('span')({
	color: '#a626a4',
	cursor: 'default',
	fontFamily: 'monospace',
	lineHeight: 1.375,
});

const FixedKey = styled(Key)({
	paddingLeft: '1rem',
});

const ExpandableKey = styled(Key)({
	fontWeight: 'bold',
	cursor: 'pointer',
});

// prettier-ignore
type ObjectTreePrimitiveValue =
	| boolean
	| number
	| string
	| null
	| undefined;

// prettier-ignore
type ObjectTreeTerminalValue =
	| Element
	| ObjectTreePrimitiveValue;

// prettier-ignore
type ObjectTreeValue =
	| AnyObjectTreeObject
	| ObjectTreeArray
	| ObjectTreeTerminalValue;

type ObjectTreeArray = readonly ObjectTreeValue[];

type ObjectTreeObject<K extends string, V extends ObjectTreeValue> = {
	[P in K]: V;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObjectTreeObject = ObjectTreeObject<any, any>;

const valueFilter = <T, U extends T>(
	predicate: (value: T) => value is U
): ((value: T) => U | null) => {
	return (v) => {
		return predicate(v) ? v : null;
	};
};

const isPrimitive = (value: ObjectTreeValue): value is ObjectTreePrimitiveValue => {
	return (
		typeof value === 'boolean' ||
		typeof value === 'number' ||
		typeof value === 'string' ||
		value == null
	);
};

const isNullish = (value: ObjectTreeValue): value is null | undefined => {
	return value == null;
};

const nullish = valueFilter(isNullish);

const Nullish = styled('span')({
	color: '#999',
});

const primitive = valueFilter(isPrimitive);

interface PrimitiveTreeNodeProps {
	readonly value: ObjectTreePrimitiveValue;
}

const PrimitiveTreeNode = (props: PrimitiveTreeNodeProps) => {
	return <pre>{JSON.stringify(props.value)}</pre>;
};

const isElement = (value: ObjectTreeValue): value is Element => {
	return value instanceof Element;
};

const element = valueFilter(isElement);

interface ElementTreeNodeProps {
	readonly value: Element;
}

const ElementTreeNode = (props: ElementTreeNodeProps) => {
	return <ElementTree element={props.value} />;
};

const isArray = (value: ObjectTreeValue): value is Extract<ObjectTreeValue, ObjectTreeArray> => {
	return Array.isArray(value);
};

const array = valueFilter(isArray);

interface ArrayTreeNodeProps {
	readonly value: ObjectTreeArray;
}

const ArrayTreeNode = (props: ArrayTreeNodeProps) => {
	return (
		<For each={props.value}>
			{(item, index) => {
				return <ObjectTreeNode key={`${index()}`} value={item} />;
			}}
		</For>
	);
};

const isObject = (value: ObjectTreeValue): value is AnyObjectTreeObject => {
	return !isElement(value) && !isArray(value) && !isPrimitive(value);
};

const object = valueFilter(isObject);

interface ObjectTreeNodeProps<T extends ObjectTreeValue> {
	readonly key?: string;
	readonly value: T;
}

const ObjectSubtree = styled('div')({
	margin: 0,
	paddingBlock: 0,
	paddingInlineStart: '0.75rem',
	whiteSpace: 'pre',
});

export const ObjectTreeNode = <T extends ObjectTreeValue>(props: ObjectTreeNodeProps<T>) => {
	const primitiveValue = () => primitive(props.value);
	const isPrimitiveValue = primitiveValue() != null;
	const isToggleable = () => props.key != null && !isPrimitiveValue;
	const direction = () => (isToggleable() ? 'column' : 'row');
	const spacing = () => (isToggleable() ? 0 : 1);
	const [isExpanded, setIsExpanded] = createSignal(!isToggleable());
	const toggle = () => {
		if (isToggleable()) {
			return setIsExpanded((value) => !value);
		}

		return true;
	};

	return (
		<Stack direction={direction()} spacing={spacing()}>
			<Show when={props.key} keyed={true}>
				{(key) => {
					return (
						<Stack direction="row" alignItems="center">
							<Show when={isToggleable()} fallback={<FixedKey>{key}:</FixedKey>}>
								<ExpandableKey onClick={() => toggle()}>
									<SubtreeIcon>
										<Show when={isExpanded()} fallback={<ArrowRight fontSize="small" />}>
											<ArrowDropDown fontSize="small" />
										</Show>
									</SubtreeIcon>
									{key}:
								</ExpandableKey>
							</Show>
						</Stack>
					);
				}}
			</Show>
			<Show when={isExpanded()}>
				<Switch>
					<Match when={element(props.value)} keyed={true}>
						{(value) => {
							return (
								<ObjectSubtree>
									<ElementTreeNode value={value} />
								</ObjectSubtree>
							);
						}}
					</Match>
					<Match when={array(props.value)} keyed={true}>
						{(value) => {
							return (
								<ObjectSubtree>
									<ArrayTreeNode value={value} />
								</ObjectSubtree>
							);
						}}
					</Match>
					{/* <Match when={jsonSerializable(props.value)} keyed={true}>
						{(value) => {
							return <ObjectTreeNode value={value.toJSON()} />;
						}}
					</Match> */}
					<Match when={object(props.value)} keyed={true}>
						{(value) => {
							return (
								<ObjectSubtree>
									<ObjectTree value={value} />
								</ObjectSubtree>
							);
						}}
					</Match>
					<Match when={nullish(props.value)}>
						<Nullish>{props.value === null ? 'null' : 'undefined'}</Nullish>
					</Match>
					<Match when={primitiveValue()} keyed={true}>
						{(value) => {
							return <PrimitiveTreeNode value={value} />;
						}}
					</Match>
				</Switch>
			</Show>
		</Stack>
	);
};

interface ObjectTreeProps<T extends AnyObjectTreeObject> {
	readonly value: T;
}

export const ObjectTree = <T extends AnyObjectTreeObject>(props: ObjectTreeProps<T>) => {
	const entries = () =>
		Object.entries(props.value) as ReadonlyArray<readonly [string, ObjectTreeValue]>;

	return (
		<For each={entries()}>
			{([key, value]) => {
				return <ObjectTreeNode key={key} value={value} />;
			}}
		</For>
	);
};
