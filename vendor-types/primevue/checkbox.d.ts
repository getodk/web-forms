import 'primevue/checkbox';

declare module 'primevue/checkbox' {
	export interface TypedEvent<EventType extends string, T extends HTMLElement> {
		readonly type: EventType;
		readonly target: T;
	}

	export interface CheckboxEmits {
		change(event: TypedEvent<'change', HTMLInputElement>): void;
	}
}
