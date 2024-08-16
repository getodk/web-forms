import type { DeprecatedID, InstanceID } from '../identity.ts';
import type { SubmissionInstanceFile } from './SubmissionInstanceFile.ts';

export interface SubmissionDefinition {
	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `action` submission attribute}
	 */
	readonly submissionAction: URL | null;

	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `method` submission attribute}
	 */
	readonly submissionMethod: 'post';

	/**
	 * @see {@link https://getodk.github.io/xforms-spec/#submission-attributes | `base64RsaPublicKey` submission attribute}
	 */
	readonly encryptionKey: string | null;

	/**
	 * Note: this value will also be populated in a submission's
	 * {@link SubmissionInstanceFile} in accordance with the ODK XForms
	 * Specification.
	 *
	 * @see
	 * {@link https://getodk.github.io/xforms-spec/#metadata | `instanceID` metadata element}
	 */
	readonly instanceID: InstanceID;

	/**
	 * Note: this value will be populated in an edited submission's
	 * {@link SubmissionInstanceFile} in accordance with the ODK XForms
	 * Specification.
	 *
	 * @see
	 * {@link https://getodk.github.io/xforms-spec/#metadata | `deprecatedID` metadata element}
	 */
	readonly deprecatedID: DeprecatedID | null;
}
