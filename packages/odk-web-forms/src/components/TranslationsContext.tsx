import { createContext, createSignal, JSX, type Signal } from 'solid-js';
import { TranslationState } from '../lib/xform/state/TranslationState';

type TranslationsContextState = Signal<TranslationState | null>;

export const TranslationsContext = createContext<TranslationsContextState>([
	() => null,
	() => null,
]);

interface TranslationsContextProviderProps {
	readonly children: JSX.Element;
}

export const TranslationsContextProvider = (props: TranslationsContextProviderProps) => {
	const [translations, setTranslations] = createSignal<TranslationState | null>(null);

	return (
		<TranslationsContext.Provider value={[translations, setTranslations]}>
			{props.children}
		</TranslationsContext.Provider>
	);
};
