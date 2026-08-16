import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

let useCloudinary = false;

const PLACEHOLDER_VALUES = ['your_cloud_name', 'your_api_key', 'your_api_secret', 'CHANGE_ME'];

const initStorage = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const isValid = (val) => {
    if (!val) {
      return false;
    }

    const normalized = String(val).trim();
    if (!normalized) {
      return false;
    }

    return !PLACEHOLDER_VALUES.some((p) => normalized.startsWith(p));
  };

  const cloudNameValid = isValid(cloudName);
  const apiKeyValid = isValid(apiKey);
  const apiSecretValid = isValid(apiSecret);

  console.log(`🔧 Storage init — NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudNameValid ? 'SET' : 'NOT SET/INVALID'}`);
  console.log(`   CLOUDINARY_API_KEY: ${apiKeyValid ? 'SET' : 'NOT SET/INVALID'}`);
  console.log(`   CLOUDINARY_API_SECRET: ${apiSecretValid ? 'SET' : 'NOT SET/INVALID'}`);

  if (cloudNameValid && apiKeyValid && apiSecretValid) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    useCloudinary = true;
    console.log(`✅ Cloudinary storage initialized (${process.env.NODE_ENV || 'unknown'} mode)`);
    return true;
  }

  console.warn('⚠️  Cloudinary credentials missing/invalid — falling back to local file storage');
  console.warn('   Local storage is ephemeral on serverless platforms (Vercel, Render, etc.)');
  console.warn('   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET for persistent storage');
  return false;
};

initStorage();

export const uploadFile = async (file, folder = 'certificates') => {
  const { buffer, originalname } = file;

  if (useCloudinary) {
    const fileExt = originalname.split('.').pop()?.toLowerCase();
    const sanitizedName = originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);

    const resourceType = fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx' ? 'raw' : 'auto';
    const publicId = resourceType === 'raw' ? `${Date.now()}-${sanitizedName}.${fileExt}` : `${Date.now()}-${sanitizedName}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `campussphere/${folder}`,
          resource_type: resourceType,
          public_id: publicId,
          use_filename: false,
          unique_filename: false,
          access_mode: 'public',
          type: 'upload',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const ext = path.extname(originalname);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`💾 Saved locally: /uploads/${folder}/${filename}`);
  return `/uploads/${folder}/${filename}`;
};

export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (useCloudinary && fileUrl.includes('res.cloudinary.com')) {
    try {
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex === -1) return;

      const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
      const resourceType = fileUrl.includes('/raw/') ? 'raw' : 'image';
      const publicId = resourceType === 'raw'
        ? publicIdWithVersion.replace(/^v\d+\//, '')
        : publicIdWithVersion.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');

      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.error('Cloudinary delete error:', err.message);
    }
  }
};