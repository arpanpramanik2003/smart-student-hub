const express = require('express');
const { viewFile, downloadFile } = require('../controllers/fileController');

const router = express.Router();

// Handle preflight OPTIONS requests
router.options('/view', (req, res) => {
  res.status(200).end();
});

router.options('/download', (req, res) => {
  res.status(200).end();
});

// Public endpoint - no authentication required for viewing files
// This proxies Cloudinary files and serves them with inline headers
router.get('/view', viewFile);

// Public endpoint - force download with attachment header
router.get('/download', downloadFile);

module.exports = router;
