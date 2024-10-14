const MAX_INT_32 = 2_147_483_647;
const SEED_MODULO_OPERAND = MAX_INT_32;
const MIN_STD = 16_807;

interface PseudoRandomNumberGenerator {
	random(): number;
}

type Int = number;

class UnseededPseudoRandomNumberGenerator implements PseudoRandomNumberGenerator {
	random() {
		return Math.random();
	}
}

class SeededPseudoRandomNumberGenerator implements PseudoRandomNumberGenerator {
	// Park-Miller PRNG
	protected seed: number;

	constructor(seed: Int) {
		let initialSeed = seed % SEED_MODULO_OPERAND;

		if (initialSeed <= 0) {
			initialSeed += MAX_INT_32 - 1;
		}

		this.seed = initialSeed;
	}

	random() {
		const { seed: previousSeed } = this;
		const seed = (previousSeed * MIN_STD) % SEED_MODULO_OPERAND;
		const result = (seed - 1) / (MAX_INT_32 - 1);

		this.seed = seed;

		return result;
	}
}

export const seededRandomize = <T>(values: readonly T[], seed?: number): T[] => {
	let generator: PseudoRandomNumberGenerator;

	if (seed == null) {
		generator = new UnseededPseudoRandomNumberGenerator();
	} else {
		let finalSeed: number;
		// Per issue #49 this is (to an extent) "bug-or-feature-compatible" with JavaRosa's implementation.
		// org.javarosa.core.model.ItemsetBinding.resolveRandomSeed takes the .longValue() of
		// the double produced by randomSeedPathExpr.eval().
		// That results in a 0L when the double is NaN, which happens (for instance) when there
		// is a string that does not look like a number (which is a problem in itself, as any non-numeric
		// looking string will then result in the same seed of 0 — see https://github.com/getodk/javarosa/issues/800).
		// We'll emulate Java's Double -> Long conversion here (for NaN and some other double values)
		// so that we produce the same randomization as JR.
		if (Number.isNaN(seed)) {
			finalSeed = 0;
		} else if (seed === Infinity) {
			// In Java's .longValue(), this converts to 2**63 -1.
			// But that's larger than the JS Number.MAX_SAFE_INTEGER, and thus we cannot guarantee the same
			// outcomes as OpenRosa.
			// However. When Park-Miller is initialized, it takes the modulus of the seed and 2**31 -1 as
			// the first step. This means that for Park-Miller we can use 2**31 (which is smaller than Number.MAX_SAFE_INTEGER)
			// as a surrogate equivalent seed for Infinity, since
			// ((2**63 -1) % (2**31 -1)) = ((2**31) % (2**31 -1))
			// (because of JS Number imprecision (the problem to start with) don't use JS to convince of the above equality,
			// or rewrite to use BigInt).
			finalSeed = 2 ** 31;
		} else if (seed === -Infinity) {
			// Analogous with the above conversion for Infinity
			finalSeed = -(2 ** 31 + 1);
		} else if (!Number.isInteger(seed)) {
			// We're not out of the woods yet — see issue: https://github.com/getodk/web-forms/issues/240.
			// But one thing we know is that JR converts the double to a long, and thus drops the fractional part.
			// We'll do the same here.
			finalSeed = Math.floor(seed);
		} else {
			finalSeed = seed;
		}
		generator = new SeededPseudoRandomNumberGenerator(finalSeed);
	}

	const { length } = values;

	const results: T[] = [];

	for (let i = 0; i < length; i += 1) {
		const j = Math.floor(generator.random() * (i + 1));

		if (j !== i) {
			// @ts-expect-error - it would be nice to implement this so index access
			// is obviously safe
			results[i] = results[j];
		}

		// @ts-expect-error - it would be nice to implement this so index access is
		// obviously safe
		results[j] = values[i];
	}

	return results;
};
