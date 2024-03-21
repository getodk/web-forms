import type { XFormsXPathEvaluator } from '@odk-web-forms/xpath';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import type { ActiveLanguage, FormLanguage, FormLanguages } from '../client/FormLanguage.ts';
import type { RootNode, RootNodeState } from '../client/RootNode.ts';
import type {
	ClientState,
	EngineClientState,
	EngineState,
} from '../lib/reactivity/engine-client-state.ts';
import { engineClientState } from '../lib/reactivity/engine-client-state.ts';
import type { RootDefinition } from '../model/RootDefinition.ts';
import type { InstanceNodeState } from './abstract/InstanceNode.ts';
import { InstanceNode } from './abstract/InstanceNode.ts';
import { buildChildren } from './children.ts';
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
	protected readonly state: EngineClientState<RootState>;
	protected readonly engineState: EngineState<RootState>;

	readonly currentState: ClientState<RootState>;

	/**
	 * @todo this will be used to construct new instances of each node in the
	 * backing DOM store.
	 */
	protected readonly instanceDOM: XFormDOM;

	// BaseNode
	readonly root = this;

	// EvaluationContext
	readonly evaluator: XFormsXPathEvaluator;
	readonly contextNode: Element;

	// RootNode
	readonly parent = null;

	readonly languages: FormLanguages;

	constructor(form: XFormDefinition, engineConfig: InstanceConfig) {
		const definition = form.model.root;

		super(engineConfig, definition);

		const reference = definition.nodeset;
		const instanceDOM = form.xformDOM.createInstance();
		const evaluator = instanceDOM.primaryInstanceEvaluator;
		const { translations } = evaluator;
		const { activeLanguage, languages } = getInitialLanguageState(translations);

		const state = engineClientState<RootState>(engineConfig.stateFactory, {
			activeLanguage,
			reference,
			label: null,
			hint: null,
			readonly: false,
			relevant: true,
			required: false,
			valueOptions: null,
			value: null,
			children: [],
		});

		this.state = state;
		this.engineState = state.engineState;
		this.currentState = state.clientState;

		const contextNode = instanceDOM.xformDocument.createElement(definition.nodeName);

		instanceDOM.primaryInstanceRoot.replaceWith(contextNode);

		this.evaluator = evaluator;
		this.contextNode = contextNode;
		this.instanceDOM = instanceDOM;
		this.languages = languages;

		state.updateValue('children', buildChildren(this));
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
