import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { bestFitDecreasing } from 'bin-packer';
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
	return crypto.getRandomValues(new Uint8Array(32))
};


async function encryptContent(content, symmetricKey) {

  const key = await crypto.subtle.generateKey(
    {
      name: SYMMETRIC_ALGORITHM,
      length: 256, // Can be 128, 192, or 256
    },
    true, // extractable (can be exported)
    ["encrypt", "decrypt"] // key usages
  );

	// TODO seed this
	const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits is standard for AES-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: SYMMETRIC_ALGORITHM,
      iv: iv,
    },
    key,
    content
  );
	return ciphertextBuffer;
	/*
    const cipher = forge.cipher.createCipher(SYMMETRIC_ALGORITHM, symmetricKey);
    const iv = seed.getIncrementedSeedByteString();

    cipher.mode.pad = forge.cipher.modes.cbc.prototype.pad.bind(cipher.mode);
    cipher.start({
        iv,
    });

    cipher.update(content);
    const pass = cipher.finish();
    const byteString = cipher.output.getBytes();

    if (!pass) {
        throw new Error('Encryption failed.');
    }

    // Write the bytes of the string to an ArrayBuffer
    const buffer = new ArrayBuffer(byteString.length);
    const array = new Uint8Array(buffer);

    for (let i = 0; i < byteString.length; i++) {
        array[i] = byteString.charCodeAt(i);
    }

    // Write the ArrayBuffer to a blob
    return new Blob([array]);
		*/
}

// prior art
// https://github.com/enketo/enketo/blob/2aab5ce716effe038fcc66041e4f16dbb908f26d/packages/enketo-express/public/js/src/module/encryptor.js#L99
// https://github.com/getodk/collect/blob/master/collect_app/src/main/java/org/odk/collect/android/utilities/EncryptionUtils.java

const encrypt = async (encryptionKey: string, data: string) => {
	// const array = new Uint32Array(32);
	// crypto.getRandomValues(array);
	// crypto.subtle.encrypt({
  //     name: "RSA-OAEP",
  //   }, encryptionKey, data);

	try {
		// const pem = `-----BEGIN PUBLIC KEY-----${encryptionKey}-----END PUBLIC KEY-----`;
    // const algorithm = { name: "RSA-OAEP" };
    /*const symmetricKey = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"] // TODO encrypt only?
		);*/
		// const buff  = new TextEncoder().encode(encryptionKey);
		// const buff = new TextEncoder().encode(atob(encryptionKey));

		// const buff = pemToArrayBuffer(encryptionKey);

		const binaryDer = atob(encryptionKey);
		const buff = new Uint8Array(binaryDer.length);
		for (let i = 0; i < binaryDer.length; i++) {
			buff[i] = binaryDer.charCodeAt(i);
		}
		const encodedMessage = new TextEncoder().encode(data);

	const publicKey = await crypto.subtle.importKey(
    "spki",             // The format of the key to be imported (SubjectPublicKeyInfo)
    buff,               // The public key data
    {
      name: ASYMMETRIC_ALGORITHM, // The algorithm the imported key will be used with
      hash: "SHA-256",  // The hash function to be used with the algorithm
    },
    true,               // Whether the key is extractable
    ["encrypt"]         // The intended use for the key (encryption in this case)
  );
		
		// const key = await crypto.subtle.importKey(
		// 	'pkcs8',
		// 	Buffer.from(pem),
		// 	algorithm,
		// 	false,
		// 	['encrypt', 'decrypt']
		// );
		
		const symmetricKey = generateSymmetricKey();
		
		const base64EncryptedSymmetricKey = await crypto.subtle.encrypt(
			{
				name: ASYMMETRIC_ALGORITHM,
			},
			publicKey,
			symmetricKey
		);

    const submissionXmlEnc = await encryptContent(
        encodedMessage,
        symmetricKey,
    );


    // const encrypted = publicKey.encrypt(
    //     symmetricKey,
    //     ASYMMETRIC_ALGORITHM,
    //     ASYMMETRIC_OPTIONS
    // );

    // const base64EncryptedSymmetricKey = forge.util.encode64(encrypted);

    // const base64EncryptedSymmetricKey = _rsaEncrypt(
    //     symmetricKey,
    //     publicKey
    // );

    // const keyPair = await crypto.subtle.generateKey(
    //   {
    //     name: "RSA-OAEP",
    //     modulusLength: 2048,
    //     publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    //     hash: "SHA-256"
    //   },
    //   true,
    //   ["encrypt", "decrypt"]
    // );
    // const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate 12-byte IV
    // // Encrypt the message using AES-GCM
    // const encryptedMessage = await crypto.subtle.encrypt(
    //   { name: "AES-GCM", iv },
    //   symmetricKey.publicKey,
    //   encodedMessage
    // );
    // // Export and encrypt the symmetric key
    // const symmetricKeyBytes = await crypto.subtle.exportKey("raw", symmetricKey.publicKey);
    // const encryptedSymmetricKey = await crypto.subtle.encrypt(
    //   { name: "RSA-OAEP" },
    //   key,
    //   symmetricKeyBytes
    // );

		console.log({ base64EncryptedSymmetricKey, symmetricKey, submissionXmlEnc });
	} catch(e) {
		console.log(e);
	}
}

const collectInstanceFiles = async (instanceRoot: ClientReactiveSerializableInstance, submissionMeta: SubmissionMeta) => {

	if (submissionMeta.encryptionKey) {
		await encrypt(submissionMeta.encryptionKey, instanceRoot.instanceState.instanceXML);
		const payload = new File([instanceRoot.instanceState.instanceXML], 'submission.xml.enc');
		const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments);
		const manifest = new SubmissionManifestDefinition(instanceRoot, submissionMeta, attachments);
		const instanceFile = new InstanceFile(manifest.serialize());
		// TODO need to encrypt payload and all the attachments
		return { instanceFile, attachments: [ payload, ...attachments ] };
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

	console.log('head', head);
	console.log('tail', tail);
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
