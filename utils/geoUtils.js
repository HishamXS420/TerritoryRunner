const turf = require('@turf/turf');

const isClosedLoop = (coordinates) => {
  const validCoordinates = coordinates.filter(coord => coord[0] !== 999);
  if (validCoordinates.length < 2) return false;

  const startPoint = validCoordinates[0];
  const endPoint = validCoordinates[validCoordinates.length - 1];

  const start = turf.point([startPoint[1], startPoint[0]]);
  const end = turf.point([endPoint[1], endPoint[0]]);

  const distance = turf.distance(start, end, { units: 'meters' });

  return distance <= 50; // Closed loop if within 50 meters
};

const coordinatesToPolygon = (coordinates) => {

  const validCoordinates = coordinates.filter(coord => coord[0] !== 999);

  if (!validCoordinates || validCoordinates.length < 3) {
    throw new Error('At least 3 valid coordinate points are required to create a polygon');
  }

  const polygonCoords = validCoordinates.map(coord => [coord[1], coord[0]]);
  if (polygonCoords.length > 2 && 
      (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
       polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])) {
    polygonCoords.push(polygonCoords[0]);
  }

  try {
    return turf.polygon([polygonCoords]);
  } catch (error) {
    console.error('Error creating polygon:', error);
    throw new Error('Failed to create polygon from coordinates');
  }
};

const calculateArea = (polygon) => {
  try {
    const area = turf.area(polygon);
    if (!area || isNaN(area) || area < 0) {
      throw new Error('Invalid area calculation');
    }
    return area; // Returns square meters
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0; // Return 0 as safe default
  }
};

const calculateCenterPoint = (polygon) => {
  try {
    const center = turf.center(polygon);
    if (!center || !center.geometry.coordinates) {
      throw new Error('Failed to calculate center point');
    }
    return {
      lat: center.geometry.coordinates[1],
      lon: center.geometry.coordinates[0],
    };
  } catch (error) {
    console.error('Error calculating center point:', error);

    return {
      lat: 0,
      lon: 0,
    };
  }
};

const checkOverlap = (polygon1, polygon2) => {
  try {
    const intersection = turf.intersect(polygon1, polygon2);
    return intersection !== null;
  } catch (error) {
    console.error('Error checking overlap:', error);
    return false;
  }
};

const calculateOverlappingArea = (polygon1, polygon2) => {
  try {
    const intersection = turf.intersect(polygon1, polygon2);
    if (!intersection) return 0;
    return turf.area(intersection);
  } catch (error) {
    console.error('Error calculating overlapping area:', error);
    return 0;
  }
};

const subtractPolygon = (polygon1, polygon2) => {
  try {

    const difference = turf.difference(polygon1, polygon2);
    return difference;
  } catch (error) {
    console.error('Error calculating difference:', error);
    return polygon1;
  }
};

const calculateRunningStats = (coordinates, timeInSeconds) => {
  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {

    if (coordinates[i][0] === 999 || coordinates[i + 1][0] === 999) continue;

    const point1 = turf.point([coordinates[i][1], coordinates[i][0]]);
    const point2 = turf.point([coordinates[i + 1][1], coordinates[i + 1][0]]);
    const distance = turf.distance(point1, point2, { units: 'kilometers' });
    totalDistance += distance;
  }

  const estimatedCalories = Math.round(totalDistance * 70 * 0.63);

  return {
    distance: parseFloat(totalDistance.toFixed(4)), // in kilometers
    calories: estimatedCalories,
    time: timeInSeconds,
  };
};

module.exports = {
  isClosedLoop,
  coordinatesToPolygon,
  calculateArea,
  calculateCenterPoint,
  checkOverlap,
  calculateOverlappingArea,
  subtractPolygon,
  calculateRunningStats,
};
