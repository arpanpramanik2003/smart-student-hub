const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const stream = require('stream');

/**
 * Google Drive Storage Configuration
 * 
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Enable Google Drive API
 * 3. Create OAuth 2.0 credentials OR Service Account
 * 4. Download credentials JSON
 * 5. Create a folder in your Google Drive for uploads
 * 6. Get the folder ID from the URL (after /folders/)
 * 7. Share the folder with the service account email (if using service account)
 * 8. Set environment variables (see .env.production.template)
 */

let drive;
let folderId;

// Initialize Google Drive
const initializeStorage = () => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_DRIVE_CREDENTIALS) {
      // Production: Use Google Drive
      const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
      
      const auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });
      
      drive = google.drive({ version: 'v3', auth });
      folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      console.log('📁 Google Drive initialized');
      console.log(`📂 Using folder ID: ${folderId}`);
      return true;
    } else {
      // Development: Use local file storage
      console.log('💾 Using local file storage for development');
      return false;
    }
  } catch (error) {
    console.error('❌ Google Drive initialization error:', error.message);
    console.log('⚠️  Falling back to local file storage');
    return false;
  }
};

const useCloudStorage = initializeStorage();

/**
 * Upload file to Google Drive or local storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder name (e.g., 'avatars', 'certificates')
 * @returns {String} - Public URL or file ID of uploaded file
 */
const uploadFile = async (file, folder = 'uploads') => {
  try {
    if (useCloudStorage && drive) {
      // Upload to Google Drive
      const fileName = `${Date.now()}-${file.originalname}`;
      
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      
      const fileMetadata = {
        name: fileName,
        parents: [folderId], // Upload to specified folder
      };
      
      const media = {
        mimeType: file.mimetype,
        body: bufferStream,
      };
      
      // Upload file
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });
      
      const fileId = response.data.id;
      
      // Make file publicly accessible
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      
      // Get direct download link
      const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;
      
      console.log(`✅ Uploaded to Google Drive: ${fileName} (ID: ${fileId})`);
      return directLink;
      
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
 * Delete file from Google Drive or local storage
 * @param {String} fileUrl - URL of file to delete
 * @returns {Boolean} - Success status
 */
const deleteFile = async (fileUrl) => {
  try {
    if (useCloudStorage && drive && fileUrl.includes('drive.google.com')) {
      // Extract file ID from Google Drive URL
      // Format: https://drive.google.com/uc?export=view&id=FILE_ID
      const fileId = fileUrl.split('id=')[1];
      if (fileId) {
        await drive.files.delete({ fileId: fileId });
        console.log(`✅ Deleted file from Google Drive: ${fileId}`);
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
 * Get file metadata from Google Drive (optional - for future use)
 * @param {String} fileId - Google Drive file ID
 * @returns {Object} - File metadata
 */
const getFileMetadata = async (fileId) => {
  try {
    if (useCloudStorage && drive) {
      const response = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, webViewLink, webContentLink',
      });
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Get metadata error:', error);
    return null;
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileMetadata,
  useCloudStorage
};
