# Render Organization Plan Migration Guide

## Overview
This guide will help you migrate your Property Manager application from MongoDB Atlas + Cloudinary to Render Organization Plan, which includes:
- **MongoDB** hosted as a private service on Render
- **File storage** using Render persistent disk storage
- **Complete cost savings** by eliminating expensive third-party services

## Prerequisites
- ✅ Render Organization Plan ($29/month + compute costs)
- ✅ Access to your current MongoDB Atlas database
- ✅ Access to your Cloudinary account (for data migration)
- ✅ Backup of your current data

## Step 1: Backup Your Current Data

### Backup MongoDB
```bash
# Using your existing backup script
npm run backup-database

# Or manually using mongodump
mongodump --uri="<YOUR_MONGODB_ATLAS_URI>" --out=./backups
```

### Backup Cloudinary Files
1. Export list of all files from Cloudinary dashboard
2. Download all files to local storage
3. Keep a record of file URLs and their corresponding database references

## Step 2: Set Up Render Services

### 2.1 Create MongoDB Private Service
1. Go to Render Dashboard → New → Private Service
2. Name: `spm-mongodb`
3. Environment: Docker
4. Dockerfile Path: `./server/Dockerfile.mongo`
5. Docker Context: `.` (root of your repo)
6. Plan: Starter ($7/month)
7. Add Disk:
   - Name: `mongodb-data`
   - Mount Path: `/data/db`
   - Size: 10GB
8. Environment Variables:
   - `MONGO_INITDB_DATABASE=smart_property_manager`
9. Click "Create Private Service"

### 2.2 Create Backend Web Service
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - Name: `spm-backend`
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Plan: Starter ($7/month)
4. Add Disk:
   - Name: `uploads-disk`
   - Mount Path: `/app/uploads`
   - Size: 10GB
5. Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `JWT_SECRET` (use Render's Generate Value)
   - `MONGO_URI=mongodb://spm-mongodb:27017/smart_property_manager`
   - `USE_CLOUD_STORAGE=false`
   - `STRIPE_SECRET_KEY=<your_stripe_key>` (sync: false)
   - `STRIPE_WEBHOOK_SECRET=<your_webhook_secret>` (sync: false)
   - `AUTO_INVOICES_CRON_ENABLED=true`
   - `AUTO_INVOICES_CRON_SCHEDULE=0 0 1 * *`
   - `BASE_URL=https://spm-backend.onrender.com` (update with your actual URL)
6. Click "Create Web Service"

### 2.3 Create Frontend Static Site
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - Name: `spm-frontend`
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
4. Environment Variables:
   - `VITE_API_URL=https://spm-backend.onrender.com` (update with your actual backend URL)
5. Click "Create Static Site"

## Step 3: Deploy Your Application

### 3.1 Push Configuration to GitHub
```bash
git add render.yaml server/Dockerfile.mongo
git commit -m "Add Render Organization plan configuration"
git push origin main
```

### 3.2 Monitor Deployment
1. Watch the MongoDB service deploy first
2. Wait for MongoDB to be fully running (check logs)
3. Backend service will deploy automatically
4. Frontend service will deploy automatically

## Step 4: Migrate MongoDB Data

### 4.1 Wait for MongoDB to be Ready
- Check MongoDB service logs in Render dashboard
- Wait for "MongoDB starting" message
- Service should show "Live" status

### 4.2 Restore Data to Render MongoDB

#### Option A: Using mongorestore (Recommended)
```bash
# From your local machine
mongorestore --uri="mongodb://spm-mongodb:27017/smart_property_manager" \
  --drop \
  ./backups/<your-backup-folder>
```

**Note**: You'll need to set up MongoDB connection from your local machine. Render private services are not accessible from the internet by default. You have two options:

1. **Use Render Shell** (Recommended):
   - Go to MongoDB service → Shell
   - Run restore commands there

2. **Use MongoDB Compass with SSH Tunnel**:
   - Set up SSH tunnel to Render service
   - Connect through tunnel

#### Option B: Using Your Existing Backup Script
Update your restore script to use the Render MongoDB URI:
```bash
MONGO_URI=mongodb://spm-mongodb:27017/smart_property_manager npm run restore
```

### 4.3 Verify Data Migration
1. Check backend logs: `https://spm-backend.onrender.com/api/db-test`
2. Verify data count matches your original database
3. Test a few API endpoints to ensure data is accessible

## Step 5: Migrate Files from Cloudinary

### 5.1 Download Files from Cloudinary
```bash
# Create a script to download all Cloudinary files
# Save them to ./migrated-files/
```

### 5.2 Upload Files to Render Backend
Since Render private services don't have direct file upload access, you'll need to:

1. **Upload via API** (Recommended):
   - Use your existing upload endpoints
   - Batch upload files using a migration script

2. **Manual Upload**:
   - Use your application's upload interface
   - Upload files one by one (not practical for large sets)

### 5.3 Update Database File URLs
After uploading files, update your database to point to new file URLs:
```javascript
// Example: Update property photos from Cloudinary URLs to local URLs
// Old: https://res.cloudinary.com/.../image.jpg
// New: /uploads/properties/image.jpg
```

## Step 6: Update File URLs in Database

### 6.1 Create Migration Script
Create `server/scripts/migrate-file-urls.js`:

```javascript
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Lease from '../models/Lease.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateFileUrls() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Update property photos
  const properties = await Property.find({});
  for (const property of properties) {
    if (property.photos && property.photos.length > 0) {
      property.photos = property.photos.map(photo => {
        // Convert Cloudinary URLs to local URLs
        if (photo.includes('cloudinary.com')) {
          const filename = photo.split('/').pop().split('?')[0];
          return `/uploads/properties/${filename}`;
        }
        return photo;
      });
      await property.save();
    }
  }
  
  // Update lease documents
  const leases = await Lease.find({});
  for (const lease of leases) {
    if (lease.documents && lease.documents.length > 0) {
      lease.documents = lease.documents.map(doc => {
        if (doc.url && doc.url.includes('cloudinary.com')) {
          const filename = doc.url.split('/').pop().split('?')[0];
          return {
            ...doc,
            url: `/uploads/documents/${filename}`
          };
        }
        return doc;
      });
      await lease.save();
    }
  }
  
  console.log('✅ File URLs migrated successfully');
  process.exit(0);
}

migrateFileUrls();
```

### 6.2 Run Migration
```bash
# In Render Shell or locally with MONGO_URI set
node server/scripts/migrate-file-urls.js
```

## Step 7: Test Your Application

### 7.1 Test Database Connection
- Visit: `https://spm-backend.onrender.com/api/db-test`
- Should show: `connected: true`

### 7.2 Test File Upload
1. Log in to your application
2. Upload a property image
3. Verify it's accessible via `/uploads/properties/<filename>`
4. Check that it persists after service restart

### 7.3 Test File Serving
1. Upload a document
2. Try to download/view the document
3. Verify URLs work correctly

### 7.4 Test Full Workflow
1. Create a property with images
2. Create a lease with documents
3. Verify all data persists
4. Restart services and verify data is still there

## Step 8: Update DNS/Custom Domains (Optional)

### 8.1 Set Up Custom Domain for Backend
1. Go to Backend Service → Settings → Custom Domains
2. Add your domain: `api.yourdomain.com`
3. Update DNS records as instructed
4. Update `BASE_URL` environment variable

### 8.2 Set Up Custom Domain for Frontend
1. Go to Frontend Service → Settings → Custom Domains
2. Add your domain: `app.yourdomain.com`
3. Update DNS records
4. Update `VITE_API_URL` to use custom backend domain

## Step 9: Monitor and Optimize

### 9.1 Monitor Costs
- Check Render dashboard for usage
- Monitor disk storage usage
- Track bandwidth usage (1TB included in Organization plan)

### 9.2 Set Up Alerts
- Disk usage alerts (when >80% full)
- Service health alerts
- Database connection alerts

### 9.3 Regular Backups
- Set up automated backups for MongoDB
- Backup files from persistent disk
- Store backups in a separate location

## Troubleshooting

### MongoDB Connection Issues
- **Problem**: Can't connect to MongoDB
- **Solution**: 
  - Verify MongoDB service is running
  - Check `MONGO_URI` format: `mongodb://spm-mongodb:27017/smart_property_manager`
  - Ensure services are in the same Render organization

### File Upload Issues
- **Problem**: Files not persisting
- **Solution**:
  - Verify disk is mounted at `/app/uploads`
  - Check disk size hasn't exceeded limit
  - Ensure directory permissions are correct

### File Serving Issues
- **Problem**: 404 errors on file URLs
- **Solution**:
  - Verify static middleware is configured in `app.js`
  - Check file paths are relative (`/uploads/...`)
  - Ensure files exist in the uploads directory

### Database Migration Issues
- **Problem**: Data not showing up
- **Solution**:
  - Verify MongoDB connection
  - Check database name matches
  - Verify data was actually restored
  - Check service logs for errors

## Cost Comparison

### Before Migration
- MongoDB Atlas: $25-50/month
- Cloudinary: $25-50/month
- **Total: $50-100/month**

### After Migration (Render Organization Plan)
- Organization Plan: $29/month
- MongoDB Private Service: ~$7/month
- Backend Web Service: ~$7/month
- Frontend Static Site: Free
- Persistent Disks: ~$5/month (20GB total)
- **Total: ~$48/month**

### Savings
- **$2-52/month savings** (2-52% reduction)
- **Plus**: Better features, team collaboration, priority support, 1TB bandwidth

## Next Steps

1. ✅ Complete migration
2. ✅ Test all functionality
3. ✅ Monitor for 1 week
4. ✅ Cancel MongoDB Atlas subscription
5. ✅ Cancel Cloudinary subscription
6. ✅ Set up regular backups
7. ✅ Configure custom domains (optional)

## Support

If you encounter issues:
1. Check Render service logs
2. Check application logs
3. Review this guide
4. Contact Render support (priority support with Organization plan)

---

**Congratulations!** You've successfully migrated to Render Organization Plan and eliminated expensive third-party services! 🎉

