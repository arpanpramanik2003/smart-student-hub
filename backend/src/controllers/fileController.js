const axios = require('axios');

/**
 * Proxy file viewing endpoint
 * Fetches file from Cloudinary and serves it with inline headers
 * This allows PDFs and other documents to be viewed in the browser
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

    console.log('📄 Proxying file:', url);

    // Fetch the file from Cloudinary
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    // Determine content type from response or URL
    let contentType = response.headers['content-type'];
    if (!contentType) {
      // Fallback: determine from URL extension
      if (url.endsWith('.pdf')) contentType = 'application/pdf';
      else if (url.endsWith('.doc')) contentType = 'application/msword';
      else if (url.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (url.endsWith('.png')) contentType = 'image/png';
      else contentType = 'application/octet-stream';
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the file buffer
    res.send(Buffer.from(response.data));
    
    console.log('✅ File proxied successfully:', filename);

  } catch (error) {
    console.error('❌ File proxy error:', error.message);
    
    if (error.response) {
      // Cloudinary returned an error
      return res.status(error.response.status).json({
        message: 'Failed to fetch file from storage',
        details: error.response.statusText
      });
    }
    
    res.status(500).json({
      message: 'Failed to load file',
      details: error.message
    });
  }
};

module.exports = {
  viewFile
};
