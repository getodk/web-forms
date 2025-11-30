export const MODES = {
	SELECT: 'select', // Used in Select one from map question type
	LOCATION: 'location', // Used in Geopoint with "maps" appearance
	PLACEMENT: 'placement', // Used in Geopoint with "placement-map" appearance
	DRAW: 'draw', // Used in Geoshape and Geotrace question types
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];

interface ModeConfig {
	interactions: {
		select: boolean;
		longPress: boolean;
		drag: boolean;
	};
	capabilities: {
		canSaveCurrentLocation: boolean;
		canRemoveCurrentLocation: boolean;
		canLoadMultiFeatures: boolean;
		canViewProperties: boolean;
		canShowMapOverlay: boolean;
		canShowMapOverlayOnError: boolean;
		canUndoLastChange: boolean;
		canDeleteDrawFeature: boolean;
		canAutomaticallySave: boolean;
	};
}

export const getModeConfig = (mode: Mode): ModeConfig => {
	if (mode === MODES.SELECT) {
		return {
			interactions: {
				select: true,
				longPress: false,
				drag: false,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: true,
				canViewProperties: true,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canDeleteDrawFeature: false,
				canAutomaticallySave: false,
			},
		};
	}

	if (mode === MODES.LOCATION) {
		return {
			interactions: {
				select: false,
				longPress: false,
				drag: false,
			},
			capabilities: {
				canSaveCurrentLocation: true,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: true,
				canUndoLastChange: false,
				canDeleteDrawFeature: false,
				canAutomaticallySave: false,
			},
		};
	}

	if (mode === MODES.PLACEMENT) {
		return {
			interactions: {
				select: false,
				longPress: true,
				drag: true,
			},
			capabilities: {
				canSaveCurrentLocation: true,
				canRemoveCurrentLocation: true,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canDeleteDrawFeature: false,
				canAutomaticallySave: false,
			},
		};
	}

	if (mode === MODES.DRAW) {
		return {
			interactions: {
				select: false,
				longPress: true,
				drag: true,
			},
			capabilities: {
				canSaveCurrentLocation: false,
				canRemoveCurrentLocation: false,
				canLoadMultiFeatures: false,
				canViewProperties: false,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: true,
				canDeleteDrawFeature: true,
				canAutomaticallySave: true,
			},
		};
	}

	// Default, everything turned off.
	return {
		interactions: {
			select: false,
			longPress: false,
			drag: false,
		},
		capabilities: {
			canSaveCurrentLocation: false,
			canRemoveCurrentLocation: false,
			canLoadMultiFeatures: false,
			canViewProperties: false,
			canShowMapOverlay: false,
			canShowMapOverlayOnError: false,
			canUndoLastChange: false,
			canDeleteDrawFeature: false,
			canAutomaticallySave: false,
		},
	};
};
