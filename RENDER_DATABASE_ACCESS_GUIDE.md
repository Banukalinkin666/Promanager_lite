# How to Access MongoDB Database Through Render

This guide explains how to access your MongoDB database directly through Render's web interface.

---

## Method 1: Using Render Shell (Recommended)

### Step 1: Access Your Backend Service
1. Log in to Render Dashboard: https://dashboard.render.com
2. Navigate to your **Services** list
3. Click on **`spm-backend`** service

### Step 2: Open Shell
1. In the `spm-backend` service page, look for the **"Shell"** tab
2. Click on **"Shell"** or **"Open Shell"**
3. A terminal window will open in your browser

### Step 3: Connect to MongoDB
1. In the shell, type the following command:
   ```bash
   mongosh "mongodb://spm-mongodb:27017/smart_property_manager"
   ```
2. Press Enter
3. You should see a MongoDB shell prompt like: `smart_property_manager>`

### Step 4: Use MongoDB Commands
Now you can run MongoDB commands. Here are some useful commands:

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

### Issue: Command Not Found
**Solution:**
- Ensure `mongosh` is installed in the backend service
- Try using `mongo` instead of `mongosh` (older MongoDB versions)
- Check MongoDB version in your Dockerfile

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

**Common Commands:**
```javascript
show collections                    // List all collections
db.collectionName.find().pretty()   // View documents
db.collectionName.countDocuments()  // Count documents
db.collectionName.deleteMany({})    // Delete all documents
exit                                // Exit MongoDB shell
```

---

**End of Guide**

