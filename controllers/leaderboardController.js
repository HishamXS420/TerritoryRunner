const UserStatistics = require('../models/UserStatistics');

// Get leaderboard by territory area
exports.getLeaderboardByArea = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await UserStatistics.getLeaderboardByArea(limit);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get leaderboard by total distance
exports.getLeaderboardByDistance = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await UserStatistics.getLeaderboardByDistance(limit);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user rank by area
exports.getUserRankByArea = async (req, res) => {
  try {
    const userId = req.user.id;

    const rank = await UserStatistics.getUserRankByArea(userId);

    res.json({ rank });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get user rank by distance
exports.getUserRankByDistance = async (req, res) => {
  try {
    const userId = req.user.id;

    const rank = await UserStatistics.getUserRankByDistance(userId);

    res.json({ rank });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
