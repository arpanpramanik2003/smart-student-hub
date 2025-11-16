const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAdminStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getSystemReports
} = require('../controllers/adminController');

// Middleware to ensure admin access
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Routes
router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/toggle-status', toggleUserStatus);
router.get('/reports', getSystemReports);

module.exports = router;
