import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const odkThemePreset = definePreset(Aura, {
	semantic: {
		primary: {
			50: '#e9f8ff',
			100: '#c7e6f5',
			200: '#a5d4eb',
			300: '#82c3e0',
			400: '#60b1d6',
			500: '#3e9fcc',
			600: '#3488af',
			700: '#297193',
			800: '#1f5976',
			900: '#14425a',
			950: '#0a2b3d',
		},
		colorScheme: {
			light: {
				surface: {
					0: '#ffffff',
					50: '#f9f9f9',
					100: '#f4f4f4',
					200: '#eeeeee',
					300: '#cbcacc',
					400: '#b2b1b3',
					500: '#989899',
					600: '#7f7f80',
					700: '#666566',
					800: '#4c4c4d',
					900: '#333333',
					950: '#1a1a1a',
				},
				danger: {
					50: '#ffedea',
					500: '#b3261e',
				},
			},
		},
	},
	components: {
		panel: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
					header: {
						color: '{surface.950}',
					},
				},
			},
		},
		card: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
				},
			},
		},
		dialog: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
				},
			},
		},
		menu: {
			colorScheme: {
				light: {
					item: {
						color: '{surface.950}',
						icon: {
							color: '{surface.950}',
						},
					},
				},
			},
		},
		message: {
			colorScheme: {
				light: {
					error: {
						borderColor: '{danger.500}',
						color: '{danger.500}',
					},
				},
			},
		},
		select: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
					option: {
						color: '{surface.950}',
					},
					dropdown: {
						color: '{surface.700}',
					},
				},
			},
		},
		multiselect: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
					option: {
						color: '{surface.950}',
					},
					dropdown: {
						color: '{surface.700}',
					},
				},
			},
		},
		inputtext: {
			colorScheme: {
				light: {
					root: {
						color: '{surface.950}',
					},
				},
			},
		},
		button: {
			colorScheme: {
				light: {
					root: {
						secondary: {
							color: '{surface.950}',
							background: '{surface.0}',
							hoverBackground: '{surface.200}',
						},
					},
					outlined: {
						contrast: {
							hoverBackground: '{surface.200}',
						},
					},
					text: {
						contrast: {
							hoverBackground: '{surface.200}',
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
