# How to Access MongoDB Database Through Render

This guide explains how to access your MongoDB database directly through Render's web interface.

---

## Method 1: Using Node.js Script (Recommended - Easiest)

**Note:** `mongosh` is not installed in the backend service. Use this Node.js script instead.

### Step 1: Access Your Backend Service
1. Log in to Render Dashboard: https://dashboard.render.com
2. Navigate to your **Services** list
3. Click on **`spm-backend`** service

### Step 2: Open Shell
1. In the `spm-backend` service page, look for the **"Shell"** tab
2. Click on **"Shell"** or **"Open Shell"**
3. A terminal window will open in your browser

### Step 3: Navigate to Server Directory
Type this command:
```bash
cd server
```

### Step 4: Run Database Access Script

**Important: Copy/Paste in Render Shell**

Render's web shell may not support standard copy/paste. Try:
- **Right-click** in the shell → Select "Paste"
- Or use `Ctrl + Shift + V` (Windows/Linux) or `Cmd + V` (Mac)
- Or type commands manually

**Available Commands:**

1. **Check Database Counts:**
   ```bash
   node scripts/db-access.js counts
   ```
   This shows counts for all collections (users, properties, payments, etc.)

2. **List All Users:**
   ```bash
   node scripts/db-access.js users
   ```
   Shows all users with their roles and status

3. **List All Properties:**
   ```bash
   node scripts/db-access.js properties
   ```
   Shows all properties with unit counts

4. **Clear All Tenant Users:**
   ```bash
   node scripts/db-access.js clear-tenants
   ```
   Deletes all users with role 'TENANT'

5. **Clear All Data (Except Admins):**
   ```bash
   node scripts/db-access.js clear-all
   ```
   Clears all properties, payments, invoices, leases, and non-admin users

### Example Output:
```
✅ Connected to MongoDB

📊 Database Counts:
──────────────────────────────────────────────────
Users: 15
  - Admins: 1
  - Owners: 2
  - Tenants: 12
Properties: 3
Payments: 45
Invoices: 30
Leases: 12

✅ Disconnected from MongoDB
```

---

## Method 2: Using MongoDB Shell (If mongosh is installed)

**Note:** This method requires `mongosh` to be installed. If you get "command not found", use Method 1 instead.

### Step 1-2: Same as Method 1

### Step 3: Install mongosh (if needed)
If `mongosh` is not available, you can try installing it:
```bash
apk add mongodb-tools  # For Alpine Linux
```
Or use Method 1 (Node.js script) which is easier.

### Step 4: Connect to MongoDB
```bash
mongosh "mongodb://spm-mongodb:27017/smart_property_manager"
```

### Step 5: Use MongoDB Commands
Here are some useful commands:

#### View All Collections
```javascript
show collections
```

#### Count Documents
```javascript
// Count all users
db.users.countDocuments()

// Count all properties
db.properties.countDocuments()

// Count all payments
db.payments.countDocuments()

// Count all leases
db.leases.countDocuments()

// Count all invoices
db.invoices.countDocuments()
```

#### View All Documents
```javascript
// View all users
db.users.find().pretty()

// View all properties
db.properties.find().pretty()

// View all payments
db.payments.find().pretty()
```

#### Find Specific Documents
```javascript
// Find all tenants
db.users.find({ role: 'TENANT' }).pretty()

// Find all admins
db.users.find({ role: 'ADMIN' }).pretty()

// Find a specific user by email
db.users.find({ email: 'user@example.com' }).pretty()

// Find all active properties
db.properties.find({}).pretty()
```

#### Delete Documents (Use with Caution!)
```javascript
// Delete all tenants (keep admins and owners)
db.users.deleteMany({ role: 'TENANT' })

// Delete all properties
db.properties.deleteMany({})

// Delete all payments
db.payments.deleteMany({})

// Delete all invoices
db.invoices.deleteMany({})

// Delete all leases
db.leases.deleteMany({})
```

#### Exit MongoDB Shell
```javascript
exit
```
or press `Ctrl + C`

