import {
	bind,
	body,
	head,
	html,
	input,
	label,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Form submission encryption', () => {
	const DEFAULT_INSTANCE_ID = 'uuid:TODO-mock-xpath-functions';

	// prettier-ignore
	type SubmissionFixtureElements =
		| readonly []
		| readonly [XFormsElement];

	interface BuildSubmissionPayloadScenario {
		readonly submissionElements?: SubmissionFixtureElements;
	}

	const buildSubmissionPayloadScenario = async (
		options?: BuildSubmissionPayloadScenario
	): Promise<Scenario> => {
		const scenario = await Scenario.init(
			'Encrypted',
			html(
				head(
					title('Encrypted'),
					model(
						mainInstance(t('data id="encrypted"', t('inp', 'test'), t('meta', t('instanceID')))),
						...(options?.submissionElements ?? []),
						bind('/data/inp').required(),
						bind('/data/meta/instanceID').calculate(`'${DEFAULT_INSTANCE_ID}'`)
					)
				),
				body(input('/data/rep/inp', label('inp')))
			)
		);

		return scenario;
	};

	it('includes a form-specified `base64RsaPublicKey` as encryptionKey', async () => {
		const base64RsaPublicKey =
			'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwkP+HQEqkyb4HPLOekvn6imYW6Ze2dF2sLCspnzimOnbiF7C1mcd01xiau+9WgU23kM35URhBQVbDHtbQMgZL/Ol+xdA0zdbcUW00Z7EkYmM4sGu4wwJA2eQ6yhBbY2np+kDTvmVHlhP8DDYsXJKqtm+8bXlI36qjVgkVPXjT9YNAA4vRxPReP5wuXHrMGjclPyU6SlFZZm8QLknYV9cmGh1CquKxK7/hIoGIZ3j+edh2GZg8XJo3ZkgAwOwNUqF9b4kXw+tnbpqLXfcETX3fp6iXqLqNMt3E1MXXMnePfDqsa9wrcykUMKfxLXF/EyhIZ+2+iBoyRKeIkExwJRMdQIDAQAB';
		const scenario = await buildSubmissionPayloadScenario({
			submissionElements: [t(`submission base64RsaPublicKey="${base64RsaPublicKey}"`)],
		});
		const submissionResult = await scenario.prepareWebFormsInstancePayload();

		expect(submissionResult.submissionMeta).toMatchObject({
			encryptionKey: base64RsaPublicKey,
		});

		/*
<data xmlns="http://opendatakit.org/submissions" id="mysurvey" encrypted="yes" version="2014083101">
    <base64EncryptedKey>sHXUut13/res3S3uJkwgfhABOc74aXGnCTxTcRTplS9kflomxAzK35zcLc0BJu/Dro7FpPia4qU+f3yb3roJi/EUtRkTaHauAYDEX2OHZ4QThoSmbR0NJRw6kLjfkNS5bFaONWEbRn8eSbT7uyOGyvx5ddL3IKIxzu9vGzJX+cMpKKUQsORaXNEL7lRns7tVen93OSlYhSQak/CbAbkpsSpIW+Q13zrGv3n20YOHaun5yhSyZq6LeaHzPWKQv2POyl+N2j3NGbkz+RIvaVBLvTae4zB0iXlfTkYK9HwOKKDS6MI7z4g4L988WlQurkw5jlN5X9ahNhwZN2yLWTsnCQ==</base64EncryptedKey>
    <encryptedXmlFile>submission.xml.enc</encryptedXmlFile>
    <media>
        <file>myimage.jpg.enc</file>
    </media>
    <media>
        <file>myaudio.mp3.enc</file>
    </media>
    <base64EncryptedElementSignature>OU7rbZl0uFy7xv/HnSl1juVrdf2fQpzcfjwetgl+wseOx5yeD3NjoAg978GGclsy38mECEgTkMS1g8J1I/Xrn9uSQCRyaJXgPyFYPP+y24ka+vCNuNfg6SN1h8MYyUDdg7B7/M9oacMixbAtHo9qcesSBykJWJjFjBS7Nl/GnojRIc5ywLwnzKrdjjxeTjFw7kIG3LCt298WBHuj7azbi/DJYPp26Dbho47LlaRbQpi5Q4Oea71y1h7Wdbl4r7ILyRkTo86fvg6HUfWDLWSorgoFCqi1Af9qP2ziF+LLWQzDu3M8SCHX6uWdCRm/8GPaAyUpMAyfy2e8i7KPbMcVsQ==</base64EncryptedElementSignature>
    <meta xmlns="http://openrosa.org/xforms">
        <instanceID>uuid:5b9cf8d1-106f-4004-844f-c072d76762ed</instanceID>
    </meta>
</data>
*/

		const expected = t(
			`data xmlns="http://opendatakit.org/submissions" id="encrypted" encrypted="yes"`,
			t('base64EncryptedKey', base64RsaPublicKey),
			t('encryptedXmlFile', 'submission.xml.enc'),
			t('base64EncryptedElementSignature', 'something'),
			t('meta xmlns="http://openrosa.org/xforms"', t('instanceID', DEFAULT_INSTANCE_ID))
		).asXml();
		await expect(submissionResult).toHavePreparedSubmissionXML(expected);
		const entries = submissionResult.data[0].entries();
		expect(submissionResult.data.length).to.equal(1);
		expect(entries.next()?.value?.[0]).to.equal('xml_submission_file');
		expect(entries.next()?.value?.[0]).to.equal('submission.xml.enc');
	});

	// TODO encrypts the payload
	// TODO generate a new public/private pair and ensure decryption works
	// TODO encrypts the media attachments
});
