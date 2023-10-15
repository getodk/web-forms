import { beforeEach, describe, it } from 'vitest';
import type { TestContext } from './helpers.ts';
import { createTextContentTestContext } from './helpers.ts';

describe('basic xpath', () => {
	let testContext: TestContext;

	beforeEach(() => {
		testContext = createTextContentTestContext('1');
	});

	describe('comparing node values', () => {
		describe('to integer values', () => {
			it('should support equality operator', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node = 1', true);
			});

			it('should support inequality operator', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node != 1', false);
			});

			it('should support comparators', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node < 1', false);
				testContext.assertBooleanValue('/simple/xpath/to/node > 1', false);
				testContext.assertBooleanValue('/simple/xpath/to/node <= 1', true);
				testContext.assertBooleanValue('/simple/xpath/to/node >= 1', true);
			});
		});

		describe('to string values', () => {
			it('should support equality operator', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node = "1"', true);
			});

			it('should support inequality operator', () => {
				testContext.assertBooleanValue('/simple/xpath/to/node != "1"', false);
			});
		});
	});
});
