import mongoose from 'mongoose';
import Property from './src/models/Property.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/spm');

console.log('🔧 Fixing image paths in database...\n');

// Get all properties
const properties = await Property.find({});
console.log(`Found ${properties.length} properties\n`);

let fixedCount = 0;

for (const property of properties) {
  if (!property.photos || property.photos.length === 0) {
    console.log(`⏭️  Skipping "${property.title}" - no photos`);
    continue;
  }

  let needsUpdate = false;
  const fixedPhotos = property.photos.map(photo => {
    // Skip if already a valid URL (Cloudinary or relative)
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo; // Cloudinary URL - keep as is
    }
    if (photo.startsWith('/uploads/properties/')) {
      return photo; // Already correct relative path
    }

    // Fix absolute server paths
    if (photo.includes('/opt/render/') || photo.includes('uploads/properties/')) {
      needsUpdate = true;
      const filename = path.basename(photo);
      const fixedPath = `/uploads/properties/${filename}`;
      console.log(`  ❌ WRONG: ${photo}`);
      console.log(`  ✅ FIXED: ${fixedPath}`);
      return fixedPath;
    }

    // Unknown format - log warning
    console.log(`  ⚠️  UNKNOWN FORMAT: ${photo}`);
    return photo;
  });

  if (needsUpdate) {
    property.photos = fixedPhotos;
    await property.save();
    fixedCount++;
    console.log(`✅ Fixed "${property.title}"\n`);
  } else {
    console.log(`✓  "${property.title}" - photos already correct\n`);
  }
}

console.log(`\n🎉 Migration complete!`);
console.log(`   Fixed ${fixedCount} properties`);
console.log(`   Total properties: ${properties.length}\n`);

process.exit(0);

