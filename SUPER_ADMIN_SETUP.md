# Super Admin Account Setup Guide

## 🔐 Super Admin Credentials

**Email:** `bsoftkandy@gmail.com`  
**Password:** `Webmaet99@Smtk`

⚠️ **IMPORTANT:** These credentials are private and should not be shared or published anywhere in the system.

---

## 🚀 Setup Instructions

### Step 1: Create Super Admin Account

**Option A: Using API Endpoint (Recommended - Works Immediately)**

The API endpoint is already deployed! Simply make a POST request:

**Method 1: Using Browser Console (Easiest)**
1. Open your browser's Developer Console (F12)
2. Go to your Render backend URL (e.g., `https://spm-backend.onrender.com`)
3. In the console, paste and run:
```javascript
fetch('/api/create-super-admin', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Success:', data);
    alert('Super admin created! Check console for details.');
  })
  .catch(err => {
    console.error('❌ Error:', err);
    alert('Error: ' + err.message);
  });
```

**Method 2: Using curl (Terminal)**
```bash
curl -X POST https://spm-backend.onrender.com/api/create-super-admin
```

**Method 3: Using Postman or any HTTP client**
- Method: POST
- URL: `https://spm-backend.onrender.com/api/create-super-admin`
- No headers or body needed

**Option B: Direct Node.js in Render Shell (If API doesn't work)**

If the API endpoint doesn't work, you can run the code directly in the shell:

```bash
# In Render Web Shell, run this one-liner:
node -e "
import('mongoose').then(async (m) => {
  const mongoose = m.default;
  await mongoose.connect(process.env.MONGO_URI);
  const User = (await import('./src/models/User.js')).default;
  let user = await User.findOne({ email: 'bsoftkandy@gmail.com' });
  if (!user) {
    user = await User.create({
      name: 'Super Admin',
      email: 'bsoftkandy@gmail.com',
      passwordHash: await User.hashPassword('Webmaet99@Smtk'),
      role: 'SUPER_ADMIN',
      isActive: true,
      status: 'ACTIVE'
    });
    console.log('✅ Created:', user.email, user.role);
  } else {
    user.role = 'SUPER_ADMIN';
    user.passwordHash = await User.hashPassword('Webmaet99@Smtk');
    user.isActive = true;
    await user.save();
    console.log('✅ Updated:', user.email, user.role);
  }
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error('❌ Error:', err); process.exit(1); });
"
```

**Option C: Local Development**

For local development:

```bash
cd server
npm run create-super-admin
```

### Step 2: Verify Account Creation

After running the setup, you should see a JSON response:
```json
{
  "message": "Super admin created successfully!",
  "email": "bsoftkandy@gmail.com",
  "role": "SUPER_ADMIN",
  "id": "[user_id]"
}
```

### Step 3: Login to System

1. Go to your application login page
2. Enter credentials:
   - Email: `bsoftkandy@gmail.com`
   - Password: `Webmaet99@Smtk`
3. You should be logged in as Super Admin

### Step 4: Access Admin Panel

Once logged in, you'll see a new menu item **"Admin Panel"** in the sidebar (only visible to SUPER_ADMIN).

Click on it to access the full database management interface.

---

## 🎯 Super Admin Capabilities

The Super Admin account has **full unrestricted access** to:

### ✅ **Users Management**
- View all users (Admin, Owner, Tenant)
- Create new users
- Edit any user (including changing roles)
- Delete users
- Reset passwords

### ✅ **Properties Management**
- View all properties
- Create/edit/delete properties
- Manage property details
- Update property photos and documents

### ✅ **Units Management**
- View all units across all properties
- Edit unit details
- Delete units
- Update unit status

### ✅ **Leases Management**
- View all leases
- Create new leases
- Edit existing leases
- Terminate leases
- Delete leases

### ✅ **Payments Management**
- View all payments
- Create manual payments
- Edit payment records
- Delete payments

### ✅ **Invoices Management**
- View all invoices
- Create invoices
- Edit invoices
- Delete invoices

### ✅ **System Statistics**
- View comprehensive system statistics
- User counts by role
- Property and unit counts
- Lease, payment, and invoice statistics

---

## 🔒 Security Features

1. **Role-Based Access:** Only users with `SUPER_ADMIN` role can access the admin panel
2. **Bypass All Restrictions:** Super Admin bypasses all role-based restrictions in the system
3. **Full CRUD Operations:** Complete Create, Read, Update, Delete access to all data
4. **No Business Rules:** Super Admin operations are not subject to normal business logic restrictions

---

## 📋 Admin Panel Features

The Admin Panel provides:

1. **Tabbed Interface:**
   - Statistics Dashboard
   - Users Management
   - Properties Management
   - Units Management
   - Leases Management
   - Payments Management
   - Invoices Management

2. **Search Functionality:**
   - Search across all data fields
   - Real-time filtering

3. **CRUD Operations:**
   - Create new records
   - Edit existing records
   - Delete records
   - View detailed information

4. **Data Tables:**
   - Sortable columns
   - Responsive design
   - Dark mode support

---

## 🛠️ Troubleshooting

### Issue: Cannot create super admin

**Solution:**
- Ensure MongoDB is running and connected
- Check `MONGO_URI` environment variable
- Verify database connection in logs

### Issue: Cannot login with super admin credentials

**Solution:**
- Verify account was created successfully
- Check if account is active (`isActive: true`)
- Verify role is set to `SUPER_ADMIN`
- Run the create script again (it will update existing account)

### Issue: Admin Panel not visible

**Solution:**
- Verify user role is `SUPER_ADMIN` (not `ADMIN`)
- Check browser console for errors
- Ensure you're logged in with the super admin account
- Clear browser cache and reload

### Issue: Cannot access admin routes

**Solution:**
- Check backend logs for authentication errors
- Verify JWT token includes correct role
- Ensure `requireSuperAdmin` middleware is working
- Check API endpoint: `/api/admin/*`

---

## 📝 API Endpoints

All admin endpoints are prefixed with `/api/admin/`:

- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- Similar endpoints for: properties, units, leases, payments, invoices

All endpoints require:
- Valid JWT token
- `SUPER_ADMIN` role

---

## ⚠️ Important Notes

1. **Never share super admin credentials** publicly
2. **Use super admin account only for system administration**
3. **Regular users should use their assigned roles** (ADMIN, OWNER, TENANT)
4. **Super admin bypasses all business rules** - use with caution
5. **Keep super admin account secure** - change password if compromised

---

## 🔄 Updating Super Admin Password

To update the super admin password:

1. Login to admin panel
2. Go to Users tab
3. Find the super admin user (`bsoftkandy@gmail.com`)
4. Click Edit
5. Update the password field
6. Save

Or use the API directly:
```bash
curl -X PUT http://your-api/api/admin/users/[user_id] \
  -H "Authorization: Bearer [your_token]" \
  -H "Content-Type: application/json" \
  -d '{"password": "NewPassword123"}'
```

---

**Setup Complete! 🎉**

You now have full system administration capabilities through the Super Admin account.

