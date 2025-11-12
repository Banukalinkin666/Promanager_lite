# Complete Migration Guide: MongoDB Atlas → Render MongoDB & Cloudinary → Render File Storage

This guide will help you migrate your Property Management System from MongoDB Atlas to Render's MongoDB database service and from Cloudinary to Render's persistent disk storage.

## 📋 Prerequisites

- ✅ Render account with **Organization Plan** (required for persistent disk)
- ✅ Access to your current MongoDB Atlas database for data export
- ✅ Access to your current Cloudinary account for file migration (if needed)

---

## 🗄️ **PART 1: MongoDB Migration (Atlas → Render MongoDB)**

### **Step 1: Create MongoDB Database on Render**

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Make sure you're in your **Organization** account

2. **Create New MongoDB Database**
   - Click **"New +"** → **"MongoDB"**
   - Configure:
     - **Name**: `spm-database` (or your preferred name)
     - **Database**: `smart_property_manager` (or your preferred database name)
     - **Plan**: Choose appropriate plan (Starter is fine for most cases)
     - **Region**: Choose closest to your web service
   - Click **"Create Database"**

3. **Wait for Database to Initialize**
   - Render will provision the database (takes 2-5 minutes)
   - You'll see status change to "Available"

4. **Get Connection String**
   - Once available, click on your database
   - Find **"Internal Database URL"** (for same Render region) or **"External Database URL"** (for external access)
   - Copy the connection string (it looks like: `mongodb://username:password@host:port/database`)

### **Step 2: Export Data from MongoDB Atlas**

1. **Install MongoDB Tools** (if not already installed)
   ```bash
   # Windows (using Chocolatey)
   choco install mongodb-database-tools
   
   # Or download from: https://www.mongodb.com/try/download/database-tools
   ```

2. **Export All Collections**
   ```bash
   # Replace with your Atlas connection string
   mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/smart_property_manager" --out=./mongodb-backup
   ```

3. **Verify Export**
   - Check that `./mongodb-backup/smart_property_manager/` contains your collections
   - You should see files like: `users.bson`, `properties.bson`, `leases.bson`, etc.

### **Step 3: Import Data to Render MongoDB**

1. **Get Render MongoDB Connection String**
   - Use the **External Database URL** from Render dashboard
   - Format: `mongodb://username:password@host:port/database`

2. **Import All Collections**
   ```bash
   # Replace with your Render MongoDB connection string
   mongorestore --uri="mongodb://username:password@host:port/database" ./mongodb-backup/smart_property_manager/
   ```

3. **Verify Import**
   - Check Render dashboard → MongoDB → Metrics
   - Or connect using MongoDB Compass to verify data

### **Step 4: Update Environment Variables**

1. **In Render Dashboard**
   - Go to your **Web Service** (spm-backend)
   - Navigate to **Environment** tab
   - Find `MONGO_URI` variable
   - Update it with your **Render MongoDB Internal Database URL**
     - Use **Internal URL** if database is in same region
     - Use **External URL** if database is in different region
   - Format: `mongodb://username:password@host:port/database`

2. **Remove MongoDB Atlas Variables** (if any)
   - Remove any old Atlas-specific environment variables

---

## 📁 **PART 2: File Storage Migration (Cloudinary → Render Persistent Disk)**

### **Step 1: Enable Persistent Disk on Render**

1. **Go to Your Web Service**
   - Navigate to your `spm-backend` service in Render dashboard

2. **Add Persistent Disk**
   - Scroll to **"Disks"** section
   - Click **"Add Disk"**
   - Configure:
     - **Name**: `uploads-disk`
     - **Mount Path**: `/app/uploads` (or `/app/data/uploads`)
     - **Size**: Start with 10GB (you can increase later)
   - Click **"Create Disk"**

3. **Note the Mount Path**
   - The persistent disk will be mounted at `/app/uploads`
   - Files stored here will persist across deployments

### **Step 2: Update Code to Use Local Storage**

The code has already been updated to:
- ✅ Use local file storage when Cloudinary is not configured
- ✅ Serve static files from `/app/uploads` directory
- ✅ Remove Cloudinary dependencies

### **Step 3: Migrate Files from Cloudinary (Optional)**

If you need to migrate existing files from Cloudinary:

1. **Export File URLs from Database**
   ```javascript
   // Run this script to get all Cloudinary URLs
   // Save as: export-cloudinary-urls.js
   const mongoose = require('mongoose');
   const Property = require('./models/Property');
   
   // Connect to your database
   mongoose.connect(process.env.MONGO_URI);
   
   // Export all Cloudinary URLs
   Property.find({}).then(properties => {
     properties.forEach(prop => {
       if (prop.photos && prop.photos.length > 0) {
         prop.photos.forEach(photo => {
           if (photo.includes('cloudinary.com')) {
             console.log(photo);
           }
         });
       }
     });
   });
   ```

2. **Download Files from Cloudinary**
   - Use Cloudinary API or dashboard to download files
   - Save them to your local machine

