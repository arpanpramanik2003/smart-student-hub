const express = require('express');
const { submitActivity, getMyActivities, getActivityStats, uploadAvatar } = require('../controllers/studentController');
const { getProfile, updateProfile } = require('../controllers/studentProfileController'); // Add import!
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['student', 'admin']));

// Student profile endpoints
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Existing endpoints
router.post('/activities', submitActivity);
router.get('/activities', getMyActivities);
router.get('/activities/stats', getActivityStats);
router.post('/upload-avatar', uploadAvatar);

module.exports = router;
