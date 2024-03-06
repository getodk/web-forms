export interface BaseFormLanguage {
	readonly isSyntheticDefault?: true;
	readonly language: string;
}

export interface SyntheticDefaultLanguage extends BaseFormLanguage {
	readonly isSyntheticDefault: true;
	readonly language: '';
}

export interface FormLanguage extends BaseFormLanguage {
	readonly isSyntheticDefault?: never;
	readonly language: string;
}

// prettier-ignore
export type ActiveLanguage =
	| FormLanguage
	| SyntheticDefaultLanguage;

// prettier-ignore
export type FormLanguages =
	| readonly [FormLanguage, ...FormLanguage[]]
	| readonly [SyntheticDefaultLanguage];
