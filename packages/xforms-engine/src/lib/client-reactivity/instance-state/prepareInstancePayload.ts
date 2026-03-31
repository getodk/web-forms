import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { bestFitDecreasing } from 'bin-packer';
import * as CryptoJS from 'crypto-js';
import { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } from '../../../client/constants.ts';
import type { InstanceData as ClientInstanceData } from '../../../client/serialization/InstanceData.ts';
import type { InstanceFile as ClientInstanceFile } from '../../../client/serialization/InstanceFile.ts';
import type {
	ChunkedInstancePayload,
	InstancePayload,
	MonolithicInstancePayload,
} from '../../../client/serialization/InstancePayload.ts';
import type { InstancePayloadType } from '../../../client/serialization/InstancePayloadOptions.ts';
import type { SubmissionMeta } from '../../../client/submission/SubmissionMeta.ts';
import type { DescendantNodeViolationReference } from '../../../client/validation.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentsState } from '../../../instance/attachments/InstanceAttachmentsState.ts';
import type { ClientReactiveSerializableInstance } from '../../../instance/internal-api/serialization/ClientReactiveSerializableInstance.ts';
import { SubmissionManifestDefinition } from '../../../parse/model/SubmissionManifestDefinition.ts';
const SYMMETRIC_ALGORITHM = 'AES-CFB'; // JAVA: "AES/CFB/PKCS5Padding"
const ASYMMETRIC_ALGORITHM = 'RSA-OAEP'; // JAVA: "RSA/NONE/OAEPWithSHA256AndMGF1Padding"

const collectInstanceAttachmentFiles = (attachments: InstanceAttachmentsState): readonly File[] => {
	const files = Array.from(attachments.entries()).map(([context, attachment]) => {
		if (!context.isAttached() || !context.isRelevant()) {
			return null;
		}

		return attachment.getValue();
	});

	return files.filter((file) => file != null);
};

class InstanceFile extends File implements ClientInstanceFile {
	override readonly name = INSTANCE_FILE_NAME;
	override readonly type = INSTANCE_FILE_TYPE;

	constructor(instanceXML: string) {
		super([instanceXML], INSTANCE_FILE_NAME, {
			type: INSTANCE_FILE_TYPE,
		});
	}

}

const generateSymmetricKey = () => {
	return 'tÎ,2Z\x02¢à\x95\x16!íÒ|\x07ð«\x91yHRz1\x13µZï\x95³Iµ»';
	// return crypto.getRandomValues(new Uint8Array(32)).toString();
};

async function encryptContent(content:string, symmetricKey:string, seed:any): Promise<Uint8Array<ArrayBuffer>> {
	console.log('encrypted 7');
	const ivString = seed.getIncrementedSeedByteString();
	console.log('iv', ivString);
	const key = CryptoJS.enc.Latin1.parse(symmetricKey);
	const iv = CryptoJS.enc.Latin1.parse(ivString);

	const encrypted = CryptoJS.AES.encrypt(content, key, {
		iv: iv,
		mode: CryptoJS.mode.CFB,
		padding: CryptoJS.pad.Pkcs7
	});

	const uint8Array = fromWordArray(encrypted.ciphertext);
	return uint8Array;
}

/*
async function encryptContent(content:string, symmetricKey:Uint8Array<ArrayBuffer>, seed:any) {
	// TODO generate a seed 
	// const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits is standard for AES-GCM
	// const iv2 = enc.Hex.parse(iv.toString());
	const iv = enc.Hex.parse(seed.getIncrementedSeedByteString());
	// const key = enc.Utf8.parse(symmetricKey.toString());
	const key = enc.Utf8.parse(symmetricKey.toString()); // or hex?
	console.log({key, iv});
	const encrypted = AES.encrypt(content, key, {
    iv: iv,
    mode: mode.CFB, // test CBC in case it's magically handled by central and then we can use native crypto
    padding: pad.Pkcs7
	});
	console.log('encrypted 4');
  const encryptedBase64 = enc.Base64.stringify(encrypted.ciphertext);
	return encryptedBase64;

	// encrypted.ciphertext
	// return encrypted.toString();

}
*/
// prior art
// https://github.com/enketo/enketo/blob/2aab5ce716effe038fcc66041e4f16dbb908f26d/packages/enketo-express/public/js/src/module/encryptor.js#L99
// https://github.com/getodk/collect/blob/master/collect_app/src/main/java/org/odk/collect/android/utilities/EncryptionUtils.java

const encrypt = async (symmetricKey:string, data: string, seed:any) => {


	try {
    const submissionXmlEnc = await encryptContent(
			data,
			symmetricKey,
			seed
    );


		console.log({ symmetricKey, submissionXmlEnc });
		return submissionXmlEnc;
	} catch(e) {
		console.log(e);
		throw e;
	}
}

