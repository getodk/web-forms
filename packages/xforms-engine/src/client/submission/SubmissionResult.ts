import type { DescendantNodeViolationReference } from '../validation.ts';
import type { SubmissionData } from './SubmissionData.ts';
import type { SubmissionDefinition } from './SubmissionDefinition.ts';
import type { SubmissionChunkedType, SubmissionOptions } from './SubmissionOptions.ts';

export type SubmissionResultStatus = 'pending' | 'ready';

// prettier-ignore
type SubmissionResultData<ChunkedType extends SubmissionChunkedType> = {
	chunked: readonly [SubmissionData, ...FormData[]];
	monolithic: SubmissionData;
}[ChunkedType];

interface BaseSubmissionResult<ChunkedType extends SubmissionChunkedType> {
	readonly status: SubmissionResultStatus;
	readonly definition: SubmissionDefinition;
	get violations(): readonly DescendantNodeViolationReference[] | null;

	/**
	 * Submission data may be chunked according to the
	 * {@link SubmissionOptions.maxSize | maxSize submission option}
	 */
	readonly data: SubmissionResultData<ChunkedType>;
}

interface PendingSubmissionResult<ChunkedType extends SubmissionChunkedType>
	extends BaseSubmissionResult<ChunkedType> {
	readonly status: 'pending';
	get violations(): readonly DescendantNodeViolationReference[];
}

interface ReadySubmissionResult<ChunkedType extends SubmissionChunkedType>
	extends BaseSubmissionResult<ChunkedType> {
	readonly status: 'ready';
	get violations(): null;
}

// prettier-ignore
export type SubmissionResult<ChunkedType extends SubmissionChunkedType> =
	| PendingSubmissionResult<ChunkedType>
	| ReadySubmissionResult<ChunkedType>;
