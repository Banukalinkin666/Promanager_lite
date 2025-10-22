# Image Upload Debugging Guide

## 🔍 **How to Debug Image Issues**

I've added comprehensive console logging to help diagnose image upload and display issues.

---

## 📋 **What to Check:**

### **Step 1: Open Browser Console**

1. Open the property page
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Click **"Edit"** on a property

### **Step 2: Look for These Logs:**

#### **When Editing Property:**
```javascript
📝 Editing property: { ...property data... }
📸 Property photos: ["/uploads/properties/image.png"] or ["https://res.cloudinary.com/..."]
📋 Form data images set to: [...]
```

#### **When getImageUrl is Called:**
```javascript
// For Cloud URLs (Cloudinary):
getImageUrl: Full URL detected: https://res.cloudinary.com/abc/image/upload/v123/spm/properties/xyz.png

// For Local URLs:
getImageUrl: Local path, constructing URL: {
  imagePath: "/uploads/properties/image.png",
  fullUrl: "http://localhost:4000/uploads/properties/image.png"
}

// For Empty/Missing:
getImageUrl: No image path provided
```

#### **When Image Loads Successfully:**
```javascript
✅ Image loaded successfully: /uploads/properties/image.png
```

#### **When Image Fails to Load:**
```javascript
❌ Image failed to load
Original path: /uploads/properties/image.png
Attempted URL: http://localhost:4000/uploads/properties/image.png
API Base URL: http://localhost:4000
VITE_API_URL: http://localhost:4000/api
```

---

## 🐛 **Common Issues & Solutions:**

### **Issue 1: "Image not found" Placeholder Appears**

**What Console Shows:**
```
❌ Image failed to load
Original path: /uploads/properties/image-123.png
Attempted URL: http://localhost:4000/uploads/properties/image-123.png
```

**Possible Causes:**

1. **File doesn't exist on server**
   - **Solution:** Re-upload the image

2. **Wrong API URL**
   - **Check:** `VITE_API_URL` environment variable
   - **Solution:** Set to correct backend URL in Render

3. **Cloudinary not configured**
   - **Check:** Backend logs for "📸 Using Cloudinary" or "💾 Using local"
   - **Solution:** Add Cloudinary credentials (see CLOUDINARY_SETUP.md)

4. **CORS issue**
   - **Check:** Network tab for 404 or CORS errors
   - **Solution:** Add frontend URL to backend CORS config

---

### **Issue 2: Images Upload but Don't Show in Preview**

**What Console Shows:**
```
✅ Uploading images...
✅ Images uploaded successfully
📋 Form data images set to: []  ← EMPTY!
```

**Cause:** Images not added to form state

**Solution:**
```javascript
// Check handleImageUpload response
console.log('Upload response:', response.data.imageUrls);

// Should see array of URLs like:
// ["/uploads/properties/image-123.png"]
// or
// ["https://res.cloudinary.com/..."]
```

---

### **Issue 3: Images Work First Time but Not After Edit**

**What Console Shows:**
```
📝 Editing property: {...}
📸 Property photos: undefined  ← PROBLEM!
```

**Cause:** Backend not returning `photos` field

**Solution:** Check backend `/api/properties/:id` endpoint

---

### **Issue 4: Local Images Work, Cloudinary Images Don't**

**What Console Shows:**
```
getImageUrl: Full URL detected: https://res.cloudinary.com/...
❌ Image failed to load
```

**Possible Causes:**

1. **Invalid Cloudinary URL**
   - Copy the URL from console
   - Paste in new browser tab
   - If it doesn't load, Cloudinary credentials are wrong

2. **Cloudinary account issue**
   - Check Cloudinary dashboard
   - Verify images are uploaded
   - Check quota/limits

---

### **Issue 5: "Image Loading" Stays Forever**

**What Console Shows:**
```
(No logs at all)
```

**Cause:** Image `onLoad` and `onError` never fired

**Solution:**
- Check Network tab
- Look for blocked requests
- Check for JavaScript errors

---

## 📊 **Diagnostic Checklist:**

Run through this checklist and note the results:

```
□ Open browser console
□ Edit a property
□ Check: "📝 Editing property" appears
□ Check: "📸 Property photos" shows array with URLs
□ Check: "📋 Form data images set to" shows same URLs
□ Check: Images appear in grid
□ Check: "✅ Image loaded successfully" appears
□ If error: Note the "❌ Image failed to load" details
□ Check Network tab for image request
□ Check if request is 404, 500, or CORS error
□ Upload new image
□ Check: "Uploading X image(s)..." toast
□ Check: Upload response in console
□ Check: "X image(s) uploaded successfully!" toast
□ Check: Images appear in preview
```

---

## 🔧 **Quick Fixes:**

### **Fix 1: Clear Cache**
```
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try again
```

### **Fix 2: Verify Cloudinary**
```bash
# Check backend logs in Render for:
📸 Using Cloudinary cloud storage for images

# OR
💾 Using local file storage for images
```

### **Fix 3: Check Environment Variables**
```javascript
// In browser console, run:
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);

// Should show:
// Production: https://promanager-lite-1.onrender.com/api
// Local: http://localhost:4000/api
```

### **Fix 4: Test Image URL Directly**
```
1. Copy the "Attempted URL" from console error
2. Paste in new browser tab
3. If it loads → frontend issue
4. If it doesn't load → backend/storage issue
```

---

## 📸 **Expected Console Output (Success):**

### **When Editing Property with Images:**
```
📝 Editing property: { title: "My Property", photos: ["/uploads/properties/image-123.png"] }
📸 Property photos: ["/uploads/properties/image-123.png"]
📋 Form data images set to: ["/uploads/properties/image-123.png"]
getImageUrl: Local path, constructing URL: {
  imagePath: "/uploads/properties/image-123.png",
  fullUrl: "http://localhost:4000/uploads/properties/image-123.png"
}
✅ Image loaded successfully: /uploads/properties/image-123.png
```

### **When Uploading New Images:**
```
Uploading images: [File objects]
Upload response: {
  imageUrls: ["/uploads/properties/image-456.png"]
}
✅ Image loaded successfully: /uploads/properties/image-456.png
```

---

## 🎯 **What to Send Me:**

If issues persist, send me these console logs:

1. **The "📝 Editing property" log** (full object)
2. **The "📸 Property photos" log**
3. **Any "❌ Image failed to load" errors** (all 5 lines)
4. **Network tab screenshot** showing the failed image request
5. **Backend environment variable** `USE_CLOUD_STORAGE` value

---

## 🔍 **Advanced Debugging:**

### **Check Actual Image URLs in Database:**

```javascript
// In browser console after loading properties:
const props = await fetch('https://promanager-lite-1.onrender.com/api/properties', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json());

console.log('Properties with photos:', props.map(p => ({
  title: p.title,
  photos: p.photos
})));
```

### **Check Upload API Response:**

```javascript
// In browser console, in Network tab:
// 1. Filter by "upload-images"
// 2. Click the request
// 3. Check Response tab
// Should see: { imageUrls: ["..."] }
```

---

## ✅ **After Deployment:**

1. Wait 2-3 minutes for Render to deploy
2. Hard refresh the page (Ctrl+Shift+R)
3. Open console (F12)
4. Edit a property
5. **Copy all console logs and send to me**

I've added detailed logging to help us identify exactly where the issue is!

---

**The debugging version is deploying now. Please wait 2-3 minutes, then check the console logs and let me know what you see!** 🔍

