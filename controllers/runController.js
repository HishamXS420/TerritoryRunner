const RunningSession = require('../models/RunningSession');
const RouteCoordinate = require('../models/RouteCoordinate');
const Territory = require('../models/Territory');
const UserStatistics = require('../models/UserStatistics');
const geoUtils = require('../utils/geoUtils');
const { handleTerritoryOverlap } = require('../utils/territoryOverlapHandler');

// Start a running session
exports.startSession = async (req, res) => {
  try {
    const userId = req.user.id;

    // Create new running session
    const session = await RunningSession.create(userId);

    res.status(201).json({
      message: 'Running session started.',
      sessionId: session.id,
      startTime: session.start_time,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Add route coordinate during run
exports.addCoordinate = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    // Create coordinate record
    const coordinate = await RouteCoordinate.create(sessionId, latitude, longitude);

    res.json({ message: 'Coordinate recorded.', coordinate });
  } catch (error) {
    console.error('Error adding coordinate:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Pause session (no action needed, just acknowledge)
exports.pauseSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Session still exists but tracking is paused (client-side)
    res.json({ message: 'Session paused.' });
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Finish running session
exports.finishSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get the session
    const session = await RunningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Get all coordinates for this session
    const coordinateRows = await RouteCoordinate.getBySessionId(sessionId);
    if (!coordinateRows || coordinateRows.length === 0) {
      return res.status(400).json({ message: 'No coordinates recorded for this session.' });
    }

    // Convert to coordinate array [lat, lon]
    const coordinates = coordinateRows.map(row => [row.latitude, row.longitude]);

    // Calculate stats
    const endTime = new Date();
    const timeInSeconds = Math.floor((endTime - session.start_time) / 1000);
    const stats = geoUtils.calculateRunningStats(coordinates, timeInSeconds);

    let territoryId = null;
    let territoryArea = 0;
    let isClosedLoop = false;

    // Only check for territory if we have 3 or more coordinate points
    if (coordinates.length >= 3) {
      // Check if it's a closed loop
      isClosedLoop = geoUtils.isClosedLoop(coordinates);

      if (isClosedLoop) {
        try {
          // Convert to polygon
          const polygon = geoUtils.coordinatesToPolygon(coordinates);
          territoryArea = geoUtils.calculateArea(polygon);
          const centerPoint = geoUtils.calculateCenterPoint(polygon);

          // Create territory
          const territory = await Territory.create(
            userId,
            sessionId,
            coordinates,
            territoryArea,
            centerPoint.lat,
            centerPoint.lon
          );
          territoryId = territory.id;

          // Handle any overlaps with existing territories
          await handleTerritoryOverlap(territory, userId);

          // Update user statistics
          await UserStatistics.updateTerritoryArea(userId, territoryArea);
          
          console.log(`Territory created: ${territoryId}, Area: ${territoryArea} m²`);
        } catch (error) {
          console.error('Error creating territory:', error);
          // Continue without territory if there's an error
        }
      }
    }

    // Update running session (always save distance, time, calories)
    const updatedSession = await RunningSession.updateSession(
      sessionId,
      endTime,
      isClosedLoop,
      stats.distance,
      timeInSeconds,
      stats.calories
    );

    // Update user running statistics (always update)
    await UserStatistics.update(userId, stats);

    res.json({
      message: 'Session finished.',
      session: updatedSession,
      stats,
      isClosedLoop,
      territoryId,
      territoryArea: territoryArea.toFixed(2),
    });
  } catch (error) {
    console.error('Error finishing session:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      sessionId
    });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get session details
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await RunningSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    const coordinates = await RouteCoordinate.getBySessionId(sessionId);

    res.json({ session, coordinates });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user's running history
exports.getRunHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await RunningSession.getRecentSessionsWithTerritories(userId, 20);

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching run history:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