3. **Upload to Render (After Deployment)**
   - Once your Render service is updated, upload files via the application
   - Or use Render's file upload feature if available

### **Step 4: Update Environment Variables**

1. **Remove Cloudinary Variables**
   - Go to your `spm-backend` service → **Environment** tab
   - Remove:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `USE_CLOUD_STORAGE`

2. **Ensure Local Storage is Enabled**
   - The code will automatically use local storage when Cloudinary is not configured
   - No additional environment variables needed

---

## 🔧 **PART 3: Update Render Configuration**

### **Step 1: Update render.yaml**

The `render.yaml` file has been updated to include:
- ✅ MongoDB database service reference
- ✅ Persistent disk configuration
- ✅ Environment variables for MongoDB

### **Step 2: Deploy Updated Configuration**

1. **Commit Changes**
   ```bash
   git add render.yaml
   git add server/src/middleware/cloudUpload.js
   git add server/src/middleware/documentUpload.js
   git add server/src/app.js
   git commit -m "Migrate to Render MongoDB and persistent disk storage"
   git push origin main
   ```

2. **Render Auto-Deploy**
   - Render will automatically detect the changes
   - It will deploy the updated configuration

3. **Verify Deployment**
   - Check Render dashboard for deployment status
   - Verify MongoDB connection in logs
   - Test file uploads

---

## ✅ **PART 4: Verification & Testing**

### **Step 1: Verify Database Connection**

1. **Check Backend Logs**
   - Go to Render dashboard → Your service → **Logs**
   - Look for: `✅ MongoDB connected successfully`
   - Should show: `📊 Database: smart_property_manager`

2. **Test Database Operations**
   - Log into your application
   - Create a test property
   - Verify it appears in Render MongoDB

### **Step 2: Verify File Storage**

1. **Test File Upload**
   - Upload a property image
   - Check logs for: `💾 Using local file storage for images`
   - Verify file is accessible

2. **Check Persistent Disk**
   - Files should persist after service restart
   - Upload a file, restart service, verify file still exists

3. **Verify File Serving**
   - Access uploaded image via URL
   - Should see image in browser

### **Step 3: Data Verification**

1. **Compare Data Counts**
   ```bash
   # Count documents in old Atlas database
   # Compare with Render MongoDB
   ```

2. **Spot Check Data**
   - Verify a few properties exist
   - Check user accounts
   - Verify leases and payments

---

## 🚨 **Troubleshooting**

### **Issue: MongoDB Connection Failed**

**Solution:**
- Verify connection string is correct
- Check if using Internal vs External URL
- Ensure database is in "Available" status
- Check network/firewall settings

### **Issue: Files Not Persisting**

**Solution:**
- Verify persistent disk is mounted correctly
- Check mount path matches code (`/app/uploads`)
- Ensure disk size is sufficient
- Check file permissions

### **Issue: Files Not Accessible**

**Solution:**
- Verify static file serving is configured
- Check file paths in database
- Ensure backend is serving files correctly
- Check CORS settings

### **Issue: Import Failed**

**Solution:**
- Verify connection string format
- Check database credentials
- Ensure target database exists
- Check network connectivity

---

## 📊 **Cost Comparison**

### **Before (External Services)**
- MongoDB Atlas: ~$9-25/month (depending on tier)
- Cloudinary: Free tier (limited) or ~$89/month
- **Total: ~$98-114/month**

### **After (Render Organization Plan)**
- Render MongoDB: Included in plan
- Persistent Disk: Included in plan
- **Total: ~$0 additional cost** (part of organization plan)

---

## 🎯 **Migration Checklist**

- [ ] Create Render MongoDB database
- [ ] Export data from MongoDB Atlas
- [ ] Import data to Render MongoDB
- [ ] Update MONGO_URI environment variable
- [ ] Add persistent disk to web service
- [ ] Update code (already done)
- [ ] Remove Cloudinary environment variables
- [ ] Deploy updated configuration
- [ ] Verify database connection
- [ ] Test file uploads
- [ ] Verify file persistence
- [ ] Test full application functionality
- [ ] Update documentation
- [ ] Monitor for 24-48 hours
- [ ] Cancel MongoDB Atlas subscription (after verification)
- [ ] Cancel Cloudinary subscription (after verification)

---

## 📝 **Next Steps After Migration**

1. **Monitor Performance**
   - Check Render dashboard metrics
   - Monitor database performance
   - Watch disk usage

2. **Backup Strategy**
   - Set up automated backups for Render MongoDB
   - Consider regular database exports

3. **Optimization**
   - Monitor disk usage
   - Consider file cleanup routines
   - Optimize database queries

---

## 🆘 **Need Help?**

If you encounter issues:
1. Check Render documentation: https://render.com/docs
2. Check service logs in Render dashboard
3. Verify all environment variables are set correctly
4. Ensure all code changes are deployed

---

**Migration completed successfully! 🎉**


