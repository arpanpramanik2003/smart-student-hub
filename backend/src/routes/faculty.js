const express = require('express');
const { 
  getPendingActivities, 
  getAllActivities, 
  reviewActivity, 
  getFacultyStats,
  getAllStudents 
} = require('../controllers/facultyController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and faculty/admin role
router.use(authenticateToken);
router.use(requireRole(['faculty', 'admin']));

// Faculty dashboard routes
router.get('/stats', getFacultyStats);
router.get('/activities/pending', getPendingActivities);
router.get('/activities', getAllActivities);
router.put('/activities/:activityId', reviewActivity); // 🔥 FIXED: Removed /review
router.get('/students', getAllStudents);

module.exports = router;
