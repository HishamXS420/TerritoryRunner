const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/area', leaderboardController.getLeaderboardByArea);
router.get('/distance', leaderboardController.getLeaderboardByDistance);

router.get('/rank/area', authMiddleware, leaderboardController.getUserRankByArea);
router.get('/rank/distance', authMiddleware, leaderboardController.getUserRankByDistance);

module.exports = router;
