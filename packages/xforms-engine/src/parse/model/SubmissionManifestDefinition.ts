import { ODK_SUBMISSIONS_NAMESPACE_URI, OPENROSA_XFORMS_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import type { SubmissionMeta } from '../../client';
import type { ClientReactiveSerializableInstance } from '../../instance/internal-api/serialization/ClientReactiveSerializableInstance';

// TODO https://github.com/enketo/enketo/blob/ba2bec44acf561f278fd022aa361447674c1d9a8/packages/enketo-express/public/js/src/module/encryptor.js

export class SubmissionManifestDefinition {

	readonly id: string;
	readonly base64EncryptedKey: string;
	readonly attachments: string[];
	readonly formVersion?: string;
	readonly instanceId: string;

	// TODO throw errors when missing essential data, eg: encryption key?
	constructor(instanceRoot: ClientReactiveSerializableInstance, submissionMeta: SubmissionMeta, attachments: readonly File[]) {
		const idAttribute = instanceRoot.root.getAttributes().find(a => a.definition.qualifiedName.localName === 'id');
		this.id = idAttribute?.definition.value ?? '';
		this.base64EncryptedKey = submissionMeta.encryptionKey ?? '';
		this.attachments = attachments.map(a => a.name + '.enc');
		const meta = instanceRoot.root.getChildren().find(kid => kid.definition.qualifiedName.localName === 'meta');
		const instanceID = meta?.getChildren().find(kid => kid.definition.qualifiedName.localName === 'instanceID');
		this.instanceId = instanceID?.getXPathValue() ?? '';
	}

	// TODO trying to be idiomatic, but maybe just turn into functional style?
	serialize(): string {
		const manifest = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'data');
		manifest.setAttribute('encrypted', 'yes');
		manifest.setAttribute('id', this.id);
		if (this.formVersion) {
			manifest.setAttribute('version', this.formVersion);
		}

		const el = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'base64EncryptedKey');
		el.textContent = this.base64EncryptedKey;
		manifest.appendChild(el);

		const el2 = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'encryptedXmlFile');
		el2.textContent = 'submission.xml.enc';
		manifest.appendChild(el2);

		for (const attachment of this.attachments) {
			const mediaEl = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'media');
			const fileEl = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'file');
			fileEl.textContent = attachment;
			mediaEl.appendChild(fileEl);
			manifest.appendChild(mediaEl);
		}

		const el3 = document.createElementNS(ODK_SUBMISSIONS_NAMESPACE_URI, 'base64EncryptedElementSignature');
		el3.textContent = 'something';
		manifest.appendChild(el3);

		const metaEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'meta');
		const instanceIDEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'instanceID');
		instanceIDEl.textContent = this.instanceId;
		metaEl.appendChild(instanceIDEl);
		manifest.appendChild(metaEl);

		return new XMLSerializer().serializeToString(manifest);
	}
}
