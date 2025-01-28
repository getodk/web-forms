import { describe, expect, it } from 'vitest';
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils';
import { getReactiveForm, globalMountOptions } from '../helpers';
import FormQuestion from '@/components/FormQuestion.vue';
import RankControl from '@/components/controls/RankControl.vue';
import type { RankNode } from '@getodk/xforms-engine';

describe('RankControl', () => {
	const getAllOptions = (rankControl: VueWrapper): string[] => {
		return rankControl.findAll('.rank-label').map((element) => element.text());
	};

	const getRankControl = async () => {
		const xform = await getReactiveForm('1-rank.xml');

		const component = mount(FormQuestion, {
			props: {
				question: xform.currentState.children[0] as RankNode,
			},
			global: globalMountOptions,
		});

		return component.findComponent(RankControl);
	};

	const swapItems = (options: string[], indexA: number, indexB: number) => {
		const temp = options[indexA];
		options[indexA] = options[indexB];
		options[indexB] = temp;
	};

	const moveOptionUp = async (rankControl: VueWrapper, optionIndex: number) => {
		const buttonMoveUp: DOMWrapper<HTMLElement> = rankControl.find(
			`.rank-option:nth-child(${optionIndex}) button:first-child`
		);
		expect(buttonMoveUp.exists()).toBe(true);
		await buttonMoveUp.trigger('click');
	};

	const moveOptionDown = async (rankControl: VueWrapper, optionIndex: number) => {
		const buttonMoveUp: DOMWrapper<HTMLElement> = rankControl.find(
			`.rank-option:nth-child(${optionIndex}) button:nth-child(2)`
		);
		expect(buttonMoveUp.exists()).toBe(true);
		await buttonMoveUp.trigger('click');
	};

	it('should render all options', async () => {
		const expectedOptions = [
			'Career Growth and Learning Opportunities',
			'Building a Supportive Community',
			'Financial Stability',
			'Pursuit of Hobbies and Passions',
			'Health',
			'Family and Friends',
			'Personal Development and Mindfulness',
			'Environmental Sustainability',
			'Creativity and Innovation',
			'Time Management and Work-Life Balance',
		];

		const rankControl = (await getRankControl()) as VueWrapper;
		expect(rankControl.exists()).toBe(true);

		const allOptions = getAllOptions(rankControl);
		expect(allOptions.length).toEqual(10);

		const allOptionsExist = expectedOptions.every((option) => allOptions.includes(option));
		expect(allOptionsExist).toBe(true);
	});

	it('should rank options using buttons', async () => {
		const rankControl = (await getRankControl()) as VueWrapper;
		expect(rankControl.exists()).toBe(true);

		const expectedOptions = getAllOptions(rankControl);
		swapItems(expectedOptions, 4, 3);
		swapItems(expectedOptions, 6, 7);

		await moveOptionUp(rankControl, 5);
		await moveOptionDown(rankControl, 7);

		const allRankedOptions = getAllOptions(rankControl);
		const sameOrder = expectedOptions.every((value, index) => value === allRankedOptions[index]);
		expect(sameOrder).toBe(true);
	});

	it('should not move options if they are the first or last one', async () => {
		const rankControl = (await getRankControl()) as VueWrapper;
		expect(rankControl.exists()).toBe(true);

		const expectedOptions = getAllOptions(rankControl);
		swapItems(expectedOptions, 3, 2);

		await moveOptionUp(rankControl, 1);
		await moveOptionUp(rankControl, 4);
		await moveOptionDown(rankControl, 10);

		const allRankedOptions = getAllOptions(rankControl);
		const sameOrder = expectedOptions.every((value, index) => value === allRankedOptions[index]);
		expect(sameOrder).toBe(true);
	});
});