---

## Method 2: Using Render Shell for MongoDB Service (If Available)

If Render provides direct shell access to the MongoDB service:

1. Go to your **Services** list
2. Click on **`spm-mongodb`** service
3. Look for **"Shell"** tab
4. Click **"Open Shell"**
5. You should be directly in MongoDB shell

**Note:** This method may not be available for private services. Use Method 1 if this doesn't work.

---

## Common Database Operations

### Check Current Database
```javascript
db.getName()
```

### Switch Database
```javascript
use smart_property_manager
```

### View Database Stats
```javascript
db.stats()
```

### View Collection Stats
```javascript
db.users.stats()
db.properties.stats()
db.payments.stats()
```

### Find and Format Results
```javascript
// Find with limit
db.users.find().limit(10).pretty()

// Find with sort
db.properties.find().sort({ title: 1 }).pretty()

// Find with filter
db.payments.find({ status: 'PENDING' }).pretty()

// Find with date range
db.payments.find({
  createdAt: {
    $gte: new Date('2025-01-01'),
    $lte: new Date('2025-12-31')
  }
}).pretty()
```

### Update Documents
```javascript
// Update a user
db.users.updateOne(
  { email: 'user@example.com' },
  { $set: { status: 'ACTIVE' } }
)

// Update multiple documents
db.payments.updateMany(
  { status: 'PENDING' },
  { $set: { status: 'SUCCEEDED' } }
)
```

### Delete Specific Documents
```javascript
// Delete a specific user
db.users.deleteOne({ email: 'user@example.com' })

// Delete payments for a specific property
db.payments.deleteMany({ 'metadata.propertyId': ObjectId('property_id_here') })
```

---

## Quick Data Check Commands

### Check All Data Counts
```javascript
db.users.countDocuments()
db.properties.countDocuments()
db.payments.countDocuments()
db.invoices.countDocuments()
db.leases.countDocuments()
```

### Check Users by Role
```javascript
db.users.countDocuments({ role: 'ADMIN' })
db.users.countDocuments({ role: 'OWNER' })
db.users.countDocuments({ role: 'TENANT' })
```

### Check Property Units
```javascript
// View all properties with unit counts
db.properties.find({}, { title: 1, 'units': 1 }).pretty()
```

### Check Payment Status
```javascript
db.payments.countDocuments({ status: 'SUCCEEDED' })
db.payments.countDocuments({ status: 'PENDING' })
db.payments.countDocuments({ status: 'FAILED' })
```

---

## Method 3: Using API Endpoints (Easiest - No Shell Needed)

You can access database information through your API endpoints without using the shell at all!

### Step 1: Get Your Backend URL
Your backend URL is: `https://spm-backend.onrender.com`

### Step 2: Use API Endpoints

**1. Check Database Counts:**
Open in your browser or use a tool like Postman:
```
https://spm-backend.onrender.com/api/data-counts
```

**2. Clear Property Data (via API):**
```
https://spm-backend.onrender.com/api/clear-property-data
```

**3. List All Users:**
```
https://spm-backend.onrender.com/api/count-users
```

**Note:** These endpoints may require authentication. If you get an error, you may need to:
- Log in to your application first
- Or use the Node.js script method (Method 1) which handles authentication automatically

---

## Clear All Data (Fresh Start)

**⚠️ WARNING: This will delete ALL data except admin users!**

```javascript
// Delete all tenants
db.users.deleteMany({ role: 'TENANT' })

// Delete all properties (this also deletes units)
db.properties.deleteMany({})

// Delete all payments
db.payments.deleteMany({})

// Delete all invoices
db.invoices.deleteMany({})

// Delete all leases
db.leases.deleteMany({})
```

**To verify deletion:**
```javascript
db.users.countDocuments()
db.properties.countDocuments()
db.payments.countDocuments()
db.invoices.countDocuments()
db.leases.countDocuments()
```

All should return `0` except `users` (which should only have admin accounts).

---

## Export Data

