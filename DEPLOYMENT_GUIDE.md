# 🚀 Smart Property Manager - Render Deployment Guide

## 📋 **Prerequisites**

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Repository**: Push your code to GitHub
4. **Stripe Account**: For payment processing (optional)

## 🗄️ **Step 1: Set Up MongoDB Atlas**

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier available)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/spm_production`

### 1.2 Database Configuration
- **Database Name**: `spm_production`
- **Collections**: Will be created automatically by the application

## 🔧 **Step 2: Configure Environment Variables**

### 2.1 Backend Environment Variables
Create these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spm_production
JWT_SECRET=your-super-secret-jwt-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
AUTO_INVOICES_CRON_ENABLED=true
AUTO_INVOICES_CRON_SCHEDULE=0 0 1 * *
CORS_ORIGIN=https://spm-frontend.onrender.com
```

### 2.2 Frontend Environment Variables
```
VITE_API_URL=https://spm-backend.onrender.com
```

## 🚀 **Step 3: Deploy to Render**

### 3.1 Deploy Backend Service
1. **New Web Service** in Render dashboard
2. **Connect Repository**: Link your GitHub repository
3. **Configuration**:
   - **Name**: `spm-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or paid for better performance)

### 3.2 Deploy Frontend Service
1. **New Static Site** in Render dashboard
2. **Connect Repository**: Same GitHub repository
3. **Configuration**:
   - **Name**: `spm-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/dist`
   - **Plan**: Free

## 🔐 **Step 4: Security Configuration**

### 4.1 CORS Configuration
Update `server/src/app.js`:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://spm-frontend.onrender.com',
  credentials: true
}));
```

### 4.2 JWT Secret
Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 **Step 5: Database Seeding**

### 5.1 Seed Production Database
After deployment, run the seed script:
```bash
# Connect to your Render service and run:
cd server && npm run seed
```

### 5.2 Default Admin Account
The seed script creates:
- **Admin**: `admin@spm.test` / `password123`
- **Owner**: `owner@spm.test` / `password123`
- **Sample Data**: Properties, units, and tenants

## 🔄 **Step 6: Update API URLs**

### 6.1 Frontend API Configuration
Update `client/src/api.js`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spm-backend.onrender.com';
```

### 6.2 Image URLs
Update image URLs in the frontend to use the backend URL:
```javascript
const imageUrl = `${API_BASE_URL}${imagePath}`;
```

## 🧪 **Step 7: Testing Deployment**

### 7.1 Health Check
Test your backend:
```bash
curl https://spm-backend.onrender.com/api/health
```

### 7.2 Frontend Access
Visit your frontend URL:
```
https://spm-frontend.onrender.com
```

### 7.3 Login Test
Use the default admin credentials:
- **Email**: `admin@spm.test`
- **Password**: `password123`

## 🛠️ **Step 8: Production Optimizations**

### 8.1 Performance
- Enable gzip compression
- Set up CDN for static assets
- Configure caching headers

### 8.2 Monitoring
- Set up error tracking (Sentry)
- Monitor database performance
- Set up uptime monitoring

### 8.3 Security
- Enable HTTPS
- Set up rate limiting
- Configure security headers

## 📝 **Step 9: Custom Domain (Optional)**

### 9.1 Add Custom Domain
1. Go to your Render service settings
2. Add your custom domain
3. Update CORS_ORIGIN environment variable
4. Update DNS records

## 🚨 **Troubleshooting**

### Common Issues:
1. **CORS Errors**: Check CORS_ORIGIN environment variable
2. **Database Connection**: Verify MongoDB Atlas connection string
3. **Build Failures**: Check Node.js version compatibility
4. **Environment Variables**: Ensure all required variables are set

### Debug Commands:
```bash
# Check logs
render logs --service spm-backend

# Check environment variables
render env list --service spm-backend
```

## 📞 **Support**

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration

## 🎉 **Success!**

Your Smart Property Manager is now live on Render! 🚀

**Backend URL**: `https://spm-backend.onrender.com`
**Frontend URL**: `https://spm-frontend.onrender.com`
