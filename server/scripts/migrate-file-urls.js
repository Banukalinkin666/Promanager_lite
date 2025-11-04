import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateFileUrls() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_property_manager');
    console.log('✅ Connected to MongoDB');

    let updatedProperties = 0;
    let updatedLeases = 0;

    // Update property photos
    console.log('📸 Migrating property photos...');
    const properties = await Property.find({});
    for (const property of properties) {
      if (property.photos && property.photos.length > 0) {
        let needsUpdate = false;
        const migratedPhotos = property.photos.map(photo => {
          // Convert Cloudinary URLs to local URLs
          if (photo && (photo.includes('cloudinary.com') || photo.includes('res.cloudinary.com'))) {
            needsUpdate = true;
            // Extract filename from Cloudinary URL
            const urlParts = photo.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
            // Remove Cloudinary transformation suffixes
            const cleanFilename = filename.replace(/^v\d+\//, '').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
            const extension = photo.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)?.[1] || 'jpg';
            return `/uploads/properties/${cleanFilename}.${extension}`;
          }
          // If already local URL, keep it
          if (photo && photo.startsWith('/uploads/')) {
            return photo;
          }
          return photo;
        });

        if (needsUpdate) {
          property.photos = migratedPhotos;
          await property.save();
          updatedProperties++;
          console.log(`  ✅ Updated property: ${property.title || property._id}`);
        }
      }
    }

    // Update lease documents
    console.log('📄 Migrating lease documents...');
    const leases = await Lease.find({});
    for (const lease of leases) {
      if (lease.documents && lease.documents.length > 0) {
        let needsUpdate = false;
        const migratedDocuments = lease.documents.map(doc => {
          if (doc && doc.url && (doc.url.includes('cloudinary.com') || doc.url.includes('res.cloudinary.com'))) {
            needsUpdate = true;
            // Extract filename from Cloudinary URL
            const urlParts = doc.url.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
            // Remove Cloudinary transformation suffixes
            const cleanFilename = filename.replace(/^v\d+\//, '').replace(/\.(pdf|doc|docx|jpg|jpeg|png)$/i, '');
            const extension = doc.url.match(/\.(pdf|doc|docx|jpg|jpeg|png|gif|webp)(\?|$)/i)?.[1] || 'pdf';
            return {
              ...doc,
              url: `/uploads/documents/${cleanFilename}.${extension}`
            };
          }
          // If already local URL, keep it
          if (doc && doc.url && doc.url.startsWith('/uploads/')) {
            return doc;
          }
          return doc;
        });

        if (needsUpdate) {
          lease.documents = migratedDocuments;
          await lease.save();
          updatedLeases++;
          console.log(`  ✅ Updated lease: ${lease._id}`);
        }
      }
    }

    console.log('\n✅ File URL migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Properties updated: ${updatedProperties}`);
    console.log(`   - Leases updated: ${updatedLeases}`);
    console.log(`   - Total properties: ${properties.length}`);
    console.log(`   - Total leases: ${leases.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateFileUrls();

