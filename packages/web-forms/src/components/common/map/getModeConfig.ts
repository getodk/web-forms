export const MODES = {
	SELECT: 'select', // Used in Select one from map question type
	LOCATION: 'location', // Used in Geopoint with "maps" appearance
	PLACEMENT: 'placement', // Used in Geopoint with "placement-map" appearance
	DRAW: 'draw', // Used in Geoshape and Geotrace question types
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];

export interface ModeCapabilities {
	canAutomaticallySave: boolean;
	canDeleteDrawFeature: boolean;
	canLoadMultiFeatures: boolean;
	canRemoveCurrentLocation: boolean;
	canSaveCurrentLocation: boolean;
	canSelectVertices: boolean;
	canShowMapOverlay: boolean;
	canShowMapOverlayOnError: boolean;
	canUndoLastChange: boolean;
	canViewProperties: boolean;
}

interface ModeConfig {
	interactions: {
		select: boolean;
		longPress: boolean;
		drag: boolean;
	};
	capabilities: ModeCapabilities;
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
				canAutomaticallySave: false,
				canDeleteDrawFeature: false,
				canLoadMultiFeatures: true,
				canRemoveCurrentLocation: false,
				canSaveCurrentLocation: false,
				canSelectVertices: false,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canViewProperties: true,
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
				canAutomaticallySave: false,
				canDeleteDrawFeature: false,
				canLoadMultiFeatures: false,
				canRemoveCurrentLocation: true,
				canSaveCurrentLocation: true,
				canSelectVertices: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: true,
				canUndoLastChange: false,
				canViewProperties: false,
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
				canAutomaticallySave: false,
				canDeleteDrawFeature: false,
				canLoadMultiFeatures: false,
				canRemoveCurrentLocation: true,
				canSaveCurrentLocation: true,
				canSelectVertices: false,
				canShowMapOverlay: true,
				canShowMapOverlayOnError: false,
				canUndoLastChange: false,
				canViewProperties: false,
			},
		};
	}

	if (mode === MODES.DRAW) {
		return {
			interactions: {
				select: true,
				longPress: true,
				drag: true,
			},
			capabilities: {
				canAutomaticallySave: true,
				canDeleteDrawFeature: true,
				canLoadMultiFeatures: false,
				canRemoveCurrentLocation: false,
				canSaveCurrentLocation: false,
				canSelectVertices: true,
				canShowMapOverlay: false,
				canShowMapOverlayOnError: false,
				canUndoLastChange: true,
				canViewProperties: false,
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
			canAutomaticallySave: false,
			canDeleteDrawFeature: false,
			canLoadMultiFeatures: false,
			canRemoveCurrentLocation: false,
			canSaveCurrentLocation: false,
			canSelectVertices: false,
			canShowMapOverlay: false,
			canShowMapOverlayOnError: false,
			canUndoLastChange: false,
			canViewProperties: false,
		},
	};
};
