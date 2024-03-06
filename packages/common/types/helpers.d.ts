export type Identity<T> = T;

export type Merge<T> = Identity<{
	[K in keyof T]: T[K];
}>;

export type ExpandUnion<T> = Exclude<T, never>;
