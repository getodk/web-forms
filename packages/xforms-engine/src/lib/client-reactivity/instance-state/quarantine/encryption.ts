/**
 * WARNING: DO NOT USE
 *
 * More info: README.md
 */

import { SubmissionManifestDefinition } from '../../../../parse/model/SubmissionManifestDefinition';
import { type Submission } from '../prepareInstancePayload';
import { getEncryptedSymmetricKey } from './asymmetric';
import { encryptAttachments } from './symmetric';

export const ENCRYPTED_SUFFIX = '.enc';
export const ENCRYPTED_SUBMISSION_ATTACHMENT_NAME = 'submission.xml.enc';

const generateSymmetricKey = () => {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return bytes;
};

export const encryptSubmission = async (
	formId: string,
	formVersion: string | undefined,
	instanceId: string,
	instanceXML: string,
	attachments: readonly File[],
	encryptionKey: string
): Promise<Submission> => {
	const symmetricKey = generateSymmetricKey();
	const base64EncryptedSymmetricKey = await getEncryptedSymmetricKey(encryptionKey, symmetricKey);

	const manifest = new SubmissionManifestDefinition(
		formId,
		formVersion,
		instanceId,
		base64EncryptedSymmetricKey,
		attachments
	);

	const encryptedAttachments = await encryptAttachments(
		instanceXML,
		instanceId,
		symmetricKey,
		attachments
	);

	return {
		instanceXML: manifest.serialize(),
		attachments: encryptedAttachments,
	};
};
