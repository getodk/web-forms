import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode, RootNodeState } from '../client/RootNode.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { InstanceNodeState } from './abstract/InstanceNode.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import type { GeneralChildNode } from './hierarchy.ts';
import type { EvaluationContext } from './internal-api/EvaluationContext.ts';
import type { InstanceConfig } from './internal-api/InstanceConfig.ts';
import type { SubscribableDependency } from './internal-api/SubscribableDependency.ts';

interface RootState extends RootNodeState, InstanceNodeState {
	get label(): null;
	get hint(): null;
	get children(): readonly GeneralChildNode[];
	get valueOptions(): null;
	get value(): null;

	// Root-specific
	get activeLanguage(): ActiveLanguage;
}

// Subset of types expected from evaluator
interface ItextTranslations {
	getActiveLanguage(): string | null;
	getLanguages(): readonly string[];
}

interface InitialLanguageState {
	readonly activeLanguage: ActiveLanguage;
	readonly languages: FormLanguages;
}

// TODO: it's really very silly that the XPath evaluator is the current
// definitional source of truth for translation stuff... even though it currently makes sense that that's where it's first derived.
const getInitialLanguageState = (translations: ItextTranslations): InitialLanguageState => {
	const activeLanguageName = translations.getActiveLanguage();

	if (activeLanguageName == null) {
		const activeLanguage: ActiveLanguage = {
			isSyntheticDefault: true,
			language: '',
		};
		const languages = [activeLanguage] satisfies FormLanguages;

		return {
			activeLanguage,
			languages,
		};
	}

	const languageNames = translations.getLanguages();

	const inactiveLanguages = languageNames
		.filter((languageName) => {
			return languageName !== activeLanguageName;
		})
		.map((language): FormLanguage => {
			return { language };
		});

	const languages = [
		{ language: activeLanguageName } satisfies FormLanguage,

		...inactiveLanguages,
	] satisfies FormLanguages;
	const [activeLanguage] = languages;

	return {
		activeLanguage,
		languages,
	};
};

export class Root
	extends InstanceNode<RootDefinition, RootState>
	implements RootNode, EvaluationContext, SubscribableDependency
{
	/**
	 * @todo this will be used to construct new instances of each node in the
	 * backing DOM store.
	 */
	protected readonly instanceDOM: XFormDOM;

	// BaseNode
	readonly root = this;

	// EvaluationContext
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextReference: string;
	readonly contextNode: Element;

	// RootNode
	readonly parent = null;

	readonly languages: FormLanguages;

	constructor(form: XFormDefinition, engineConfig: InstanceConfig) {
		const definition = form.model.root;
		const reference = definition.nodeset;
		const instanceDOM = form.xformDOM.createInstance();
		const evaluator = instanceDOM.primaryInstanceEvaluator;
		const { translations } = evaluator;
		const { activeLanguage, languages } = getInitialLanguageState(translations);
		const initialState: RootState = {
			get reference() {
				return reference;
			},

			activeLanguage,

			get label(): null {
				return null;
			},
			get hint(): null {
				return null;
			},
			get readonly(): false {
				return false;
			},
			get relevant(): true {
				return true;
			},
			get required(): false {
				return false;
			},
			get valueOptions(): null {
				return null;
			},
			get value(): null {
				return null;
			},

			// TODO (1): implement children at all
			//
			// TODO (2): the engine/client state bridge creates a computed effect
			// which always throws if an input getter throws. This is probably too
			// aggressive, and also probably a really good sign that the reflection
			// effects themselves are too aggressive.
			get children(): GeneralChildNode[] {
				return [];
			},
		};
		const state = engineClientState(engineConfig.stateFactory, initialState);

		super(engineConfig, definition, state);

		const contextNode = instanceDOM.xformDocument.createElement(definition.nodeName);

		instanceDOM.primaryInstanceRoot.replaceWith(contextNode);

		this.evaluator = evaluator;
		this.contextReference = initialState.reference;
		this.contextNode = contextNode;
		this.instanceDOM = instanceDOM;
		this.languages = languages;
	}

	// RootNode
	setLanguage(language: FormLanguage): Root {
		const activeLanguage = this.languages.find((formLanguage) => {
			return formLanguage.language === language.language;
		});

		if (activeLanguage == null) {
			throw new Error(`Language "${language.language}" not available`);
		}

		this.state.updateValue('activeLanguage', activeLanguage);

		return this;
	}

	// EvaluationContext
	getSubscribableDependencyByReference(_reference: string): SubscribableDependency | null {
		throw new Error('Not implemented');
	}

	// SubscribableDependency
	subscribe(): void {
		// Presently, the only reactive (and thus subscribable) aspect of the root
		// node is the active form language.
		this.engineState.activeLanguage;
	}
}
