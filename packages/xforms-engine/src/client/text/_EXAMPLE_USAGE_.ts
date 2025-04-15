import type { RichText } from './RichText.ts';
import type { RichTextSection } from './RichTextSection.ts';

/**
 * @todo [Example usage for design review, remove before implementation.]
 */
// @ts-expect-error - Example usage, intentionally not used or exported!
// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars
namespace _EXAMPLE_USAGE_ {
	declare const expectType: <T>(actual: NoInfer<T>) => void;
	declare const expectTypeError: <T = never>(actual: T) => void;

	// eslint-disable-next-line @typescript-eslint/no-namespace
	export namespace UseCase_NodeTextStates {
		/** Per @lognaturel */
		type LabelAlternatesKey = 'short';

		/** Per @lognaturel */
		type HintAlternatesKey = 'guidance';

		type NodeLabel = RichText<LabelAlternatesKey>;

		type NodeHint = RichText<HintAlternatesKey>;

		declare const label: NodeLabel;

		expectType<RichTextSection | null>(label.blocks);
		expectType<RichTextSection | null>(label.alternates.short);

		expectTypeError(
			// @ts-expect-error - Label does not have a 'guidance' alternate!
			label.alternates.guidance
		);

		declare const hint: NodeHint;

		expectType<RichTextSection | null>(hint.blocks);
		expectType<RichTextSection | null>(hint.alternates.guidance);

		expectTypeError(
			// @ts-expect-error - Label does not have a 'short' alternate!
			hint.alternates.short
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-namespace
	export namespace UseCase__Validation {
		interface ViolationMessage extends RichText {}
		interface BaseValidation {
			readonly valid: boolean;
			readonly message: ViolationMessage | null;
		}

		interface ValidationFailure extends BaseValidation {
			readonly valid: false;
			readonly message: ViolationMessage;
		}

		interface ValidationPass extends BaseValidation {
			readonly valid: true;
			readonly message: null;
		}

		type ValidationState = ValidationFailure | ValidationPass;

		declare const validation: ValidationState;

		if (!validation.valid) {
			expectType<ViolationMessage>(validation.message);
			expectType<RichTextSection | null>(validation.message.blocks);
			expectType<null>(validation.message.alternates);

			expectTypeError(
				// @ts-expect-error - By default, `RichText` has no `alternates` of any key!
				validation.message.alternates!.short
			);
			expectTypeError(
				// @ts-expect-error - By default, `RichText` has no `alternates` of any key!
				validation.message.alternates!.guidance
			);
		}
	}
}
