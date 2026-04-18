const express = require('express');
const runController = require('../controllers/runController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', authMiddleware, runController.startSession);
router.post('/:sessionId/coordinate', authMiddleware, runController.addCoordinate);
router.post('/:sessionId/pause', authMiddleware, runController.pauseSession);
router.post('/:sessionId/finish', authMiddleware, runController.finishSession);
router.get('/:sessionId', authMiddleware, runController.getSession);
router.get('/history/all', authMiddleware, runController.getRunHistory);

module.exports = router;
