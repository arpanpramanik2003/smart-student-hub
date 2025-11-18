const cloudinary = require('cloudinary').v2;
const axios = require('axios');

/**
 * Proxy PDF files through backend to avoid CORS issues with PDF.js
 * Fetches the file from Cloudinary and serves it with proper headers
 */
const viewFile = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'File URL is required' });
    }

    // Validate that the URL is from our Cloudinary account
    if (!url.includes('res.cloudinary.com/ddh85qbp2')) {
      return res.status(403).json({ message: 'Invalid file URL' });
    }

    console.log('📄 Proxying file for PDF.js viewer:', url);

    // Fetch the file from Cloudinary
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf,*/*',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log('✅ File fetched successfully, size:', response.data.length, 'bytes');

    // Determine content type
    const contentType = response.headers['content-type'] || 'application/pdf';
    
    // Set headers for inline display (crucial for PDF.js)
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // CRITICAL: CORS headers for PDF.js
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    // Send the file
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ File proxy error:', error.message);
    
    res.status(500).json({
      message: 'Failed to fetch file from storage',
      details: error.message
    });
  }
};

/**
 * Force download a file by setting Content-Disposition: attachment
 */
const downloadFile = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'File URL is required' });
    }

    // Validate that the URL is from our Cloudinary account
    if (!url.includes('res.cloudinary.com/ddh85qbp2')) {
      return res.status(403).json({ message: 'Invalid file URL' });
    }

    console.log('📥 Forcing download for:', url);

    // Extract public_id from URL
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return res.status(400).json({ message: 'Invalid Cloudinary URL format' });
    }

    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
    const publicId = publicIdWithVersion.replace(/^v\d+\//, '');
    
    // Get resource type from URL
    const resourceType = url.includes('/raw/') ? 'raw' : 'image';
    
    // Generate a signed URL with attachment flag to force download
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      flags: 'attachment', // Force download
    });

    console.log('✅ Generated download URL');

    // Redirect to the download URL
    res.redirect(downloadUrl);

  } catch (error) {
    console.error('❌ Download error:', error.message);
    
    res.status(500).json({
      message: 'Failed to generate download URL',
      details: error.message
    });
  }
};

module.exports = {
  viewFile,
  downloadFile
};
