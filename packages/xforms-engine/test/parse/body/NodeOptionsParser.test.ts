import { assert, describe, expect, it } from 'vitest';
import { parseToFloat, parseToInteger } from '../../../src/parse/body/NodeOptionsParser.ts';

describe('NodeOptionsParser', () => {
	interface SuccessTestCase {
		readonly input: string | null;
		readonly expected: number;
	}

	interface ErrorTestCase {
		readonly input: number | string | null | undefined | boolean;
		readonly expected: Error;
	}

	describe('parseToInteger', () => {
		it.each<SuccessTestCase>([
			{ input: '0', expected: 0 },
			{ input: '5999', expected: 5999 },
			{ input: '-99', expected: -99 },
		])('should parse integer strings', ({ input, expected }) => {
			try {
				expect(parseToInteger(input)).toEqual(expected);
			} catch {
				assert.fail('Should not have thrown an error');
			}
		});

		it.each<ErrorTestCase>([
			{ input: '3.14159', expected: new Error('Expected an integer, but got: 3.14159') },
			{ input: 'abc', expected: new Error('Expected an integer, but got: abc') },
			{ input: '', expected: new Error('Expected a non-empty string, but got: ') },
			{ input: NaN, expected: new Error('Expected a non-empty string, but got: NaN') },
			{ input: null, expected: new Error('Expected a non-empty string, but got: null') },
			{ input: false, expected: new Error('Expected a non-empty string, but got: false') },
			{ input: true, expected: new Error('Expected a non-empty string, but got: true') },
			{ input: undefined, expected: new Error('Expected a non-empty string, but got: undefined') },
		])('should throw error for non-integer numbers', ({ input, expected }) => {
			try {
				// @ts-expect-error Ignoring TS2345: Testing invalid input
				parseToInteger(input);
				assert.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toEqual(expected);
			}
		});
	});

	describe('parseToFloat', () => {
		it.each<SuccessTestCase>([
			{ input: '3.14159', expected: 3.14159 },
			{ input: '0', expected: 0 },
			{ input: '5999', expected: 5999 },
			{ input: '-99', expected: -99 },
		])('should parse float and integers strings', ({ input, expected }) => {
			try {
				expect(parseToFloat(input)).toEqual(expected);
			} catch {
				assert.fail(`Should not have thrown an error`);
			}
		});

		it.each<ErrorTestCase>([
			{ input: 'abc', expected: new Error('Expected a float, but got: abc') },
			{ input: '', expected: new Error('Expected a non-empty string, but got: ') },
			{ input: NaN, expected: new Error('Expected a non-empty string, but got: NaN') },
			{ input: null, expected: new Error('Expected a non-empty string, but got: null') },
			{ input: false, expected: new Error('Expected a non-empty string, but got: false') },
			{ input: true, expected: new Error('Expected a non-empty string, but got: true') },
			{ input: undefined, expected: new Error('Expected a non-empty string, but got: undefined') },
		])('should throw error for non-float or non-integer numbers', ({ input, expected }) => {
			try {
				// @ts-expect-error Ignoring TS2345: Testing invalid input
				parseToFloat(input);
				assert.fail('Should have thrown an error');
			} catch (error) {
				expect(error).toEqual(expected);
			}
		});
	});
});
