import { ODK_VALUE_PROPERTY } from '@/components/common/map/useMapBlock.ts';
import type { UseMapViewControls } from '@/components/common/map/useMapViewControls.ts';
import type { FeatureCollection, Feature as GeoJsonFeature } from 'geojson';
import { Map } from 'ol';
import { intersects } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import type WebGLVectorLayer from 'ol/layer/WebGLVector';
import type VectorSource from 'ol/source/Vector';
import { shallowRef, watch } from 'vue';

export interface UseMapFeatures {
	createFeature: (geoJsonFeature: GeoJsonFeature) => Feature | undefined;
	findAndSaveFeature: (
		source: VectorSource,
		value: GeoJsonFeature | undefined,
		forceCenter: boolean
	) => void;
	getSavedFeature: () => Feature | undefined;
	getSelectedFeatureProperties: () => Record<string, string> | undefined;
	isSavedFeatureSelected: () => boolean;
	loadAndSaveSingleFeature: (source: VectorSource, feature: Feature) => void;
	loadFeatureCollection: (source: VectorSource, geoJSON: FeatureCollection) => void;
	saveSelectedFeature: () => void;
	selectFeature: (feature: Feature | undefined) => void;
	saveFeature: (feature: Feature | undefined) => void;
}

const DEFAULT_GEOJSON_PROJECTION = 'EPSG:4326';
export const FEATURE_ID_PROPERTY = 'odk_feature_id';
export const SAVED_ID_PROPERTY = 'savedId';
export const SELECTED_ID_PROPERTY = 'selectedId';

export function useMapFeatures(
	mapInstance: Map,
	viewControls: UseMapViewControls,
	multiFeatureLayer: WebGLVectorLayer
): UseMapFeatures {
	const selectedFeature = shallowRef<Feature | undefined>();
	const savedFeature = shallowRef<Feature | undefined>();

	const createFeature = (geoJsonFeature: GeoJsonFeature): Feature | undefined => {
		const feature: Feature | Feature[] = new GeoJSON().readFeature(geoJsonFeature, {
			dataProjection: DEFAULT_GEOJSON_PROJECTION,
			featureProjection: mapInstance.getView().getProjection(),
		});

		if (Array.isArray(feature)) {
			return feature[0];
		}

		return feature;
	};

	const loadAndSaveSingleFeature = (source: VectorSource, feature: Feature) => {
		source.clear(true);
		source.addFeature(feature);
		saveFeature(feature);
		viewControls.fitToAllFeatures(source);
	};

	const loadFeatureCollection = (source: VectorSource, geoJSON: FeatureCollection): void => {
		const features = new GeoJSON().readFeatures(geoJSON, {
			dataProjection: DEFAULT_GEOJSON_PROJECTION,
			featureProjection: mapInstance.getView().getProjection(),
		});

		features.forEach((feature) => {
			if (!feature.get(FEATURE_ID_PROPERTY)) {
				feature.set(FEATURE_ID_PROPERTY, crypto.randomUUID());
			}
		});

		source.addFeatures(features);
		viewControls.fitToAllFeatures(source);
	};

	const selectFeature = (feature: Feature | undefined) => (selectedFeature.value = feature);

	const isSavedFeatureSelected = (): boolean => {
		const featureId = savedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		const selectedId = selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		return featureId?.length > 0 && featureId === selectedId;
	};

	const updateFeaturesStyle = (propName: string, feature?: Feature) => {
		if (multiFeatureLayer.updateStyleVariables) {
			multiFeatureLayer.updateStyleVariables({
				[propName]: (feature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
			});
		}
	};

	const findAndSaveFeature = (
		source: VectorSource,
		value: GeoJsonFeature | undefined,
		forceCenter = false
	): void => {
		if (!value || source.isEmpty()) {
			return;
		}

		const featureToSave = source.forEachFeature((feature) => {
			const featureProps = feature.getProperties();
			if (featureProps?.[ODK_VALUE_PROPERTY] === value.properties?.[ODK_VALUE_PROPERTY]) {
				return feature;
			}
		});

		if (!featureToSave) {
			return;
		}

		saveFeature(featureToSave);

		if (forceCenter || !isFeatureInMapViewPort(featureToSave)) {
			viewControls.centerFeatureLocation(featureToSave);
		}
	};

	const isFeatureInMapViewPort = (feature: Feature): boolean => {
		const viewExtent = mapInstance.getView().calculateExtent(mapInstance.getSize());
		const featureExtent = feature.getGeometry()?.getExtent();
		if (!featureExtent) {
			return false;
		}

		return intersects(viewExtent, featureExtent);
	};

	const saveSelectedFeature = () => saveFeature(selectedFeature.value);

	const saveFeature = (feature: Feature | undefined) => (savedFeature.value = feature);

	const getSavedFeature = (): Feature | undefined => savedFeature.value;

	const getSelectedFeatureProperties = () => selectedFeature.value?.getProperties();

	watch(
		() => selectedFeature.value,
		(newSelectedFeature) => {
			updateFeaturesStyle(SELECTED_ID_PROPERTY, newSelectedFeature);
			if (newSelectedFeature) {
				viewControls.centerFeatureLocation(newSelectedFeature);
			}
		}
	);

	watch(
		() => savedFeature.value,
		(newSavedFeature) => {
			updateFeaturesStyle(SAVED_ID_PROPERTY, newSavedFeature);
			if (newSavedFeature) {
				viewControls.stopWatchingCurrentLocation();
			}
		}
	);

	return {
		createFeature,
		findAndSaveFeature,
		getSavedFeature,
		getSelectedFeatureProperties,
		isSavedFeatureSelected,
		loadAndSaveSingleFeature,
		loadFeatureCollection,
		saveFeature,
		saveSelectedFeature,
		selectFeature,
	};
}
