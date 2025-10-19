#!/bin/bash

# Smart Property Manager - Render Deployment Script
# This script helps automate the deployment process

echo "🚀 Smart Property Manager - Render Deployment Helper"
echo "=================================================="

echo ""
echo "📋 PRE-DEPLOYMENT CHECKLIST:"
echo "1. ✅ You're logged into Render"
echo "2. ✅ You have a GitHub repository with your code"
echo "3. ✅ You have a MongoDB Atlas account"
echo ""

read -p "Do you have all the above ready? (y/n): " ready
if [ "$ready" != "y" ]; then
    echo "Please complete the prerequisites first!"
    exit 1
fi

echo ""
echo "🗄️  STEP 1: MongoDB Atlas Setup"
echo "================================"
echo "1. Go to: https://cloud.mongodb.com"
echo "2. Create a new cluster (Free tier)"
echo "3. Create database user (save credentials!)"
echo "4. Add IP address: 0.0.0.0/0 (Allow from anywhere)"
echo "5. Get connection string"
echo ""

read -p "Press Enter when MongoDB Atlas is ready..."

echo ""
echo "🔧 STEP 2: Backend Service Deployment"
echo "===================================="
echo "1. Go to Render Dashboard"
echo "2. Click 'New' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Use these settings:"
echo "   - Name: spm-backend"
echo "   - Environment: Node"
echo "   - Build Command: cd server && npm install"
echo "   - Start Command: cd server && npm start"
echo "   - Plan: Free"
echo ""

echo "5. Add these Environment Variables:"
echo "   NODE_ENV = production"
echo "   PORT = 10000"
echo "   MONGO_URI = [Your MongoDB connection string]"
echo "   JWT_SECRET = $(openssl rand -hex 32)"
echo "   CORS_ORIGIN = https://spm-frontend.onrender.com"
echo "   AUTO_INVOICES_CRON_ENABLED = true"
echo "   AUTO_INVOICES_CRON_SCHEDULE = 0 0 1 * *"
echo ""

read -p "Press Enter when backend is deployed..."

echo ""
echo "🌐 STEP 3: Frontend Service Deployment"
echo "======================================"
echo "1. Go to Render Dashboard"
echo "2. Click 'New' → 'Static Site'"
echo "3. Connect your GitHub repository"
echo "4. Use these settings:"
echo "   - Name: spm-frontend"
echo "   - Build Command: cd client && npm install && npm run build"
echo "   - Publish Directory: client/dist"
echo "   - Plan: Free"
echo ""

echo "5. Add this Environment Variable:"
echo "   VITE_API_URL = https://spm-backend.onrender.com"
echo ""

read -p "Press Enter when frontend is deployed..."

echo ""
echo "🌱 STEP 4: Database Seeding"
echo "=========================="
echo "1. Go to your backend service in Render"
echo "2. Click 'Shell' or 'Console'"
echo "3. Run these commands:"
echo "   cd server"
echo "   node seed-production.js"
echo ""

read -p "Press Enter when database is seeded..."

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "🎯 Your Smart Property Manager is now live!"
echo "Backend: https://spm-backend.onrender.com"
echo "Frontend: https://spm-frontend.onrender.com"
echo ""
echo "🔑 Default Login Credentials:"
echo "Admin: admin@spm.test / password123"
echo "Owner: owner@spm.test / password123"
echo "Tenant: john.smith@email.com / password123"
echo ""
echo "🧪 Test your deployment:"
echo "1. Visit your frontend URL"
echo "2. Login with admin credentials"
echo "3. Test all features"
echo ""
echo "🎉 Congratulations! Your Smart Property Manager is live! 🚀"
