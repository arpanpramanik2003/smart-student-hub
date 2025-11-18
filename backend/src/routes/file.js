const express = require('express');
const { viewFile, downloadFile } = require('../controllers/fileController');

const router = express.Router();

// Public endpoint - no authentication required for viewing files
// This proxies Cloudinary files and serves them with inline headers
router.get('/view', viewFile);

// Public endpoint - force download with attachment header
router.get('/download', downloadFile);

module.exports = router;
