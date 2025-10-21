import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Use Cloudinary v1 API
const cloudinaryV1 = cloudinary.v2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we should use cloud storage (production)
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true' || process.env.NODE_ENV === 'production';

let storage;

if (USE_CLOUD_STORAGE && process.env.CLOUDINARY_CLOUD_NAME) {
  // Configure Cloudinary
  cloudinaryV1.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Use Cloudinary storage
  storage = new CloudinaryStorage({
    cloudinary: cloudinaryV1,
    params: {
      folder: 'spm/properties',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 1200, height: 800, crop: 'limit' }]
    }
  });

  console.log('📸 Using Cloudinary cloud storage for images');
} else {
  // Use local file storage (development)
  const uploadDir = path.join(__dirname, '../../uploads/properties');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  console.log('💾 Using local file storage for images');
}

// File filter (same for both)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export default upload;
export { USE_CLOUD_STORAGE };

