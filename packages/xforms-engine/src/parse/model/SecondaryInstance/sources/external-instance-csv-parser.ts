import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';
import * as papa from 'papaparse';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError';

type CSVColumn = string;
type CSVRow = readonly CSVColumn[];
type AssertCSVRow = (columns: unknown) => asserts columns is CSVRow;

interface ParsedCSVHeader {
	readonly columns: CSVRow;
	readonly errors: readonly [];
	readonly meta: papa.ParseMeta;
}

interface ParseCSVOptions {
	readonly columns: readonly string[];
	readonly delimiter: string;
}

interface ParsedCSVRows {
	readonly rows: readonly CSVRow[];
	readonly errors: readonly [];
	readonly meta: papa.ParseMeta;
}

interface CSVExternalSecondaryInstanceItemColumn {
	readonly columnName: string;
	readonly cellValue: string;
}

type CSVExternalSecondaryInstanceItem = readonly CSVExternalSecondaryInstanceItemColumn[];

/**
 * Based on {@link https://github.com/getodk/central-frontend/commit/29cebcc870c9be70ab0d222e3349e34639045d19}
 *
 * Central performs this check for header and rows. A comment is included there for the header check, but the logic is the same in both cases.
 */
const rejectNullCharacters = (cell: string) => {
	if (cell.includes('\0')) {
		throw new ErrorProductionDesignPendingError(`Failed to parse CSV: null character`);
	}
};

const stripTrailingEmptyCells = (columns: CSVRow, row: CSVRow): CSVRow => {
	const result = row.slice();

	while (result.length > columns.length && result.at(-1) === '') {
		result.pop();
	}

	return result;
};

const assertCSVRow: AssertCSVRow = (columns) => {
	if (!Array.isArray(columns)) {
		throw new ErrorProductionDesignPendingError('Failed to parse CSV columns');
	}

	for (const [index, column] of columns.entries()) {
		if (typeof column !== 'string') {
			throw new ErrorProductionDesignPendingError(`Failed to parse CSV column at index ${index}`);
		}

		rejectNullCharacters(column);
	}
};

type AssertPapaparseSuccess = (
	resourceURL: JRResourceURL,
	errors: readonly papa.ParseError[]
) => asserts errors is readonly [];

const assertPapaparseSuccess: AssertPapaparseSuccess = (resourceURL, errors) => {
	if (errors.length > 0) {
		const cause = new AggregateError(errors);
		throw new ErrorProductionDesignPendingError(
			`Failed to parse CSV external secondary instance ${resourceURL.href}`,
			{ cause }
		);
	}
};

/**
 * Largely based on {@link https://github.com/getodk/central-frontend/blob/42c9277709e593480d1462e28b4be5f1364532b7/src/util/csv.js#L170}
 */
const parseCSVRows = (
	resourceURL: JRResourceURL,
	csvData: string,
	options: ParseCSVOptions
): ParsedCSVRows => {
	const { columns, delimiter } = options;
	const { data, errors, meta } = papa.parse(csvData, {
		delimiter,
		download: false,
	});

	assertPapaparseSuccess(resourceURL, errors);

	const rowData = data.slice(1);
	const lastRowIndex = rowData.length - 1;

	let stripLastRow = false;

	const rows = rowData.map((values, index) => {
		assertCSVRow(values);

		const rowIndex = index + 1;

		// Central: Remove trailing empty cells.
		const row = stripTrailingEmptyCells(columns, values);

		// Central: Skip trailing empty rows and do not check them for warnings.
		// Throw for an empty row that is not trailing.
		if (row.every((cell) => cell === '')) {
			if (index === lastRowIndex) {
				stripLastRow = true;
			} else {
				throw new ErrorProductionDesignPendingError(
					`Failed to parse CSV row ${rowIndex}: unexpected empty row`
				);
			}
		}

		// Central: Throw if there are too many cells.
		if (row.length > columns.length) {
			throw new ErrorProductionDesignPendingError(
				`Failed to parse CSV row ${rowIndex}: expected ${columns.length} columns, got ${row.length}`
			);
		}

		return row;
	});

	if (stripLastRow) {
		rows.pop();
	}

	return {
		errors,
		meta,
		rows,
	};
};

const toItems = (
	columns: CSVRow,
	rows: readonly CSVRow[]
): readonly CSVExternalSecondaryInstanceItem[] => {
	return rows.map((row) => {
		return columns.map((columnName, index) => {
			return {
				columnName,
				cellValue: row[index] ?? '',
			};
		});
	});
};

/**
 * Based on
 * {@link https://github.com/getodk/central-frontend/blob/42c9277709e593480d1462e28b4be5f1364532b7/src/util/csv.js#L79} (and {@link https://github.com/getodk/central-frontend/blob/42c9277709e593480d1462e28b4be5f1364532b7/src/util/csv.js#L13}).
 *
 * The most significant deviations at time of writing:
 *
 * - we have already retrieved the CSV resource, so we are parsing the raw CSV data directly.
 * - we have no need for asynchronous/streaming parsing at this point in the
 *   form initialization process, so we can dispense with those details of the
 *   {@link papa | papaparse} API/config.
 */
const parseCSVHeader = (resourceURL: JRResourceURL, csvData: string): ParsedCSVHeader => {
	const { data, errors, meta } = papa.parse(csvData, {
		delimitersToGuess: [',', ';', '\t', '|'],
		download: false,
		preview: 1,
	});
	const [columns = []] = data;

	assertCSVRow(columns);
	assertPapaparseSuccess(resourceURL, errors);

	return {
		errors,
		meta,
		columns,
	};
};

export const parseItems = (
	resourceURL: JRResourceURL,
	data: string
): readonly CSVExternalSecondaryInstanceItem[] => {
	const csvData = data.replace(/[\n\r]+$/, '');
	const { columns, meta } = parseCSVHeader(resourceURL, csvData);
	const { rows } = parseCSVRows(resourceURL, csvData, {
		columns,
		delimiter: meta.delimiter,
	});
	return toItems(columns, rows);
};
