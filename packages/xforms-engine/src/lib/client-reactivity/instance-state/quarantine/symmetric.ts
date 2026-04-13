/**
 * WARNING: DO NOT USE
 *
 * More info: README.md
 */
import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import * as CryptoJS from 'crypto-js';
import { ENCRYPTED_SUBMISSION_ATTACHMENT_NAME, ENCRYPTED_SUFFIX } from './encryption';

const arrayBufferToWordArray = (buffer: Uint8Array<ArrayBuffer>) => {
	const bytes = [];
	for (let i = 0; i < buffer.length; i += 4) {
		bytes.push(
			(buffer[i] ?? 0 << 24) |
				(buffer[i + 1] ?? 0 << 16) |
				(buffer[i + 2] ?? 0 << 8) |
				(buffer[i + 3] ?? 0)
		);
	}
	return CryptoJS.lib.WordArray.create(bytes, buffer.byteLength);
};

const wordArrayToArrayBuffer = (wordArray: CryptoJS.lib.WordArray): Uint8Array<ArrayBuffer> => {
	const bytes = new Uint8Array(wordArray.sigBytes);
	for (let j = 0; j < wordArray.sigBytes; j++) {
		bytes[j] = (wordArray.words[j >>> 2]! >>> (24 - 8 * (j % 4))) & 0xff;
	}
	return bytes;
};

class Seed {
	readonly ivSeedArray;
	private counter = 0;

	public constructor(
		readonly instanceId: string,
		readonly symmetricKey: Uint8Array<ArrayBuffer>
	) {
		const key = CryptoJS.lib.WordArray.create(symmetricKey);
		const md = CryptoJS.algo.MD5.create();
		md.update(instanceId);
		md.update(key);
		this.ivSeedArray = wordArrayToArrayBuffer(md.finalize());
	}

	next(): string {
		++this.ivSeedArray[this.counter % this.ivSeedArray.length]!;
		++this.counter;
		return String.fromCharCode(...new Uint8Array(this.ivSeedArray));
	}
}

const encryptContent = (
	content: CryptoJS.lib.WordArray | string,
	symmetricKey: Uint8Array<ArrayBuffer>,
	seed: Seed
): Uint8Array<ArrayBuffer> => {
	const ivString = seed.next();
	const iv = CryptoJS.enc.Latin1.parse(ivString);
	const key = CryptoJS.lib.WordArray.create(symmetricKey);
	const encrypted = CryptoJS.AES.encrypt(content, key, {
		iv: iv,
		mode: CryptoJS.mode.CFB,
		padding: CryptoJS.pad.Pkcs7,
	});
	return wordArrayToArrayBuffer(encrypted.ciphertext);
};

const encryptAttachment = async (
	attachment: File,
	symmetricKey: Uint8Array<ArrayBuffer>,
	seed: Seed
): Promise<File> => {
	const content = await getBlobData(attachment);
	const wa = arrayBufferToWordArray(new Uint8Array(content));
	const encrypted = encryptContent(wa, symmetricKey, seed);
	return new File([encrypted], attachment.name + ENCRYPTED_SUFFIX, {
		type: 'application/octet-stream',
	});
};

export const encryptAttachments = async (
	instanceXML: string,
	instanceId: string,
	symmetricKey: Uint8Array<ArrayBuffer>,
	attachments: readonly File[]
): Promise<readonly File[]> => {
	const seed = new Seed(instanceId, symmetricKey);
	const encryptedAttachments: File[] = [];
	for (const attachment of attachments) {
		const encrypted = await encryptAttachment(attachment, symmetricKey, seed);
		encryptedAttachments.push(encrypted);
	}

	const encrypted: Uint8Array<ArrayBuffer> = encryptContent(instanceXML, symmetricKey, seed);
	const submissionFile = new File([encrypted], ENCRYPTED_SUBMISSION_ATTACHMENT_NAME, {
		type: 'application/octet-stream',
	});
	encryptedAttachments.push(submissionFile);

	return encryptedAttachments;
};
