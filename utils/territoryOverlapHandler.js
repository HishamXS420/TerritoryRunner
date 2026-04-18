const Territory = require('../models/Territory');
const UserStatistics = require('../models/UserStatistics');
const geoUtils = require('./geoUtils');

async function handleTerritoryOverlap(newTerritory, newUserId) {
  try {
    const newPolygon = geoUtils.coordinatesToPolygon(newTerritory.polygonCoords);

    const allTerritories = await Territory.find({
      _id: { $ne: newTerritory._id },
    }).lean();

    for (const existing of allTerritories) {

      if (String(existing.userId) === String(newUserId)) continue;

      if (!Array.isArray(existing.polygonCoords) || existing.polygonCoords.length < 3) continue;

      let existingPolygon;
      try {
        existingPolygon = geoUtils.coordinatesToPolygon(existing.polygonCoords);
      } catch (e) {
        console.warn('⚠️ Could not parse existing territory polygon, skipping:', existing._id);
        continue;
      }

      const hasOverlap = geoUtils.checkOverlap(newPolygon, existingPolygon);
      if (!hasOverlap) continue;

      const overlapArea = geoUtils.calculateOverlappingArea(newPolygon, existingPolygon);
      if (!overlapArea || overlapArea <= 0) continue;

      console.log(`⚔️ Overlap detected: ${overlapArea.toFixed(2)} m² between new territory and territory ${existing._id}`);

      const remainingPolygon = geoUtils.subtractPolygon(existingPolygon, newPolygon);

      if (!remainingPolygon) {

        await Territory.findByIdAndDelete(existing._id);
        console.log(`🗑️ Territory ${existing._id} fully consumed and deleted`);

        await UserStatistics.findOneAndUpdate(
          { userId: existing.userId },
          { $inc: { totalTerritoryArea: -existing.area } }
        );
      } else {

        const remainingCoords = remainingPolygon.geometry.coordinates[0].map(
          coord => [coord[1], coord[0]]  // [lon, lat] → [lat, lon]
        );
        const remainingArea = geoUtils.calculateArea(remainingPolygon);
        const newCenter = geoUtils.calculateCenterPoint(remainingPolygon);

        await Territory.findByIdAndUpdate(existing._id, {
          polygonCoords: remainingCoords,
          area: remainingArea,
          centerLat: newCenter.lat,
          centerLon: newCenter.lon,
        });

        console.log(`✂️ Territory ${existing._id} trimmed. Remaining: ${remainingArea.toFixed(2)} m²`);

        await UserStatistics.findOneAndUpdate(
          { userId: existing.userId },
          { $inc: { totalTerritoryArea: -overlapArea } }
        );
      }

      console.log(`✅ ${overlapArea.toFixed(2)} m² transferred from user ${existing.userId} to user ${newUserId}`);
    }
  } catch (error) {
    console.error('❌ Error handling territory overlap:', error.message);
    throw error;
  }
}

module.exports = { handleTerritoryOverlap };
