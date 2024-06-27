interface FullWidthBinding {
	value: boolean | undefined;
}

const checkWidth = (el: HTMLElement, binding: FullWidthBinding) => {
	if (binding.value === false) return;

	const items: Element[] = Array.from(el.children);

	if (items.find((item) => item.scrollWidth * 2 > el.parentElement!.offsetWidth)) {
		el.classList.add('full-width');
	} else {
		el.classList.remove('full-width');
	}
};

const FullWidth = {
	mounted: checkWidth,
	updated: checkWidth,
};

export { FullWidth };
