const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/area', leaderboardController.getLeaderboardByArea);
router.get('/distance', leaderboardController.getLeaderboardByDistance);

// Protected routes
router.get('/rank/area', authMiddleware, leaderboardController.getUserRankByArea);
router.get('/rank/distance', authMiddleware, leaderboardController.getUserRankByDistance);

module.exports = router;
