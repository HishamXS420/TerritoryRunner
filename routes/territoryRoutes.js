const express = require('express');
const territoryController = require('../controllers/territoryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/all', territoryController.getAllTerritories);
router.get('/bounds', territoryController.getTerritoriesInBounds);

router.get('/user/territories', authMiddleware, territoryController.getUserTerritories);
router.get('/:territoryId', territoryController.getTerritoryDetails);

module.exports = router;
