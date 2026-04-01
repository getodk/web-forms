import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import * as CryptoJS from 'crypto-js';
import type { InstanceAttachmentsState } from '../../../../instance/attachments/InstanceAttachmentsState';
import type { ClientReactiveSerializableInstance } from '../../../../instance/internal-api/serialization/ClientReactiveSerializableInstance';
import { SubmissionManifestDefinition } from '../../../../parse/model/SubmissionManifestDefinition';
import { InstanceFile } from '../prepareInstancePayload';

const ASYMMETRIC_ALGORITHM = 'RSA-OAEP'; // JAVA: "RSA/NONE/OAEPWithSHA256AndMGF1Padding"
const SUBMISSION_ATTACHMENT_NAME = 'submission.xml';
const ENCRYPTED_SUFFIX = '.enc';

class Seed {
	readonly ivSeedArray;
	counter;

	public constructor(
		readonly instanceId: string,
		readonly symmetricKey: Uint8Array<ArrayBuffer>
	) {
		const key = CryptoJS.lib.WordArray.create(symmetricKey);
		const md = CryptoJS.algo.MD5.create();
		md.update(instanceId);
		md.update(key);
		this.ivSeedArray = wordArrayFromArrayBuffer(md.finalize());
		this.counter = 0;
	}

	next(): string {
		++this.ivSeedArray[this.counter % this.ivSeedArray.length]!;
		++this.counter;
		return String.fromCharCode(...new Uint8Array(this.ivSeedArray));
	}
}

function arrayBufferToWordArray(ab: ArrayBuffer) {
	const i8a = new Uint8Array(ab);
	const a = [];
	for (let i = 0; i < i8a.length; i += 4) {
		a.push((i8a[i]! << 24) | (i8a[i + 1]! << 16) | (i8a[i + 2]! << 8) | i8a[i + 3]!);
	}
	return CryptoJS.lib.WordArray.create(a);
}

const wordArrayFromArrayBuffer = function (
	wordArray: CryptoJS.lib.WordArray
): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(wordArray.sigBytes);
	for (let j = 0; j < wordArray.sigBytes; j++) {
		bytes[j] = (wordArray.words[j >>> 2]! >>> (24 - 8 * (j % 4))) & 0xff;
	}
	return bytes;
};

const encryptContent = function (
	content: CryptoJS.lib.WordArray | string,
	symmetricKey: Uint8Array<ArrayBuffer>,
	seed: Seed
): Uint8Array<ArrayBuffer> {
	const ivString = seed.next();
	const iv = CryptoJS.enc.Latin1.parse(ivString);
	const key = CryptoJS.lib.WordArray.create(symmetricKey);
	const encrypted = CryptoJS.AES.encrypt(content, key, {
		iv: iv,
		mode: CryptoJS.mode.CFB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return wordArrayFromArrayBuffer(encrypted.ciphertext);
};

// Equivalent to "RSA/NONE/OAEPWithSHA256AndMGF1Padding"
const rsaEncrypt = async (symmetricKey: Uint8Array<ArrayBuffer>, publicKey: CryptoKey) => {
	const encrypted = await crypto.subtle.encrypt(
		{ name: ASYMMETRIC_ALGORITHM },
		publicKey,
		symmetricKey
	);
	return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

const generatePublicKey = async (encryptionKey: string) => {
	const binaryDer = atob(encryptionKey);
	const buff = new Uint8Array(binaryDer.length);
	for (let i = 0; i < binaryDer.length; i++) {
		buff[i] = binaryDer.charCodeAt(i);
	}
	return await crypto.subtle.importKey(
		'spki', // The format of the key to be imported (SubjectPublicKeyInfo)
		buff, // The public key data
		{
			name: ASYMMETRIC_ALGORITHM, // The algorithm the imported key will be used with
			hash: 'SHA-256', // The hash function to be used with the algorithm
		},
		true, // Whether the key is extractable
		['encrypt'] // The intended use for the key (encryption in this case)
	);
};

const generateSymmetricKey = () => {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return bytes;
};

// TODO deduplicate this with the version in parepareInstancePayload
const collectInstanceAttachmentFiles = (attachments: InstanceAttachmentsState): readonly File[] => {
	const files = Array.from(attachments.entries()).map(([context, attachment]) => {
		if (!context.isAttached() || !context.isRelevant()) {
			return null;
		}

		return attachment.getValue();
	});

	return files.filter((file) => file != null);
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

const encryptAttachment = async (
	attachment: File,
	symmetricKey: Uint8Array<ArrayBuffer>,
	seed: Seed
): Promise<File> => {
	const content = await getBlobData(attachment);
	const wa = arrayBufferToWordArray(content);
	const encrypted = encryptContent(wa, symmetricKey, seed);
	return new File([encrypted], attachment.name + ENCRYPTED_SUFFIX, {
		type: 'application/octet-stream',
	});
};

export const encryptInstanceFiles = async (
	instanceRoot: ClientReactiveSerializableInstance,
	encryptionKey: string
) => {
	const symmetricKey = generateSymmetricKey();
	const publicKey = await generatePublicKey(encryptionKey);
	const base64EncryptedSymmetricKey = await rsaEncrypt(symmetricKey, publicKey);
	const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);

	const data = instanceRoot.instanceState.instanceXML;
	// TODO figure out a way to get all the properties I need without constructing an object!
	const manifest = new SubmissionManifestDefinition(
		instanceRoot,
		base64EncryptedSymmetricKey,
		attachments
	);
	// TODO this is never checked by central, so I suggest we don't bother implementing it. I can't test it's working anyway!
	// manifest.signature = await generateSignature(manifest, data, attachments, publicKey);

	const instanceId = manifest.instanceId;
	const seed = new Seed(instanceId, symmetricKey);
	const encryptedAttachments: File[] = [];
	for (const attachment of attachments) {
		const encrypted = await encryptAttachment(attachment, symmetricKey, seed);
		encryptedAttachments.push(encrypted);
	}
	const encrypted: Uint8Array<ArrayBuffer> = encryptContent(data, symmetricKey, seed);
	const submissionFile = new File([encrypted], SUBMISSION_ATTACHMENT_NAME + ENCRYPTED_SUFFIX, {
		type: 'application/octet-stream',
	});
	encryptedAttachments.push(submissionFile);

	const instanceFile = new InstanceFile(manifest.serialize());

	return { instanceFile, attachments: encryptedAttachments };
};
