# Navicat Connection Guide - Render MongoDB Database

This guide explains how to connect Navicat to your Render-hosted MongoDB database.

## Prerequisites
- Navicat installed on your computer
- Access to your Render account
- Your Render backend service (`spm-backend`) must be running

## Connection Method: SSH Tunnel

Since your MongoDB is a **private service** on Render, it's not directly accessible from the internet. You need to use an SSH tunnel through your backend service.

---

## Step-by-Step Instructions

### Step 1: Get SSH Connection Details from Render

1. Log in to your Render dashboard: https://dashboard.render.com
2. Navigate to your **backend service** (`spm-backend`)
3. Click on the **"Shell"** tab (or look for SSH connection instructions)
4. Render will provide you with SSH connection details:
   - **SSH Host:** Usually something like `ssh.render.com` or `srv-xxxxx.render.com`
   - **SSH Port:** Usually `22`
   - **SSH Username:** Your Render username
   - **SSH Key:** You may need to download or use an existing SSH key

**Note:** If you don't have SSH access set up, Render may provide instructions to enable it or use their web-based shell.

### Step 2: Configure Navicat Connection

1. Open Navicat
2. Click **"Connection"** → **"MongoDB"** (or click the "New Connection" button and select MongoDB)
3. A connection settings window will open

### Step 3: Configure SSH Tunnel Settings

1. In the connection window, go to the **"SSH"** tab
2. Check the box **"Use SSH Tunnel"**
3. Fill in the SSH connection details:
   - **Host:** Your Render SSH host (from Step 1)
   - **Port:** `22` (default SSH port)
   - **User Name:** Your Render username
   - **Authentication Method:** Select **"Public Key"**
   - **Private Key:** Click the "..." button and browse to your SSH private key file
     - If you don't have a key, you may need to generate one or use Render's provided key
     - The key file is usually a `.pem` or `.ppk` file

### Step 4: Configure MongoDB Connection Settings

1. Go to the **"General"** tab (or main connection tab)
2. Fill in the MongoDB connection details:
   - **Connection Name:** Give it a name (e.g., "Render MongoDB - SPM")
   - **Host:** `spm-mongodb` (This is the internal Render service name)
   - **Port:** `27017` (MongoDB default port)
   - **Database:** `smart_property_manager` (Your database name)
   - **Authentication:** 
     - If MongoDB has authentication enabled, enter:
       - **User Name:** (if configured)
       - **Password:** (if configured)
     - If no authentication is set up, leave these blank

### Step 5: Test and Save Connection

1. Click **"Test Connection"** to verify the connection works
2. If successful, click **"OK"** to save the connection
3. If it fails, check the error message and verify:
   - SSH credentials are correct
   - SSH key file is valid
   - Backend service is running on Render
   - MongoDB service is running

### Step 6: Connect to Database

1. Double-click the connection in Navicat to connect
2. Once connected, you should see:
   - Database: `smart_property_manager`
   - Collections: `users`, `properties`, `payments`, `invoices`, `leases`

---

## Alternative Method: Using Render Shell (Command Line)

If SSH tunneling doesn't work, you can access MongoDB directly through Render's shell:

1. Go to your Render dashboard
2. Navigate to `spm-backend` service
3. Click **"Shell"** tab
4. In the shell, run:
   ```bash
   mongosh "mongodb://spm-mongodb:27017/smart_property_manager"
   ```
5. You can now run MongoDB commands directly

---

## Troubleshooting

### Issue: SSH Connection Failed
**Solutions:**
- Verify your Render SSH host and username are correct
- Ensure your SSH key file is valid and has correct permissions (600)
- Check that your backend service is running on Render
- Try using Render's web-based shell first to verify access

### Issue: MongoDB Connection Failed
**Solutions:**
- Verify the host is `spm-mongodb` (internal Render service name)
- Check that port `27017` is correct
- Ensure database name is `smart_property_manager`
- Verify MongoDB service is running (check Render dashboard)

### Issue: Authentication Failed
**Solutions:**
- If MongoDB authentication is enabled, ensure credentials are correct
- Check if MongoDB requires authentication (it may not be configured)
- Verify user has access to the database

### Issue: Connection Timeout
**Solutions:**
- Ensure your backend service (`spm-backend`) is not sleeping
- Check Render service status in dashboard
- Verify network connectivity
- Try connecting during active hours (Render free tier services sleep after inactivity)

---

## Connection Details Summary

**SSH Tunnel:**
- Host: `ssh.render.com` or your Render SSH host
- Port: `22`
- Username: Your Render username
- Authentication: Public Key (SSH key file)

**MongoDB:**
- Host: `spm-mongodb` (internal Render service name)
- Port: `27017`
- Database: `smart_property_manager`
- Authentication: (May not be required)

---

## Important Notes

1. **Service Status:** Your backend service must be running for SSH tunneling to work. Free tier services on Render sleep after 15 minutes of inactivity.

2. **Security:** The MongoDB service is private and only accessible through the backend service. This is a security feature.

3. **Data Access:** Once connected, you can:
   - View all collections (users, properties, payments, invoices, leases)
   - Query and filter data
   - Export data
   - Run MongoDB commands

4. **Backup:** Always backup your data before making changes directly in the database.

---

## Quick Reference

**Database Name:** `smart_property_manager`

**Collections:**
- `users` - All user accounts (admins, owners, tenants)
- `properties` - All properties and units
- `payments` - All payment records
- `invoices` - All invoice records
- `leases` - All lease agreements

**Common Queries:**
```javascript
// Count all documents
db.users.countDocuments()
db.properties.countDocuments()
db.payments.countDocuments()

// Find all tenants
db.users.find({ role: 'TENANT' })

// Find all properties
db.properties.find()

// Find all payments
db.payments.find()
```

---

**End of Guide**


