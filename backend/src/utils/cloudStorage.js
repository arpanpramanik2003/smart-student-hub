const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const stream = require('stream');
const cloudinary = require('cloudinary').v2;

/**
 * Cloud Storage Configuration
 * 
 * Uses Cloudinary for file storage in production
 * Local file storage for development
 * 
 * Cloudinary Setup:
 * 1. Sign up at https://cloudinary.com
 * 2. Get your credentials from Dashboard
 * 3. Set environment variables in Render:
 *    - CLOUDINARY_CLOUD_NAME
 *    - CLOUDINARY_API_KEY
 *    - CLOUDINARY_API_SECRET
 */

let useCloudinary = false;

// Initialize Cloudinary
const initializeStorage = () => {
  try {
    console.log('🔧 Checking cloud storage configuration...');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET'}`);
    console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET'}`);
    console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'}`);
    
    if (process.env.NODE_ENV === 'production' && 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      
      // Configure Cloudinary
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
      
      useCloudinary = true;
      console.log('✅ Cloudinary initialized successfully');
      console.log(`☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      return true;
    } else {
      // Development: Use local file storage
      console.log('💾 Using local file storage for development');
      return false;
    }
  } catch (error) {
    console.error('❌ Cloudinary initialization error:', error.message);
    console.log('⚠️  Falling back to local file storage');
    return false;
  }
};

initializeStorage();

/**
 * Upload file to Google Drive or local storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder name (e.g., 'avatars', 'certificates')
 * @returns {String} - Public URL or file ID of uploaded file
 */
const uploadFile = async (file, folder = 'certificates') => {
  try {
    if (useCloudinary) {
      // Upload to Cloudinary
      console.log('☁️  Uploading to Cloudinary:', file.originalname);
      
      // Upload buffer to Cloudinary
      // Use 'auto' resource type - Cloudinary handles everything automatically
      // This is the CORRECT approach for all file types including PDFs
      
      // Sanitize filename - remove spaces, special chars, keep only alphanumeric, dash, underscore
      const sanitizedName = file.originalname
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .substring(0, 100); // Limit length
      
      // Determine resource type based on file extension
      const fileExt = file.originalname.split('.').pop()?.toLowerCase();
      const resourceType = (fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx') ? 'raw' : 'auto';
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `smart-student-hub/${folder}`, // Organize in folders
            resource_type: resourceType, // Use 'raw' for documents, 'auto' for images
            public_id: `${Date.now()}-${sanitizedName}`, // Use sanitized filename
            use_filename: false, // Don't use original filename
            unique_filename: true,
            access_mode: 'public', // Ensure public access
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              console.error('   File:', file.originalname);
              console.error('   MIME type:', file.mimetype);
              console.error('   Resource type attempted:', resourceType);
              reject(error);
            } else {
              console.log('✅ Uploaded to Cloudinary:', result.secure_url);
              console.log(`📄 File: ${file.originalname}`);
              console.log(`📋 MIME type: ${file.mimetype}`);
              console.log(`🔧 Resource type: ${result.resource_type}`);
              console.log(`📦 Format: ${result.format}`);
              console.log(`🔗 URL: ${result.secure_url}`);
              resolve(result.secure_url); // Return public URL
            }
          }
        );
        
        // Pipe file buffer to Cloudinary
        uploadStream.end(file.buffer);
      });
      
    } else {
      // Local file storage (development)
      const uploadsDir = path.join(__dirname, '../../uploads', folder);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadsDir, fileName);
      
      fs.writeFileSync(filePath, file.buffer);
      
      console.log('💾 Uploaded to local storage:', fileName);
      // Return local URL
      return `/uploads/${folder}/${fileName}`;
    }
  } catch (error) {
    console.error('❌ File upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Google Drive or local storage
 * @param {String} fileUrl - URL of file to delete
 * @returns {Boolean} - Success status
 */
const deleteFile = async (fileUrl) => {
  try {
    if (useCloudinary && fileUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      // Format: https://res.cloudinary.com/CLOUD_NAME/image/upload/v123/folder/public_id.ext
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex > 0 && uploadIndex < urlParts.length - 1) {
        // Get everything after /upload/v123456/
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
        
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'auto'
        });
        
        console.log(`✅ Deleted from Cloudinary: ${publicId}`, result);
        return result.result === 'ok';
      }
    } else if (fileUrl.startsWith('/uploads/')) {
      // Delete from local storage
      const filePath = path.join(__dirname, '../../', fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted local file: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ File deletion error:', error);
    return false;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  useCloudinary
};
