# Render Organization Plan Setup - Summary

## ✅ What Has Been Configured

### 1. **render.yaml** - Updated
- MongoDB private service configuration
- Backend service with persistent disk for file storage
- Frontend static site configuration
- All environment variables defined

### 2. **MongoDB Dockerfile** - Created
- `server/Dockerfile.mongo` - MongoDB 7 Docker image
- Configured for persistent disk storage

### 3. **Migration Scripts** - Created
- `server/scripts/migrate-file-urls.js` - Migrates Cloudinary URLs to local URLs
- Added to `package.json` as `npm run migrate-file-urls`

### 4. **Documentation** - Created
- `RENDER_ORGANIZATION_MIGRATION_GUIDE.md` - Complete migration guide
- `RENDER_QUICK_START.md` - Quick start guide

## 🚀 Next Steps

### Immediate Actions (Do These First):

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render Organization plan configuration"
   git push origin main
   ```

2. **Deploy on Render**
   - Option A: Use Blueprint (if render.yaml supports all services)
   - Option B: Create services manually (recommended for first time)

3. **Manual Service Creation** (Recommended):
   
   **MongoDB Service:**
   - Type: Private Service
   - Name: `spm-mongodb`
   - Environment: Docker
   - Dockerfile Path: `server/Dockerfile.mongo`
   - Plan: Starter
   - Add Disk: `mongodb-data` → `/data/db` → 10GB
   
   **Backend Service:**
   - Type: Web Service
   - Name: `spm-backend`
   - Environment: Node
   - Build: `cd server && npm install`
   - Start: `cd server && npm start`
   - Plan: Starter
   - Add Disk: `uploads-disk` → `/app/uploads` → 10GB
   - Set `MONGO_URI` (get from MongoDB service internal URL)
   
   **Frontend Service:**
   - Type: Static Site
   - Name: `spm-frontend`
   - Build: `cd client && npm install && npm run build`
   - Publish: `client/dist`
   - Set `VITE_API_URL`

### Important Notes:

1. **MongoDB Connection String**
   - After MongoDB service is created, Render will provide an internal URL
   - Format: `mongodb://spm-mongodb:27017/smart_property_manager`
   - Or use the full internal hostname from Render dashboard
   - Update `MONGO_URI` in backend environment variables

2. **Private Services**
   - MongoDB private service is NOT accessible from the internet
   - Use Render Shell or SSH tunnel to access for migrations
   - Services in same organization can communicate internally

3. **File Storage**
   - Files stored in `/app/uploads` (mounted persistent disk)
   - Served via Express static middleware at `/uploads/...`
   - No Cloudinary needed - set `USE_CLOUD_STORAGE=false`

4. **Environment Variables**
   - Set `BASE_URL` to your backend URL after deployment
   - Set `USE_CLOUD_STORAGE=false` to disable Cloudinary
   - Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secure

## 📋 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create MongoDB private service
- [ ] Create backend web service
- [ ] Create frontend static site
- [ ] Configure environment variables
- [ ] Verify MongoDB connection
- [ ] Test file uploads
- [ ] Migrate data from MongoDB Atlas
- [ ] Migrate files from Cloudinary
- [ ] Run URL migration script
- [ ] Test all functionality
- [ ] Set up custom domains (optional)
- [ ] Cancel old services (after verification)

## 💰 Cost Breakdown

**Monthly Costs:**
- Organization Plan: $29
- MongoDB Service: ~$7
- Backend Service: ~$7
- Frontend Service: Free
- Disks (20GB): ~$5
- **Total: ~$48/month**

**Savings vs Current:**
- MongoDB Atlas: $25-50/month → **Eliminated**
- Cloudinary: $25-50/month → **Eliminated**
- **Total Savings: $2-52/month**

## 🆘 Troubleshooting

### Can't Connect to MongoDB
- Check MongoDB service is running
- Verify `MONGO_URI` format
- Ensure services are in same organization
- Check MongoDB logs for errors

### Files Not Persisting
- Verify disk is mounted at `/app/uploads`
- Check disk size limit
- Verify directory permissions
- Check disk is attached to service

### Migration Issues
- Use Render Shell for MongoDB access
- Verify backup files are accessible
- Check service logs for errors
- Ensure MongoDB is ready before migrating

## 📚 Documentation Files

1. **RENDER_QUICK_START.md** - Quick setup guide
2. **RENDER_ORGANIZATION_MIGRATION_GUIDE.md** - Detailed migration steps
3. **RENDER_SETUP_SUMMARY.md** - This file (overview)

## 🎯 Success Criteria

You'll know migration is complete when:
- ✅ All services are running on Render
- ✅ Database connection works
- ✅ Files upload and serve correctly
- ✅ All data is migrated
- ✅ Application works as expected
- ✅ Old services can be cancelled

---

**Ready to deploy!** Follow the Quick Start guide to begin. 🚀

