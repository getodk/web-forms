import type { Group } from './Group.ts';
import type { AnyInputControl } from './InputControl.ts';
import type { AnyModelValue } from './ModelValue.ts';
import type { Note } from './Note.ts';
import type { PrimaryInstance } from './PrimaryInstance.ts';
import type { RepeatInstance } from './repeat/RepeatInstance.ts';
import type { RepeatRangeControlled } from './repeat/RepeatRangeControlled.ts';
import type { RepeatRangeUncontrolled } from './repeat/RepeatRangeUncontrolled.ts';
import type { Root } from './Root.ts';
import type { SelectField } from './SelectField.ts';
import type { Subtree } from './Subtree.ts';
import type { TriggerControl } from './TriggerControl.ts';
import type { RangeControl } from './unsupported/RangeControl.ts';
import type { RankControl } from './unsupported/RankControl.ts';
import type { UploadControl } from './unsupported/UploadControl.ts';

export type RepeatRange = RepeatRangeControlled | RepeatRangeUncontrolled;

// prettier-ignore
export type AnyUnsupportedControl =
	| RangeControl
	| RankControl
	| UploadControl;

// prettier-ignore
export type AnyNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstance
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance
	| Note
	| AnyModelValue
	| AnyInputControl
	| SelectField
	| TriggerControl
	| AnyUnsupportedControl;

// prettier-ignore
export type AnyParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| PrimaryInstance
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance;

// prettier-ignore
export type GeneralParentNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatInstance;

// prettier-ignore
export type AnyChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Root
	| Group
	| Subtree
	| RepeatRange
	| RepeatInstance
	| AnyModelValue
	| Note
	| AnyInputControl
	| SelectField
	| TriggerControl
	| AnyUnsupportedControl;

// prettier-ignore
export type GeneralChildNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| Group
	| Subtree
	| RepeatRange
	| AnyModelValue
	| Note
	| AnyInputControl
	| SelectField
	| TriggerControl
	| AnyUnsupportedControl;

// prettier-ignore
export type AnyValueNode =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| AnyModelValue
	| Note
	| AnyInputControl
	| SelectField
	| TriggerControl
	| AnyUnsupportedControl;
