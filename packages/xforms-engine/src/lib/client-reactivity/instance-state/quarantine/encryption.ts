import * as CryptoJS from 'crypto-js';
import type { InstanceAttachmentsState } from '../../../../instance/attachments/InstanceAttachmentsState';
import type { ClientReactiveSerializableInstance } from '../../../../instance/internal-api/serialization/ClientReactiveSerializableInstance';
import { SubmissionManifestDefinition } from '../../../../parse/model/SubmissionManifestDefinition';
import { InstanceFile } from '../prepareInstancePayload';

const ASYMMETRIC_ALGORITHM = 'RSA-OAEP'; // JAVA: "RSA/NONE/OAEPWithSHA256AndMGF1Padding"

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
		this.ivSeedArray = fromWordArray(md.finalize());
		this.counter = 0;
	}

	next(): string {
		++this.ivSeedArray[this.counter % this.ivSeedArray.length]!;
		++this.counter;
		return String.fromCharCode(...new Uint8Array(this.ivSeedArray));
	}
}

const fromWordArray = function (wordArray: CryptoJS.lib.WordArray): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(wordArray.sigBytes);
	for (let j = 0; j < wordArray.sigBytes; j++) {
		bytes[j] = (wordArray.words[j >>> 2]! >>> (24 - 8 * (j % 4))) & 0xff;
	}
	return bytes;
};

const encryptContent = function (
	content: string,
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
	return fromWordArray(encrypted.ciphertext);
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

export const encryptInstanceFiles = async (
	instanceRoot: ClientReactiveSerializableInstance,
	encryptionKey: string
) => {
	const symmetricKey = generateSymmetricKey();
	const publicKey = await generatePublicKey(encryptionKey);
	const base64EncryptedSymmetricKey = await rsaEncrypt(symmetricKey, publicKey);
	const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);
	const manifest = new SubmissionManifestDefinition(
		instanceRoot,
		base64EncryptedSymmetricKey,
		attachments
	);
	const instanceId = manifest.instanceId;
	const seed = new Seed(instanceId, symmetricKey);
	const data = instanceRoot.instanceState.instanceXML;
	const encrypted: Uint8Array<ArrayBuffer> = encryptContent(data, symmetricKey, seed);
	const payload = new File([encrypted], 'submission.xml.enc', { type: 'application/octet-stream' });
	const instanceFile = new InstanceFile(manifest.serialize());

	// TODO need to encrypt all the attachments
	return { instanceFile, attachments: [payload, ...attachments] };
};