### Export Collection to JSON (via Shell)
```javascript
// This requires mongodump which may not be available in Render shell
// Alternative: Use the API endpoints to export data
```

**Better Alternative:** Use the system's export features:
- Go to Reports page in the web interface
- Use Export Excel/PDF features
- Or use API endpoints to get data

---

## Troubleshooting

### Issue: Copy/Paste Not Working in Shell
**Solutions:**
1. **Right-Click Method:**
   - Right-click in the shell window
   - Select "Paste" from the context menu
   
2. **Keyboard Shortcuts:**
   - Windows/Linux: Try `Ctrl + Shift + V` or `Shift + Insert`
   - Mac: Try `Cmd + V` or `Shift + Insert`
   
3. **Browser-Specific:**
   - Chrome: Right-click → Paste
   - Firefox: Right-click → Paste or `Shift + Insert`
   - Edge: Right-click → Paste or `Ctrl + Shift + V`
   
4. **Alternative:**
   - Type commands manually (most MongoDB commands are short)
   - Use a text editor to prepare commands, then type them
   - Use browser's developer console to test copy/paste first

5. **Enable Clipboard API (if available):**
   - Some browsers require permission for clipboard access
   - Check browser settings for clipboard permissions

### Issue: Shell Not Available
**Solution:**
- Ensure your backend service is running
- Check if your Render plan supports shell access
- Try refreshing the page

### Issue: MongoDB Connection Failed
**Solution:**
- Verify MongoDB service (`spm-mongodb`) is running
- Check service status in Render dashboard
- Ensure service name is correct: `spm-mongodb`

### Issue: Command Not Found (mongosh: not found)
**Solution:**
- `mongosh` is **not installed** in the backend service by default
- **Use Method 1 (Node.js script)** instead - it's easier and doesn't require mongosh
- If you really need mongosh, you can try installing it:
  ```bash
  apk add mongodb-tools  # For Alpine Linux (Node.js image)
  ```
  But the Node.js script method is recommended as it's already set up

### Issue: Permission Denied
**Solution:**
- MongoDB may not have authentication enabled (which is normal for private services)
- If authentication is required, check your MongoDB configuration

---

## Security Notes

1. **Private Service:** Your MongoDB is a private service, only accessible from within Render's network
2. **No External Access:** The database cannot be accessed directly from the internet
3. **Backend Access Only:** Only your backend service can connect to MongoDB
4. **Shell Access:** Render shell gives you access through the backend service

---

## Quick Reference

**Database Name:** `smart_property_manager`

**Connection String:** `mongodb://spm-mongodb:27017/smart_property_manager`

**Collections:**
- `users` - User accounts
- `properties` - Properties and units
- `payments` - Payment records
- `invoices` - Invoice records
- `leases` - Lease agreements

**Easiest Method - Node.js Script (Recommended):**

1. Open Render Shell for `spm-backend` service
2. Type: `cd server`
3. Run any of these commands:
   - `node scripts/db-access.js counts` - Show all counts
   - `node scripts/db-access.js users` - List all users
   - `node scripts/db-access.js properties` - List all properties
   - `node scripts/db-access.js clear-tenants` - Clear tenant users
   - `node scripts/db-access.js clear-all` - Clear all data except admins

**Alternative - MongoDB Shell Commands (if mongosh is available):**
```javascript
// Connect to database
mongosh "mongodb://spm-mongodb:27017/smart_property_manager"

// Quick checks
show collections
db.users.countDocuments()
db.properties.countDocuments()
db.payments.countDocuments()

// View data
db.users.find().pretty()
db.properties.find().pretty()

// Clear data (type carefully!)
db.users.deleteMany({ role: 'TENANT' })
db.properties.deleteMany({})
db.payments.deleteMany({})

// Exit
exit
```

**Tip for Copy/Paste Issues:**
- Right-click in shell → Select "Paste"
- Or use `Ctrl + Shift + V` (Windows/Linux) or `Cmd + V` (Mac)
- Or type commands manually (Node.js script commands are short and easy to type)

---

**End of Guide**

