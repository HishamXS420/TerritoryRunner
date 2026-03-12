const Territory = require('../models/Territory');
const geoUtils = require('../utils/geoUtils');

// Get all territories
exports.getAllTerritories = async (req, res) => {
  try {
    const territories = await Territory.getAll();

    // Parse polygon coordinates
    const parsedTerritories = territories.map(t => ({
      ...t,
      polygon_coords: JSON.parse(t.polygon_coords),
    }));

    res.json({ territories: parsedTerritories });
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get territories in a bounding box
exports.getTerritoriesInBounds = async (req, res) => {
  try {
    const { minLat, maxLat, minLon, maxLon } = req.query;

    const territories = await Territory.getTerritoriresInBounds(minLat, maxLat, minLon, maxLon);

    const parsedTerritories = territories.map(t => ({
      ...t,
      polygon_coords: JSON.parse(t.polygon_coords),
    }));

    res.json({ territories: parsedTerritories });
  } catch (error) {
    console.error('Error fetching territories in bounds:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user's territories
exports.getUserTerritories = async (req, res) => {
  try {
    const userId = req.user.id;

    const territories = await Territory.getByUserId(userId);

    const parsedTerritories = territories.map(t => ({
      ...t,
      polygon_coords: JSON.parse(t.polygon_coords),
    }));

    res.json({ territories: parsedTerritories });
  } catch (error) {
    console.error('Error fetching user territories:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get territory details
exports.getTerritoryDetails = async (req, res) => {
  try {
    const { territoryId } = req.params;

    const territory = await Territory.findById(territoryId);
    if (!territory) {
      return res.status(404).json({ message: 'Territory not found.' });
    }

    territory.polygon_coords = JSON.parse(territory.polygon_coords);

    res.json({ territory });
  } catch (error) {
    console.error('Error fetching territory details:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
