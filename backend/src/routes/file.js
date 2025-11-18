const express = require('express');
const { viewFile } = require('../controllers/fileController');

const router = express.Router();

// Public endpoint - no authentication required for viewing files
// This proxies Cloudinary files and serves them with inline headers
router.get('/view', viewFile);

module.exports = router;