// Equivalent to "RSA/NONE/OAEPWithSHA256AndMGF1Padding"
const rsaEncrypt = async (symmetricKey:string, publicKey:CryptoKey) => {
	var enc = new TextEncoder();
	const encrypted = await crypto.subtle.encrypt(
		{
			name: ASYMMETRIC_ALGORITHM,
		},
		publicKey,
		enc.encode(symmetricKey)
	);
	return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
	// const decoder = new TextDecoder('utf-8');
	// return decoder.decode(encrypted);
}

const generatePublicKey = async (encryptionKey: string) => {
	const binaryDer = atob(encryptionKey);
	const buff = new Uint8Array(binaryDer.length);
	for (let i = 0; i < binaryDer.length; i++) {
		buff[i] = binaryDer.charCodeAt(i);
	}
	return await crypto.subtle.importKey(
		"spki",             // The format of the key to be imported (SubjectPublicKeyInfo)
		buff,               // The public key data
		{
			name: ASYMMETRIC_ALGORITHM, // The algorithm the imported key will be used with
			hash: "SHA-256",  // The hash function to be used with the algorithm
		},
		true,               // Whether the key is extractable
		["encrypt"]         // The intended use for the key (encryption in this case)
	);
};

function fromWordArray(wordArray: CryptoJS.lib.WordArray) {
  var bytes = new Uint8Array(wordArray.sigBytes);
  for (var j = 0; j < wordArray.sigBytes; j++) {
    bytes[j] = (wordArray.words[j >>> 2]! >>> (24 - (8 * (j % 4)))) & 0xFF;
  }
  return bytes;
}

// TODO type the seed!
function createSeed(instanceId:string, symmetricKey: string) {
	// iv is the 16-byte md5 hash of the instanceID and the symmetric key
  const md = CryptoJS.algo.MD5.create();
  md.update(instanceId)
  md.update(CryptoJS.enc.Latin1.parse(symmetricKey));
  const ivSeedArray = fromWordArray(md.finalize());
	let ivCounter = 0;

	return {
		 getIncrementedSeedByteString: () => {
			++ivSeedArray[ivCounter % ivSeedArray.length]!;
			++ivCounter;

			return String.fromCharCode(...new Uint8Array(ivSeedArray));
		}
	};
}

const collectInstanceFiles = async (instanceRoot: ClientReactiveSerializableInstance, submissionMeta: SubmissionMeta) => {

	if (submissionMeta.encryptionKey) {
		// TODO move all encryption code into a separate file with warnings all over it
		try {
			const symmetricKey = generateSymmetricKey();

			// TODO share this with SubmissionManifestDefinition
			// const idAttribute = instanceRoot.root.getAttributes().find(a => a.definition.qualifiedName.localName === 'id');
			// const instanceId = 'def';
			// const instanceId = idAttribute?.definition.value ?? '';
			 
			const publicKey = await generatePublicKey(submissionMeta.encryptionKey);
			const base64EncryptedSymmetricKey = await rsaEncrypt(symmetricKey, publicKey);
			const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);
			const manifest = new SubmissionManifestDefinition(instanceRoot, base64EncryptedSymmetricKey, attachments);
			const instanceId = manifest.instanceId;
			const seed = createSeed(instanceId, symmetricKey);
			const data = instanceRoot.instanceState.instanceXML;
			const encrypted:Uint8Array<ArrayBuffer> = await encrypt(symmetricKey, data, seed);
			const payload = new File([encrypted], 'submission.xml.enc', { type: 'application/octet-stream' });
			const instanceFile = new InstanceFile(manifest.serialize());

			console.log({instanceId, symmetricKey});

			// TODO need to encrypt payload and all the attachments
			return { instanceFile, attachments: [ payload, ...attachments ] };
		} catch(e) {
			console.log(e);
			throw e;
		}

	} else {
		const instanceFile = new InstanceFile(instanceRoot.instanceState.instanceXML);
		const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);
		return { instanceFile, attachments };
	}

}

type AssertFile = (value: FormDataEntryValue) => asserts value is File;

const assertFile: AssertFile = (value) => {
	if (!(value instanceof File)) {
		throw new ErrorProductionDesignPendingError('Expected an instance of File');
	}
};

type AssertInstanceData = (data: FormData) => asserts data is ClientInstanceData;

const assertInstanceData: AssertInstanceData = (data) => {
	let instanceFile: File | null = null;

	for (const [key, value] of data.entries()) {
		assertFile(value);

		if (key === INSTANCE_FILE_NAME) {
			instanceFile = value;
		}
	}

	if (!(instanceFile instanceof InstanceFile)) {
		throw new Error(`Invalid InstanceData`);
	}
};

