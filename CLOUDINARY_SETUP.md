# Cloudinary Setup Guide for Image Storage

## 🎯 **Why Cloudinary?**

Your property images were disappearing because Render's filesystem is **ephemeral**. Every deploy or restart loses uploaded files. Cloudinary provides **permanent cloud storage** for free!

---

## ✅ **Step 1: Create Cloudinary Account**

1. Go to https://cloudinary.com/users/register_free
2. Sign up with your email
3. Verify your email
4. You'll be taken to the dashboard

---

## 📋 **Step 2: Get Your Credentials**

On the Cloudinary Dashboard, you'll see:

```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123
```

**Copy these values!** You'll need them in the next step.

---

## 🔧 **Step 3: Add Environment Variables to Render**

### Backend Service:

1. Go to your Render dashboard
2. Click on your **backend service** (`promanager-lite-1`)
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add these THREE variables:

| Key | Value | Example |
|-----|-------|---------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | `dxyz123abc` |
| `CLOUDINARY_API_KEY` | Your API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Your API secret | `abcdefghijklmnopqrstuvwxyz123` |

6. Click **"Save Changes"**
7. Service will automatically redeploy

---

## 🏠 **Step 4: Local Development (Optional)**

For local development with Docker, add to your `.env` file:

```env
# Cloudinary Configuration (optional for local dev)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
USE_CLOUD_STORAGE=false  # Set to 'true' to test Cloudinary locally
```

**Note:** Local development will use Docker volumes by default (which is fine for testing).

---

## 🚀 **How It Works**

### Automatic Environment Detection:

```javascript
// Production (Render) → Uses Cloudinary
NODE_ENV=production → Cloudinary ✅

// Local Development (Docker) → Uses local storage
NODE_ENV=development → Docker volumes ✅
```

### What Happens When You Upload:

**Production (Render):**
1. User selects image
2. Image uploads to **Cloudinary servers**
3. Cloudinary returns full URL: `https://res.cloudinary.com/your_cloud/image/upload/v123/spm/properties/image.jpg`
4. URL saved in database
5. ✅ **Image persists forever** - never disappears!

**Local Development (Docker):**
1. User selects image
2. Image saves to `/app/uploads/properties/` (Docker volume)
3. Returns relative URL: `/uploads/properties/image-123.png`
4. URL saved in database
5. ✅ **Image persists** in Docker volume

---

## 📊 **Cloudinary Free Tier Benefits:**

| Feature | Free Tier |
|---------|-----------|
| Storage | 25 GB |
| Bandwidth | 25 GB/month |
| Transformations | 25,000/month |
| Admin API | 500 calls/hour |
| Cost | $0 - **Completely FREE!** |

**This is more than enough for a property management system!**

---

## 🎨 **Image Features You Get:**

### Automatic Optimization:
- Images are automatically compressed
- Optimal format delivery (WebP for modern browsers)
- Responsive images
- Fast CDN delivery worldwide

### Security:
- Secure HTTPS delivery
- Access control
- Signed URLs (if needed)

### Transformations:
- Resize images on-the-fly
- Crop, rotate, adjust quality
- Watermarks
- And more!

---

## 🧪 **Testing After Setup:**

### Step 1: Wait for Render to Deploy
After adding environment variables, wait 2-3 minutes for redeployment.

### Step 2: Upload a Property Image
1. Go to Properties page
2. Click "Add Property"
3. Fill in details
4. Upload an image
5. Submit

### Step 3: Verify in Cloudinary
1. Go to Cloudinary dashboard
2. Click "Media Library"
3. Navigate to `spm/properties` folder
4. ✅ Your image should be there!

### Step 4: Test Persistence
1. Make a note of the property with image
2. Trigger a Render redeploy (push any small change to GitHub)
3. Wait for deployment
4. Refresh properties page
5. ✅ **Image should still be there!** (Not disappeared like before)

---

## 🔍 **Troubleshooting:**

### Images Still Using Local Storage?

Check backend logs in Render:
- ✅ Should see: `📸 Using Cloudinary cloud storage for images`
- ❌ If you see: `💾 Using local file storage for images` → Environment variables not set correctly

### Images Not Uploading?

1. Check Cloudinary credentials are correct
2. Check Render logs for errors
3. Verify API Key and Secret (no extra spaces)
4. Make sure you saved environment variables in Render

### Want to Test Cloudinary Locally?

1. Add Cloudinary credentials to local `.env`
2. Set `USE_CLOUD_STORAGE=true`
3. Restart Docker: `docker compose down && docker compose up`
4. Upload an image
5. Check Cloudinary dashboard - image should appear there!

---

## 📝 **Current Code Changes:**

### ✅ Already Implemented:

1. **server/package.json** - Cloudinary dependencies added
2. **server/src/middleware/cloudUpload.js** - Hybrid upload middleware (auto-detects environment)
3. **server/src/routes/properties.js** - Updated to handle both local and cloud URLs
4. **client/src/pages/PropertiesPage.jsx** - Updated to display both local and cloud images

### How to Deploy:

```bash
git add .
git commit -m "Add Cloudinary cloud storage for images"
git push
```

Render will auto-deploy and start using Cloudinary!

---

## 🎉 **Benefits Summary:**

| Before (Local Storage) | After (Cloudinary) |
|------------------------|---------------------|
| ❌ Images disappear on deploy | ✅ Images persist forever |
| ❌ Lost on container restart | ✅ Never lost |
| ❌ No CDN | ✅ Global CDN delivery |
| ❌ No optimization | ✅ Automatic optimization |
| ❌ Limited to container size | ✅ 25 GB free storage |

---

## 🚀 **Next Steps:**

1. ✅ Create Cloudinary account
2. ✅ Get credentials
3. ✅ Add to Render environment variables
4. ✅ Wait for auto-deploy
5. ✅ Test image upload
6. ✅ Verify images persist after refresh
7. 🎉 **Enjoy permanent image storage!**

---

**Your images will NEVER disappear again!** 🎨✨

