import type { InitializeForm } from './index.ts';
import { initializeForm as engine__initializeForm } from './instance/index.ts';

export const initializeForm: InitializeForm = engine__initializeForm;

export type * from './client/EngineConfig.ts';
export type * from './client/FormLanguage.ts';
export type * from './client/GroupNode.ts';
export type * from './client/OpaqueReactiveObjectFactory.ts';
export type * from './client/RepeatInstanceNode.ts';
export type * from './client/RepeatRangeNode.ts';
export type * from './client/RootNode.ts';
export type * from './client/SelectNode.ts';
export type * from './client/StringNode.ts';
export type * from './client/SubtreeNode.ts';
export type * from './client/TextRange.ts';
export type {
	AnyChildNode,
	AnyLeafNode,
	AnyNode,
	AnyParentNode,
	GeneralChildNode,
	GeneralParentNode,
} from './client/hierarchy.ts';
export type * from './client/index.ts';

// TODO: notwithstanding potential conflicts with parallel work on `web-forms`
// (former `ui-vue`), these are the last remaining references **outside of
// `xforms-engine`** to anything besides /client/* and the `initializeForm`
// entrypoint implementation. We'll refine the various `definition` types in due
// time.
export type {
	AnySelectDefinition,
	SelectDefinition,
} from './body/control/select/SelectDefinition.ts';
