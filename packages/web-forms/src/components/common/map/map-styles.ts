import type { Rule } from 'ol/style/flat';
import mapLocationIcon from '@/assets/images/map-location.svg';

const DEFAULT_POINT_STYLE = {
	'icon-src': mapLocationIcon,
	'icon-width': 40,
	'icon-height': 40,
};

const DEFAULT_LINE_STYLE = {
	'stroke-width': 6,
	'stroke-color': '#3E9FCC',
};

const DEFAULT_POLYGON_STYLE = {
	'fill-color': 'rgba(233, 248, 255, 0.8)',
	'stroke-width': 4,
	'stroke-color': '#3E9FCC',
};

const SCALE_POINT_STYLE = {
	'icon-src': mapLocationIcon,
	'icon-width': 50,
	'icon-height': 50,
};

const SCALE_LINE_STYLE = {
	'stroke-width': 8,
	'stroke-color': '#3E9FCC',
};

const SCALE_POLYGON_STYLE = {
	'stroke-width': 6,
};

const BLUE_GLOW_POINT_STYLE = {
	'circle-radius': 30,
	'circle-fill-color': 'rgba(148, 224, 237, 0.7)',
	'circle-displacement': [0, 0],
};

const BLUE_GLOW_LINE_STYLE = {
	'stroke-width': 20,
	'stroke-color': 'rgba(148, 224, 237, 0.7)',
};

const BLUE_GLOW_POLYGON_STYLE = {
	'stroke-width': 20,
	'stroke-color': 'rgba(148, 224, 237, 0.7)',
	'fill-color': 'transparent',
};

const GREEN_GLOW_POINT_STYLE = {
	'circle-radius': 30,
	'circle-fill-color': 'rgba(34, 197, 94, 0.6)',
	'circle-displacement': [0, 0],
};

const GREEN_GLOW_LINE_STYLE = {
	'stroke-width': 20,
	'stroke-color': 'rgba(34, 197, 94, 0.6)',
};

const GREEN_GLOW_POLYGON_STYLE = {
	'stroke-width': 20,
	'stroke-color': 'rgba(34, 197, 94, 0.6)',
	'fill-color': 'transparent',
};

export function getUnselectedStyles(
	featureIdProp: string,
	selectedPropName: string,
	savedPropName: string
): Rule[] {
	const makeFilter = (type: string) => {
		return [
			'all',
			['match', ['geometry-type'], type, true, false],
			['!=', ['get', featureIdProp], ['var', selectedPropName]],
			['!=', ['get', featureIdProp], ['var', savedPropName]],
		];
	};

	return [
		{
			filter: makeFilter('Point'),
			style: DEFAULT_POINT_STYLE,
		},
		{
			filter: makeFilter('LineString'),
			style: DEFAULT_LINE_STYLE,
		},
		{
			filter: makeFilter('Polygon'),
			style: DEFAULT_POLYGON_STYLE,
		},
	];
}

export function getSelectedStyles(
	featureIdProp: string,
	selectedPropName: string,
	savedPropName: string
): Rule[] {
	const makeFilter = (type: string) => {
		return [
			'all',
			['match', ['geometry-type'], type, true, false],
			['==', ['get', featureIdProp], ['var', selectedPropName]],
			['!=', ['get', featureIdProp], ['var', savedPropName]],
		];
	};

	return [
		{
			filter: makeFilter('Point'),
			style: [BLUE_GLOW_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_POINT_STYLE],
		},
		{
			filter: makeFilter('LineString'),
			style: [BLUE_GLOW_LINE_STYLE, DEFAULT_LINE_STYLE, SCALE_LINE_STYLE],
		},
		{
			filter: makeFilter('Polygon'),
			style: [BLUE_GLOW_POLYGON_STYLE, DEFAULT_POLYGON_STYLE, SCALE_POLYGON_STYLE],
		},
	];
}

export function getSavedStyles(featureIdProp: string, savedPropName: string): Rule[] {
	const makeFilter = (type: string) => {
		return [
			'all',
			['match', ['geometry-type'], type, true, false],
			['==', ['get', featureIdProp], ['var', savedPropName]],
		];
	};

	return [
		{
			filter: makeFilter('Point'),
			style: [GREEN_GLOW_POINT_STYLE, DEFAULT_POINT_STYLE, SCALE_POINT_STYLE],
		},
		{
			filter: makeFilter('LineString'),
			style: [GREEN_GLOW_LINE_STYLE, DEFAULT_LINE_STYLE, SCALE_LINE_STYLE],
		},
		{
			filter: makeFilter('Polygon'),
			style: [GREEN_GLOW_POLYGON_STYLE, DEFAULT_POLYGON_STYLE, SCALE_POLYGON_STYLE],
		},
	];
}
