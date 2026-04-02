import {
	ODK_SUBMISSIONS_NAMESPACE_URI,
	OPENROSA_XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import type { ClientReactiveSerializableInstance } from '../../instance/internal-api/serialization/ClientReactiveSerializableInstance';
import type { Root } from '../../instance/Root';
import {
	ENCRYPTED_SUBMISSION_ATTACHMENT_NAME,
	ENCRYPTED_SUFFIX,
} from '../../lib/client-reactivity/instance-state/quarantine/encryption';

const getAttribute = (root: Root, name: string) => {
	const attribute = root.getAttributes().find((a) => a.definition.qualifiedName.localName === name);
	return attribute?.definition.value;
};

const getInstanceID = (root: Root) => {
	const meta = root.getChildren().find((c) => c.definition.qualifiedName.localName === 'meta');
	const instanceID = meta
		?.getChildren()
		.find((c) => c.definition.qualifiedName.localName === 'instanceID');
	return instanceID?.getXPathValue();
};

export class SubmissionManifestDefinition {
	readonly formId: string;
	readonly base64EncryptedKey: string;
	readonly attachments: string[];
	readonly formVersion: string | undefined;
	readonly instanceId: string;
	// signature: string | undefined;

	constructor(
		instanceRoot: ClientReactiveSerializableInstance,
		base64EncryptedSymmetricKey: string,
		attachments: readonly File[]
	) {
		const root = instanceRoot.root;
		const formId = getAttribute(root, 'id');
		if (!formId) {
			throw new Error('Encrypted submissions are required to have a form ID');
		}
		this.formId = formId;
		const instanceId = getInstanceID(root);
		if (!instanceId) {
			throw new Error('Encrypted submissions are required to have an instance ID');
		}
		this.instanceId = instanceId;
		this.formVersion = getAttribute(root, 'version');
		this.attachments = attachments.map((attachment) => attachment.name + ENCRYPTED_SUFFIX);
		this.base64EncryptedKey = base64EncryptedSymmetricKey;
	}

	// TODO trying to be idiomatic, but maybe just turn into functional style?
	serialize(): string {
		const manifest = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'data');
		manifest.setAttribute('encrypted', 'yes');
		manifest.setAttribute('id', this.formId);
		if (this.formVersion) {
			manifest.setAttribute('version', this.formVersion);
		}

		const el = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'base64EncryptedKey');
		el.textContent = this.base64EncryptedKey;
		manifest.appendChild(el);

		const el2 = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'encryptedXmlFile');
		el2.textContent = ENCRYPTED_SUBMISSION_ATTACHMENT_NAME;
		manifest.appendChild(el2);

		for (const attachment of this.attachments) {
			const mediaEl = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'media');
			const fileEl = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'file');
			fileEl.textContent = attachment;
			mediaEl.appendChild(fileEl);
			manifest.appendChild(mediaEl);
		}

		// TODO remove this if it's not implemented
		// if (this.signature) {
		// 	const el3 = document.createElementNS(
		// 		ODK_SUBMISSIONS_NAMESPACE_URI,
		// 		'base64EncryptedElementSignature'
		// 	);
		// 	el3.textContent = this.signature;
		// 	manifest.appendChild(el3);
		// }

		const metaEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'meta');
		const instanceIDEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'instanceID');
		instanceIDEl.textContent = this.instanceId;
		metaEl.appendChild(instanceIDEl);
		manifest.appendChild(metaEl);

		return new XMLSerializer().serializeToString(manifest);
	}
}
