import type { EngineConfig } from './EngineConfig.ts';
import type { RootNode } from './RootNode.ts';

type InitFormInput = Blob | URL | string;

export type InitializeForm = (input: InitFormInput, config?: EngineConfig) => Promise<RootNode>;

export declare const initializeForm: InitializeForm;
