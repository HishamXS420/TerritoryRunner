const express = require('express');
const territoryController = require('../controllers/territoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/all', territoryController.getAllTerritories);
router.get('/bounds', territoryController.getTerritoriesInBounds);
router.get('/:territoryId', territoryController.getTerritoryDetails);

// Protected routes
router.get('/user/territories', authMiddleware, territoryController.getUserTerritories);

module.exports = router;
