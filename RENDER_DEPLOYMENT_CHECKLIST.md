# ✅ Render Deployment Checklist

## 🗄️ **Database Setup**
- [ ] Create MongoDB Atlas account
- [ ] Create new cluster (free tier)
- [ ] Create database user with read/write permissions
- [ ] Whitelist all IP addresses (0.0.0.0/0)
- [ ] Get connection string
- [ ] Test database connection

## 🔧 **Environment Variables Setup**

### Backend Service
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/spm_production`
- [ ] `JWT_SECRET=your-super-secret-jwt-key-here`
- [ ] `STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here` (optional)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here` (optional)
- [ ] `AUTO_INVOICES_CRON_ENABLED=true`
- [ ] `AUTO_INVOICES_CRON_SCHEDULE=0 0 1 * *`
- [ ] `CORS_ORIGIN=https://spm-frontend.onrender.com`

### Frontend Service
- [ ] `VITE_API_URL=https://spm-backend.onrender.com`

## 🚀 **Render Deployment**

### Backend Service
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set name: `spm-backend`
- [ ] Set environment: `Node`
- [ ] Set build command: `cd server && npm install`
- [ ] Set start command: `cd server && npm start`
- [ ] Set plan: Free (or paid)
- [ ] Add all environment variables
- [ ] Deploy service

### Frontend Service
- [ ] Create new Static Site
- [ ] Connect GitHub repository
- [ ] Set name: `spm-frontend`
- [ ] Set build command: `cd client && npm install && npm run build`
- [ ] Set publish directory: `client/dist`
- [ ] Set plan: Free
- [ ] Add environment variables
- [ ] Deploy service

## 🧪 **Testing**

### Backend Testing
- [ ] Test health endpoint: `https://spm-backend.onrender.com/api/health`
- [ ] Test database connection
- [ ] Test authentication endpoints
- [ ] Test file uploads

### Frontend Testing
- [ ] Visit frontend URL: `https://spm-frontend.onrender.com`
- [ ] Test login functionality
- [ ] Test all major features
- [ ] Test image uploads
- [ ] Test PDF generation

### Integration Testing
- [ ] Test API communication between frontend and backend
- [ ] Test CORS configuration
- [ ] Test authentication flow
- [ ] Test file uploads and downloads

## 🔐 **Security**

- [ ] Verify HTTPS is enabled
- [ ] Test authentication and authorization
- [ ] Verify CORS configuration
- [ ] Test rate limiting (if implemented)
- [ ] Verify environment variables are secure

## 📊 **Database Seeding**

- [ ] Run seed script in production
- [ ] Verify admin account creation
- [ ] Verify sample data creation
- [ ] Test login with default credentials

## 🎯 **Final Verification**

- [ ] All services are running
- [ ] Database is connected
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Authentication works
- [ ] File uploads work
- [ ] PDF generation works
- [ ] All features are functional

## 🚨 **Troubleshooting**

### Common Issues
- [ ] CORS errors - Check CORS_ORIGIN
- [ ] Database connection - Verify MONGO_URI
- [ ] Build failures - Check Node.js version
- [ ] Environment variables - Verify all are set
- [ ] File uploads - Check static file serving
- [ ] PDF generation - Check file permissions

### Debug Steps
- [ ] Check Render service logs
- [ ] Verify environment variables
- [ ] Test database connectivity
- [ ] Check CORS configuration
- [ ] Verify file permissions

## 🎉 **Success Criteria**

- [ ] Backend service is running and healthy
- [ ] Frontend service is accessible
- [ ] Database is connected and seeded
- [ ] All features are working
- [ ] Authentication is functional
- [ ] File uploads/downloads work
- [ ] PDF generation works
- [ ] No critical errors in logs

## 📞 **Support Resources**

- [ ] Render documentation
- [ ] MongoDB Atlas documentation
- [ ] Application logs
- [ ] Environment variable verification
- [ ] Network connectivity tests

---

**Deployment Status**: ⏳ In Progress
**Backend URL**: `https://spm-backend.onrender.com`
**Frontend URL**: `https://spm-frontend.onrender.com`
