const RunningSession = require('../models/RunningSession');
const RouteCoordinate = require('../models/RouteCoordinate');
const pool = require('../config/database');
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
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
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
    let centerPoint = null;

    // Only check for territory if we have 3 or more coordinate points
    if (coordinates.length >= 3) {
      // Check if it's a closed loop
      isClosedLoop = geoUtils.isClosedLoop(coordinates);

      if (isClosedLoop) {
        try {
          const polygon = geoUtils.coordinatesToPolygon(coordinates);
          territoryArea = geoUtils.calculateArea(polygon);
          centerPoint = geoUtils.calculateCenterPoint(polygon);
        } catch (error) {
          console.error('Error preparing territory geometry:', error);
          isClosedLoop = false;
          territoryArea = 0;
          centerPoint = null;
        }
      }
    }

    let updatedSession;
    let createdTerritory = null;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1) Save final running session snapshot
      const updatedSessionResult = await client.query(
        `UPDATE running_sessions
         SET end_time = $2, is_closed_loop = $3, total_distance = $4, total_time = $5, estimated_calories = $6
         WHERE id = $1
         RETURNING *`,
        [sessionId, endTime, isClosedLoop, stats.distance, timeInSeconds, stats.calories]
      );
      updatedSession = updatedSessionResult.rows[0];

      // 2) Save running aggregates
      await client.query(
        `INSERT INTO user_statistics (
           user_id,
           total_distance,
           total_time,
           total_calories,
           total_territory_area,
           total_running_sessions,
           updated_at
         )
         VALUES ($1, $2, $3, $4, 0, 1, NOW())
         ON CONFLICT (user_id) DO UPDATE
         SET total_distance = user_statistics.total_distance + EXCLUDED.total_distance,
             total_time = user_statistics.total_time + EXCLUDED.total_time,
             total_calories = user_statistics.total_calories + EXCLUDED.total_calories,
             total_running_sessions = user_statistics.total_running_sessions + 1,
             updated_at = NOW()`,
        [userId, stats.distance * 1000, timeInSeconds, stats.calories]
      );

      // 3) Save territory + territory area aggregate if loop is closed
      if (isClosedLoop && territoryArea > 0 && centerPoint) {
        const territoryResult = await client.query(
          `INSERT INTO territories (user_id, running_session_id, polygon_coords, area, center_lat, center_lon)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [userId, sessionId, JSON.stringify(coordinates), territoryArea, centerPoint.lat, centerPoint.lon]
        );

        createdTerritory = territoryResult.rows[0];
        territoryId = createdTerritory.id;

        await client.query(
          `INSERT INTO user_statistics (
             user_id,
             total_distance,
             total_time,
             total_calories,
             total_territory_area,
             total_running_sessions,
             updated_at
           )
           VALUES ($1, 0, 0, 0, $2, 0, NOW())
           ON CONFLICT (user_id) DO UPDATE
           SET total_territory_area = user_statistics.total_territory_area + EXCLUDED.total_territory_area,
               updated_at = NOW()`,
          [userId, territoryArea]
        );
      }

      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }

    // Handle overlap after successful core transaction (non-blocking)
    if (createdTerritory) {
      try {
        await handleTerritoryOverlap(createdTerritory, userId);
      } catch (overlapError) {
        console.error('Territory overlap post-processing failed:', overlapError);
      }
    }

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
      sessionId: req.params?.sessionId
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
