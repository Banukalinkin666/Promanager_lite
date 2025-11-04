# Render Organization Plan - Quick Start Guide

## 🚀 What's Next After Buying Organization Plan

You've purchased the Render Organization plan! Here's what to do next:

## Step 1: Deploy Services (5 minutes)

### Option A: Using render.yaml (Recommended)
1. **Push your code to GitHub** (if not already done)
2. **Go to Render Dashboard** → New → Blueprint
3. **Connect your GitHub repository**
4. **Render will automatically detect `render.yaml`** and create all services
5. **Wait for deployment** (5-10 minutes)

### Option B: Manual Setup
Follow the detailed steps in `RENDER_ORGANIZATION_MIGRATION_GUIDE.md`

## Step 2: Configure Environment Variables

After services are created, update these in Render Dashboard:

### Backend Service (`spm-backend`)
1. Go to **Environment** tab
2. Set these variables:
   - `MONGO_URI` - Will be auto-set, but verify it's: `mongodb://spm-mongodb:27017/smart_property_manager`
   - `BASE_URL` - Set to your backend URL: `https://spm-backend.onrender.com`
   - `STRIPE_SECRET_KEY` - Add your Stripe key
   - `STRIPE_WEBHOOK_SECRET` - Add your webhook secret
   - `USE_CLOUD_STORAGE` - Set to `false`

### Frontend Service (`spm-frontend`)
1. Go to **Environment** tab
2. Set:
   - `VITE_API_URL` - Set to your backend URL: `https://spm-backend.onrender.com`

## Step 3: Verify Services Are Running

1. **Check MongoDB Service**:
   - Should show status: "Live"
   - Check logs for "MongoDB starting"

2. **Check Backend Service**:
   - Visit: `https://spm-backend.onrender.com/api/health`
   - Should return: `{ ok: true, ... }`

3. **Check Database Connection**:
   - Visit: `https://spm-backend.onrender.com/api/db-test`
   - Should show: `connected: true`

4. **Check Frontend**:
   - Visit your frontend URL
   - Should load your application

## Step 4: Migrate Your Data

### 4.1 Backup Current Data
```bash
# Backup MongoDB Atlas
npm run backup-database

# Or use mongodump
mongodump --uri="<YOUR_ATLAS_URI>" --out=./backups
```

### 4.2 Restore to Render MongoDB

**Important**: Render private services are not accessible from the internet. You have two options:

#### Option A: Using Render Shell (Easiest)
1. Go to MongoDB service → **Shell** tab
2. Use MongoDB tools there to restore data
3. Or use the restore script in Render Shell

#### Option B: Using SSH Tunnel
1. Set up SSH tunnel to Render service
2. Use mongorestore from your local machine

### 4.3 Verify Data
- Check backend logs
- Test API endpoints
- Verify data count matches

## Step 5: Migrate Files from Cloudinary

### 5.1 Disable Cloudinary
- Set `USE_CLOUD_STORAGE=false` in backend environment variables
- Restart backend service

### 5.2 Upload Files to Render
- Use your application's upload interface
- Or create a migration script to batch upload

### 5.3 Update Database URLs
```bash
# Run migration script
npm run migrate-file-urls
```

This will update all Cloudinary URLs to local URLs in your database.

## Step 6: Test Everything

### ✅ Test Checklist
- [ ] Database connection works
- [ ] Can create/edit properties
- [ ] Can upload property images
- [ ] Images are accessible via `/uploads/properties/...`
- [ ] Can upload documents
- [ ] Documents are accessible via `/uploads/documents/...`
- [ ] Data persists after service restart
- [ ] Frontend can connect to backend
- [ ] All features work as expected

## Step 7: Update Your Application URLs

1. **Update Frontend API URL**:
   - Set `VITE_API_URL` to your backend URL
   - Redeploy frontend

2. **Update Backend Base URL**:
   - Set `BASE_URL` to your backend URL
   - Redeploy backend

## Step 8: Set Up Custom Domains (Optional)

1. **Backend Custom Domain**:
   - Go to Backend Service → Settings → Custom Domains
   - Add: `api.yourdomain.com`
   - Update DNS records

2. **Frontend Custom Domain**:
   - Go to Frontend Service → Settings → Custom Domains
   - Add: `app.yourdomain.com`
   - Update DNS records

## Common Issues & Solutions

### ❌ MongoDB Connection Failed
**Solution**: 
- Verify MongoDB service is running
- Check `MONGO_URI` format
- Ensure services are in same organization

### ❌ Files Not Uploading
**Solution**:
- Check disk is mounted at `/app/uploads`
- Verify disk has space
- Check directory permissions

### ❌ Files Not Accessible
**Solution**:
- Verify static middleware in `app.js`
- Check file paths are relative (`/uploads/...`)
- Ensure files exist in uploads directory

### ❌ Environment Variables Not Working
**Solution**:
- Redeploy service after changing env vars
- Check variable names match exactly
- Verify no typos in values

## Cost Monitoring

### Expected Monthly Costs
- **Organization Plan**: $29
- **MongoDB Service**: ~$7
- **Backend Service**: ~$7
- **Frontend Service**: Free
- **Disks (20GB)**: ~$5
- **Total**: ~$48/month

### Monitor Usage
- Check Render dashboard regularly
- Set up alerts for disk usage
- Monitor bandwidth usage

## Next Steps

1. ✅ Complete migration
2. ✅ Test all functionality
3. ✅ Monitor for 1 week
4. ✅ Cancel MongoDB Atlas
5. ✅ Cancel Cloudinary
6. ✅ Set up regular backups

## Need Help?

- **Render Docs**: https://render.com/docs
- **Render Support**: Priority support with Organization plan
- **Migration Guide**: See `RENDER_ORGANIZATION_MIGRATION_GUIDE.md`

---

**You're all set!** 🎉 Your Property Manager is now running on Render with everything in one place!

