/**
 * WARNING: DO NOT USE
 *
 * More info: README.md
 */

import type { ClientReactiveSerializableInstance } from '../../../../instance/internal-api/serialization/ClientReactiveSerializableInstance';
import { SubmissionManifestDefinition } from '../../../../parse/model/SubmissionManifestDefinition';
import { InstanceFile, type Submission } from '../prepareInstancePayload';
import { getEncryptedSymmetricKey } from './asymmetric';
import { encryptAttachments } from './symmetric';

export const ENCRYPTED_SUFFIX = '.enc';
export const ENCRYPTED_SUBMISSION_ATTACHMENT_NAME = 'submission.xml.enc';

const generateSymmetricKey = () => {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return bytes;
};

/*

const generateFileSignature = (filename: string, content: string) => {
  const hash = wordArrayFromArrayBuffer(CryptoJS.MD5(content)).toString();
  return `${filename}::${hash}`;
};


const generateSignature = async (manifest: SubmissionManifestDefinition, xml: string, attachments: readonly File[], publicKey: CryptoKey) => {
  const parts = [];
  parts.push(manifest.formId);
  if (manifest.formVersion) {
    parts.push(manifest.formVersion);
  }
  parts.push(manifest.base64EncryptedKey);
  parts.push(manifest.instanceId);

  parts.push(generateFileSignature(SUBMISSION_ATTACHMENT_NAME, xml));
  for (const attachment of attachments) {
    throw new Error('unimplemented');
    // parts.push(generateSignatureFile(attachment.name, attachment.bytes.toString())); // TODO
  }
  const result = parts.join('\n') + '\n';
  const hash = wordArrayFromArrayBuffer(CryptoJS.MD5(result));
  return await rsaEncrypt(hash, publicKey);
};
*/

export const encryptSubmission = async (
	instanceRoot: ClientReactiveSerializableInstance,
	attachments: readonly File[],
	encryptionKey: string
): Promise<Submission> => {
	const symmetricKey = generateSymmetricKey();
	const base64EncryptedSymmetricKey = await getEncryptedSymmetricKey(encryptionKey, symmetricKey);

	// TODO figure out a way to get all the properties I need without constructing an object!
	const manifest = new SubmissionManifestDefinition(
		instanceRoot,
		base64EncryptedSymmetricKey,
		attachments
	);
	// TODO this is never checked by central, so I suggest we don't bother implementing it. I can't test it's working anyway!
	// manifest.signature = await generateSignature(manifest, data, attachments, publicKey);

	const instanceId = manifest.instanceId;
	const xml = instanceRoot.instanceState.instanceXML;
	const encryptedAttachments = await encryptAttachments(xml, instanceId, symmetricKey, attachments);

	const instanceFile = new InstanceFile(manifest.serialize());

	return { instanceFile, attachments: encryptedAttachments };
};
