const cloudinary = require('cloudinary').v2;

/**
 * Generate authenticated/signed URL for viewing files
 * Returns a URL with transformation to force inline display
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

    console.log('📄 Generating view URL for:', url);

    // Extract public_id from URL
    // Format: https://res.cloudinary.com/CLOUD_NAME/raw/upload/v123/folder/file.ext
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      return res.status(400).json({ message: 'Invalid Cloudinary URL format' });
    }

    // Get everything after /upload/v123456/
    const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
    // Remove version prefix (v1234567/)
    const publicId = publicIdWithVersion.replace(/^v\d+\//, '');
    
    console.log('📍 Public ID:', publicId);

    // Get resource type from URL (raw or image)
    const resourceType = url.includes('/raw/') ? 'raw' : 'image';
    
    // Generate a signed URL with flags to force inline display
    // Cloudinary will serve the file with proper Content-Disposition headers
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      flags: 'attachment:false', // Try to prevent download
    });

    console.log('✅ Generated signed URL:', signedUrl);

    // Redirect to the signed URL
    res.redirect(signedUrl);

  } catch (error) {
    console.error('❌ URL generation error:', error.message);
    
    res.status(500).json({
      message: 'Failed to generate view URL',
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
