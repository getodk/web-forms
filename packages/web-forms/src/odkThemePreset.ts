import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const odkThemePreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '{sky.50}',
			100: '{sky.100}',
			200: '{sky.200}',
			300: '{sky.300}',
			400: '{sky.400}',
			500: '{sky.500}',
			600: '{sky.600}',
			700: '{sky.700}',
			800: '{sky.800}',
			900: '{sky.900}',
			950: '{sky.950}',
		},
		colorScheme: {
			light: {
				surface: {
					0: '#ffffff',
					50: '{zinc.50}',
					100: '{zinc.100}',
					200: '{zinc.200}',
					300: '{zinc.300}',
					400: '{zinc.400}',
					500: '{zinc.500}',
					600: '{zinc.600}',
					700: '{zinc.700}',
					800: '{zinc.800}',
					900: '{zinc.900}',
					950: '{zinc.950}',
				},
			},
		},
	},
	components: {
		button: {
			colorScheme: {
				light: {
					root: {
						secondary: {
							background: '{surface.0}',
						},
					},
				},
			},
		},
		slider: {
			colorScheme: {
				light: {
					handle: {
						background: '{primary.500}',
						hoverBackground: '{primary.300}',
						content: {
							background: '{primary.500}',
							hoverBackground: '{primary.300}',
						},
					},
				},
			},
		},
	},
});
