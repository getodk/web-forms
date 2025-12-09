import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { Point, LineString, Polygon } from 'ol/geom';

export const getFlatCoordinates = (geometry: LineString | Polygon | undefined) => {
	if (!geometry) {
		return [];
	}

	if (geometry instanceof LineString) {
		return geometry.getCoordinates();
	}

	return geometry.getCoordinates()[0] ?? [];
};

const getDeltaBetweenPoints = (pointA: number[], pointB: number[]) => {
	const isDefined = (c: number) => c != null;
	const pairA = pointA.filter(isDefined) as [number, number];
	const pairB = pointB.filter(isDefined) as [number, number];
	if (pairA.length < 2 || pairB.length < 2) {
		return { deltaX: 0, deltaY: 0 };
	}

	const [ax, ay] = pairA;
	const [bx, by] = pairB;
	return { deltaX: ax - bx, deltaY: ay - by };
};

const getDistanceBetweenPoints = (deltaX: number, deltaY: number) => {
	return deltaX * deltaX + deltaY * deltaY;
};

const getClosestPointOnSegment = (
	point: Coordinate,
	segmentStart: Coordinate,
	segmentEnd: Coordinate
): Coordinate => {
	const { deltaX, deltaY } = getDeltaBetweenPoints(segmentEnd, segmentStart);
	const segmentSize = getDistanceBetweenPoints(deltaX, deltaY);
	// Is it really a segment?
	if (segmentSize === 0) {
		return segmentStart;
	}

	const { deltaX: dxToStart, deltaY: dyToStart } = getDeltaBetweenPoints(point, segmentStart);
	// Projection (scalar factor) along the segment from start (0) to end (1) to land the point
	const projection = (dxToStart * deltaX + dyToStart * deltaY) / segmentSize;
	const clampedProjection = Math.max(0, Math.min(1, projection));

	// Calculate actual coordinates and return.
	const [startX = 0, startY = 0] = segmentStart;
	return [startX + clampedProjection * deltaX, startY + clampedProjection * deltaY];
};

const getClosestSegmentAndIndex = (
	coords: Coordinate[],
	point: Coordinate
): { segmentIndex: number; closest: Coordinate; squaredDist: number } => {
	let minSquaredDist = Infinity;
	let bestIndex = -1;
	let bestClosest: Coordinate = [];

	coords.forEach((startSegment, index) => {
		const endSegment = coords[index + 1];
		if (!startSegment || !endSegment) {
			return;
		}

		const closest = getClosestPointOnSegment(point, startSegment, endSegment);
		const { deltaX, deltaY } = getDeltaBetweenPoints(point, closest);
		const distance = getDistanceBetweenPoints(deltaX, deltaY);
		if (distance < minSquaredDist) {
			minSquaredDist = distance;
			bestIndex = index;
			bestClosest = closest;
		}
	});

	return { segmentIndex: bestIndex, closest: bestClosest, squaredDist: minSquaredDist };
};

const isCoordsEqual = (coordA: Coordinate | undefined, coordB: Coordinate | undefined) => {
	return coordA && coordB && coordA[0] === coordB[0] && coordA[1] === coordB[1];
};

const isOnLine = (squaredDist: number, resolution: number, hitTolerance: number) => {
	const tolerance = resolution * hitTolerance;
	return squaredDist <= tolerance * tolerance;
};

export const addTraceVertex = (
	resolution: number,
	newVertex: Coordinate,
	feature: Feature | undefined,
	hitTolerance: number
) => {
	if (!feature) {
		return new Feature({
			geometry: new LineString([newVertex]),
		});
	}

	const geometry = (feature as Feature<LineString>).getGeometry();
	const coords = getFlatCoordinates(geometry);
	if (!coords.length) {
		return;
	}

	const { segmentIndex, closest, squaredDist } = getClosestSegmentAndIndex(coords, newVertex);
	if (segmentIndex >= 0 && isOnLine(squaredDist, resolution, hitTolerance)) {
		coords.splice(segmentIndex + 1, 0, closest);
	} else {
		coords.push(newVertex);
	}

	geometry?.setCoordinates(coords);
	return feature;
};

export const addShapeVertex = (
	resolution: number,
	newVertex: Coordinate,
	feature: Feature | undefined,
	hitTolerance: number
) => {
	if (!feature) {
		return new Feature({
			geometry: new Polygon([[newVertex]]),
		});
	}

	const geometry = (feature as Feature<Polygon>).getGeometry();
	const ring = getFlatCoordinates(geometry);
	if (!ring.length) {
		return;
	}

	if (ring.length < 3) {
		ring.push(newVertex);
	} else {
		const { segmentIndex, closest, squaredDist } = getClosestSegmentAndIndex(ring, newVertex);
		if (segmentIndex >= 0 && isOnLine(squaredDist, resolution, hitTolerance)) {
			ring.splice(segmentIndex + 1, 0, closest);
		} else {
			ring.splice(ring.length - 1, 0, newVertex);
		}
	}

	// Autoclose if it hasn't been closed yet.
	const firstVertex = ring[0];
	const lastVertex = ring[ring.length - 1];
	if (ring.length >= 3 && firstVertex && !isCoordsEqual(firstVertex, lastVertex)) {
		ring.push([...firstVertex]);
	}

	geometry?.setCoordinates([ring]);
	return feature;
};

export const getVertexIndex = (
	feature: Feature<LineString | Polygon> | undefined,
	vertexToSelect: Feature<Point> | undefined
) => {
	const featureGeometry = feature?.getGeometry();
	const vertexGeometry = vertexToSelect?.getGeometry();
	if (!featureGeometry || !vertexGeometry) {
		return;
	}

	const vertexCoords = vertexGeometry.getCoordinates();
	const featureCoords = getFlatCoordinates(featureGeometry);
	const index = featureCoords.findIndex((coord) => isCoordsEqual(coord, vertexCoords));
	return index === -1 ? undefined : index;
};

export const deleteVertexFromFeature = (
	feature: Feature<LineString | Polygon> | undefined,
	index: number
): number => {
	const geometry = feature?.getGeometry();
	const coordinates = getFlatCoordinates(geometry);
	if (index < 0 || index >= coordinates.length) {
		return coordinates.length;
	}

	const removedVertex = coordinates.splice(index, 1)?.[0];

	if (geometry instanceof LineString) {
		geometry.setCoordinates(coordinates);
	} else if (geometry instanceof Polygon) {
		const last: Coordinate | undefined = coordinates[coordinates.length - 1];
		// If the first vertex was deleted, remove the closing duplicate as well
		if (index === 0 && isCoordsEqual(removedVertex, last)) {
			coordinates.splice(-1, 1);
		}

		// Close the ring if valid and necessary
		if (coordinates.length >= 3) {
			const newFirst: Coordinate | undefined = coordinates[0];
			const newLast: Coordinate | undefined = coordinates[coordinates.length - 1];
			if (!isCoordsEqual(newFirst, newLast)) {
				coordinates.push([...newFirst!]);
			}
		}
		geometry.setCoordinates([coordinates]);
	}

	return coordinates.length;
};
