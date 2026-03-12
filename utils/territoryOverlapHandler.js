const Territory = require('../models/Territory');
const UserStatistics = require('../models/UserStatistics');
const geoUtils = require('./geoUtils');

/**
 * Handle territory overlap when a new territory is created
 * This function processes overlaps and updates territories accordingly
 * 
 * @param {Object} newTerritory - The newly created territory
 * @param {number} newUserId - The user ID who created the new territory
 */
async function handleTerritoryOverlap(newTerritory, newUserId) {
  try {
    // Parse the new territory's polygon
    const newPolygon = geoUtils.coordinatesToPolygon(newTerritory.polygon_coords);

    // Get all existing territories
    const allTerritories = await Territory.getAll();

    // Check for overlaps with each existing territory
    for (const existingTerritory of allTerritories) {
      // Skip if it's the same territory
      if (existingTerritory.id === newTerritory.id) continue;

      // Parse existing territory's polygon
      const existingPolygon = geoUtils.coordinatesToPolygon(
        JSON.parse(existingTerritory.polygon_coords)
      );

      // Check if territories overlap
      const hasOverlap = geoUtils.checkOverlap(newPolygon, existingPolygon);

      if (hasOverlap) {
        // Calculate overlapping area
        const overlapArea = geoUtils.calculateOverlappingArea(newPolygon, existingPolygon);

        // Update new territory (add overlap area)
        const updatedNewArea = newTerritory.area + overlapArea;
        await Territory.updatePolygon(newTerritory.id, newTerritory.polygon_coords, updatedNewArea);

        // Update old territory (remove overlap area)
        const updatedOldPolygon = geoUtils.subtractPolygon(existingPolygon, newPolygon);
        const updatedOldArea = geoUtils.calculateArea(updatedOldPolygon);

        // Get the polygon coordinates from the updated polygon
        const oldPolygonCoords = updatedOldPolygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

        await Territory.updatePolygon(existingTerritory.id, oldPolygonCoords, updatedOldArea);

        // Update user statistics
        const oldUserId = existingTerritory.user_id;

        // Add overlap to new user's territory
        await UserStatistics.updateTerritoryArea(newUserId, overlapArea);

        // Remove overlap from old user's territory
        await UserStatistics.updateTerritoryArea(oldUserId, -overlapArea);

        // Log the conflict (optional)
        logTerritoryConflict(existingTerritory.id, newTerritory.id, overlapArea, newUserId);

        console.log(`Territory overlap handled: ${overlapArea} m² transferred from user ${oldUserId} to user ${newUserId}`);
      }
    }
  } catch (error) {
    console.error('Error handling territory overlap:', error);
    throw error;
  }
}

/**
 * Log territory conflict to database for historical tracking
 * 
 * @param {number} territoryId1 - First territory ID
 * @param {number} territoryId2 - Second territory ID (the new one)
 * @param {number} overlapArea - Area of overlap in square meters
 * @param {number} newOwnerId - User ID who took over
 */
async function logTerritoryConflict(territoryId1, territoryId2, overlapArea, newOwnerId) {
  try {
    const pool = require('../config/database');
    await pool.query(
      `INSERT INTO territory_conflicts (territory_id_1, territory_id_2, overlapping_area, new_owner_id)
       VALUES ($1, $2, $3, $4)`,
      [territoryId1, territoryId2, overlapArea, newOwnerId]
    );
  } catch (error) {
    console.error('Error logging territory conflict:', error);
  }
}

/**
 * Get all conflicts for a user
 * 
 * @param {number} userId - User ID
 * @returns {Array} Array of conflict records
 */
async function getUserConflicts(userId) {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      `SELECT * FROM territory_conflicts 
       WHERE new_owner_id = $1 
       ORDER BY resolved_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching user conflicts:', error);
    return [];
  }
}

/**
 * Calculate total contested area for a user
 * (Area gained from conflicts)
 * 
 * @param {number} userId - User ID
 * @returns {number} Total contested area in square meters
 */
async function getUserContestedArea(userId) {
  try {
    const pool = require('../config/database');
    const result = await pool.query(
      `SELECT SUM(overlapping_area) as total FROM territory_conflicts 
       WHERE new_owner_id = $1`,
      [userId]
    );
    return result.rows[0].total || 0;
  } catch (error) {
    console.error('Error calculating contested area:', error);
    return 0;
  }
}

module.exports = {
  handleTerritoryOverlap,
  logTerritoryConflict,
  getUserConflicts,
  getUserContestedArea,
};
