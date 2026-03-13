const express = require('express');
const territoryController = require('../controllers/territoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/all', territoryController.getAllTerritories);
router.get('/bounds', territoryController.getTerritoriesInBounds);

// Protected routes
router.get('/user/territories', authMiddleware, territoryController.getUserTerritories);
router.get('/:territoryId', territoryController.getTerritoryDetails);

module.exports = router;
