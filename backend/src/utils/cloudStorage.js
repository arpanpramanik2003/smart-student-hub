const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

/**
 * Google Cloud Storage Configuration
 * 
 * Setup Instructions:
 * 1. Create a Google Cloud Project: https://console.cloud.google.com
 * 2. Enable Cloud Storage API
 * 3. Create a Service Account with Storage Admin role
 * 4. Download JSON key file
 * 5. Create a bucket for your files
 * 6. Set environment variables (see .env.production.template)
 */

let storage;
let bucket;

// Initialize Google Cloud Storage
const initializeStorage = () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.GCS_CREDENTIALS) {
      // Production: Use Google Cloud Storage
      const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
      
      storage = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        credentials: credentials
      });
      
      bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
      console.log('☁️  Google Cloud Storage initialized');
      return true;
    } else {
      // Development: Use local file storage
      console.log('📁 Using local file storage for development');
      return false;
    }
  } catch (error) {
    console.error('❌ Google Cloud Storage initialization error:', error.message);
    console.log('⚠️  Falling back to local file storage');
    return false;
  }
};

const useCloudStorage = initializeStorage();

/**
 * Upload file to Google Cloud Storage or local storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder path in bucket (e.g., 'avatars', 'certificates')
 * @returns {String} - Public URL of uploaded file
 */
const uploadFile = async (file, folder = 'uploads') => {
  try {
    if (useCloudStorage && bucket) {
      // Upload to Google Cloud Storage
      const fileName = `${folder}/${Date.now()}-${file.originalname}`;
      const blob = bucket.file(fileName);
      
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: Date.now()
          }
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          console.error('Upload error:', error);
          reject(error);
        });

        blobStream.on('finish', async () => {
          // Make the file public
          await blob.makePublic();
          
          // Get public URL
          const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`;
          resolve(publicUrl);
        });

        blobStream.end(file.buffer);
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
      
      // Return local URL
      return `/uploads/${folder}/${fileName}`;
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Google Cloud Storage or local storage
 * @param {String} fileUrl - URL of file to delete
 * @returns {Boolean} - Success status
 */
const deleteFile = async (fileUrl) => {
  try {
    if (useCloudStorage && bucket && fileUrl.includes('storage.googleapis.com')) {
      // Delete from Google Cloud Storage
      const fileName = fileUrl.split(`${process.env.GCS_BUCKET_NAME}/`)[1];
      if (fileName) {
        await bucket.file(fileName).delete();
        console.log(`✅ Deleted file from GCS: ${fileName}`);
        return true;
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
    console.error('File deletion error:', error);
    return false;
  }
};

/**
 * Get signed URL for private files (optional - for future use)
 * @param {String} fileName - File name in bucket
 * @param {Number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {String} - Signed URL
 */
const getSignedUrl = async (fileName, expiresIn = 3600) => {
  try {
    if (useCloudStorage && bucket) {
      const [url] = await bucket.file(fileName).getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000
      });
      return url;
    }
    return null;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
  useCloudStorage
};
