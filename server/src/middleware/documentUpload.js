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

// Check if we should use cloud storage (only if explicitly enabled and credentials provided)
// Default to local storage for Render persistent disk
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true' && 
                          process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;

let storage;

if (USE_CLOUD_STORAGE && process.env.CLOUDINARY_CLOUD_NAME) {
  // Configure Cloudinary
  cloudinaryV1.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Use Cloudinary storage for documents
  storage = new CloudinaryStorage({
    cloudinary: cloudinaryV1,
    params: {
      folder: 'spm/documents',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
      resource_type: 'auto', // Allow both images and raw files (PDFs, docs)
      public_id: (req, file) => {
        // Generate unique public ID
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        return `spm/documents/${file.fieldname}-${uniqueSuffix}`;
      },
      // Remove transformation to make files publicly accessible
      // transformation: [{ flags: 'attachment' }] // This was causing 401 errors
    }
  });

  console.log('📄 Using Cloudinary cloud storage for documents');
} else {
  // Use local file storage (development)
  const uploadDir = path.join(__dirname, '../../uploads/documents');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created documents directory:', uploadDir);
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

  console.log('💾 Using local file storage for documents');
}

// File filter for documents
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDF, and Word documents are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export default upload;
export { USE_CLOUD_STORAGE };

