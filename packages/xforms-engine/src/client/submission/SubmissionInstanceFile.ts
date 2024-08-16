export type SubmissionInstanceFileName = 'xml_submission_file';

export type SubmissionInstanceFileType = 'text/xml';

export interface SubmissionInstanceFile extends File {
	readonly name: SubmissionInstanceFileName;
	readonly type: SubmissionInstanceFileType;
}