class InstanceData extends FormData {
	static from(instanceFile: InstanceFile, attachments: readonly File[]): ClientInstanceData {
		const data = new this(instanceFile, attachments);

		assertInstanceData(data);

		return data;
	}

	private constructor(
		readonly instanceFile: InstanceFile,
		readonly attachments: readonly File[]
	) {
		super();

		this.set(INSTANCE_FILE_NAME, instanceFile);

		attachments.forEach((attachment) => {
			const { name } = attachment;

			console.log('attachment', name);

			if (name === INSTANCE_FILE_NAME && attachment !== instanceFile) {
				throw new Error(`Failed to add conflicting attachment with name ${INSTANCE_FILE_NAME}`);
			}

			this.set(name, attachment);
		});
	}
}

interface PendingValidation {
	readonly status: 'pending';
	readonly violations: readonly DescendantNodeViolationReference[];
}

interface ReadyValidation {
	readonly status: 'ready';
	readonly violations: null;
}

type InstanceStateValidation = PendingValidation | ReadyValidation;

const validateInstance = (
	instanceRoot: ClientReactiveSerializableInstance
): InstanceStateValidation => {
	const { violations } = instanceRoot.validationState;

	if (violations.length === 0) {
		return {
			status: 'ready',
			violations: null,
		};
	}

	return {
		status: 'pending',
		violations,
	};
};

const monolithicInstancePayload = (
	validation: InstanceStateValidation,
	submissionMeta: SubmissionMeta,
	instanceFile: InstanceFile,
	attachments: readonly File[]
): MonolithicInstancePayload => {
	const data = InstanceData.from(instanceFile, attachments);

	return {
		payloadType: 'monolithic',
		...validation,
		submissionMeta,
		data: [data],
	};
};

interface ChunkedInstancePayloadOptions {
	readonly maxSize: number;
}

type PartitionedInstanceData = readonly [ClientInstanceData, ...ClientInstanceData[]];

const partitionInstanceData = (
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): PartitionedInstanceData => {
	const { maxSize } = options;
	const maxAttachmentSize = maxSize - instanceFile.size;
	const { bins, oversized } = bestFitDecreasing(
		attachments,
		(attachment) => {
			return attachment.size;
		},
		maxAttachmentSize
	);

	const errors = oversized.map((attachment) => {
		return new Error(
			`Combined size of instance XML (${instanceFile.size}) and attachment (${attachment.size}) exceeds maxSize (${maxSize}).`
		);
	});

	if (errors.length > 0) {
		throw new AggregateError(errors, 'Failed to produce chunked instance payload');
	}

	const [
		// Ensure at least one `InstanceData` is produced, in case there are no
		// attachments present at all
		head = InstanceData.from(instanceFile, []),
		...tail
	] = bins.map((bin) => InstanceData.from(instanceFile, bin));

	return [head, ...tail];
};

const chunkedInstancePayload = (
	validation: InstanceStateValidation,
	submissionMeta: SubmissionMeta,
	instanceFile: InstanceFile,
	attachments: readonly File[],
	options: ChunkedInstancePayloadOptions
): ChunkedInstancePayload => {
	const data = partitionInstanceData(instanceFile, attachments, options);

	return {
		payloadType: 'chunked',
		...validation,
		submissionMeta,
		data,
	};
};

export interface PrepareInstancePayloadOptions<PayloadType extends InstancePayloadType> {
	readonly payloadType: PayloadType;
	readonly maxSize: number;
}

export const prepareInstancePayload = async <PayloadType extends InstancePayloadType> (
	instanceRoot: ClientReactiveSerializableInstance,
	options: PrepareInstancePayloadOptions<PayloadType>
): Promise<InstancePayload<PayloadType>> => {
	instanceRoot.root.parent.model.triggerXformsRevalidateListeners();
	const validation = validateInstance(instanceRoot);
	const submissionMeta = instanceRoot.definition.submission;

	const { instanceFile, attachments } = await collectInstanceFiles(instanceRoot, submissionMeta);

	switch (options.payloadType) {
		case 'chunked':
			return chunkedInstancePayload(
				validation,
				submissionMeta,
				instanceFile,
				attachments,
				options
			) satisfies ChunkedInstancePayload as InstancePayload<PayloadType>;

		case 'monolithic':
			return monolithicInstancePayload(
				validation,
				submissionMeta,
				instanceFile,
				attachments
			) satisfies MonolithicInstancePayload as InstancePayload<PayloadType>;

		default:
			throw new UnreachableError(options.payloadType);
	}
};
