# Smart Property Manager - Render Deployment Helper (PowerShell)
# This script guides you through the deployment process

Write-Host "🚀 Smart Property Manager - Render Deployment Helper" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 PRE-DEPLOYMENT CHECKLIST:" -ForegroundColor Yellow
Write-Host "1. ✅ You're logged into Render" -ForegroundColor Green
Write-Host "2. ✅ You have a GitHub repository with your code" -ForegroundColor Green
Write-Host "3. ✅ You have a MongoDB Atlas account" -ForegroundColor Green
Write-Host ""

$ready = Read-Host "Do you have all the above ready? (y/n)"
if ($ready -ne "y") {
    Write-Host "Please complete the prerequisites first!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️  STEP 1: MongoDB Atlas Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "1. Go to: https://cloud.mongodb.com" -ForegroundColor White
Write-Host "2. Create a new cluster (Free tier)" -ForegroundColor White
Write-Host "3. Create database user (save credentials!)" -ForegroundColor White
Write-Host "4. Add IP address: 0.0.0.0/0 (Allow from anywhere)" -ForegroundColor White
Write-Host "5. Get connection string" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter when MongoDB Atlas is ready..."

Write-Host ""
Write-Host "🔧 STEP 2: Backend Service Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "1. Go to Render Dashboard" -ForegroundColor White
Write-Host "2. Click 'New' → 'Web Service'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Use these settings:" -ForegroundColor White
Write-Host "   - Name: spm-backend" -ForegroundColor Gray
Write-Host "   - Environment: Node" -ForegroundColor Gray
Write-Host "   - Build Command: cd server && npm install" -ForegroundColor Gray
Write-Host "   - Start Command: cd server && npm start" -ForegroundColor Gray
Write-Host "   - Plan: Free" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Add these Environment Variables:" -ForegroundColor Yellow
Write-Host "   NODE_ENV = production" -ForegroundColor Gray
Write-Host "   PORT = 10000" -ForegroundColor Gray
Write-Host "   MONGO_URI = [Your MongoDB connection string]" -ForegroundColor Gray
Write-Host "   JWT_SECRET = [Generate a random 32-character string]" -ForegroundColor Gray
Write-Host "   CORS_ORIGIN = https://spm-frontend.onrender.com" -ForegroundColor Gray
Write-Host "   AUTO_INVOICES_CRON_ENABLED = true" -ForegroundColor Gray
Write-Host "   AUTO_INVOICES_CRON_SCHEDULE = 0 0 1 * *" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when backend is deployed..."

Write-Host ""
Write-Host "🌐 STEP 3: Frontend Service Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "1. Go to Render Dashboard" -ForegroundColor White
Write-Host "2. Click 'New' → 'Static Site'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Use these settings:" -ForegroundColor White
Write-Host "   - Name: spm-frontend" -ForegroundColor Gray
Write-Host "   - Build Command: cd client && npm install && npm run build" -ForegroundColor Gray
Write-Host "   - Publish Directory: client/dist" -ForegroundColor Gray
Write-Host "   - Plan: Free" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Add this Environment Variable:" -ForegroundColor Yellow
Write-Host "   VITE_API_URL = https://spm-backend.onrender.com" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when frontend is deployed..."

Write-Host ""
Write-Host "🌱 STEP 4: Database Seeding" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "1. Go to your backend service in Render" -ForegroundColor White
Write-Host "2. Click 'Shell' or 'Console'" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host "   cd server" -ForegroundColor Gray
Write-Host "   node seed-production.js" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when database is seeded..."

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Your Smart Property Manager is now live!" -ForegroundColor Cyan
Write-Host "Backend: https://spm-backend.onrender.com" -ForegroundColor White
Write-Host "Frontend: https://spm-frontend.onrender.com" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Default Login Credentials:" -ForegroundColor Yellow
Write-Host "Admin: admin@spm.test / password123" -ForegroundColor White
Write-Host "Owner: owner@spm.test / password123" -ForegroundColor White
Write-Host "Tenant: john.smith@email.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test your deployment:" -ForegroundColor Yellow
Write-Host "1. Visit your frontend URL" -ForegroundColor White
Write-Host "2. Login with admin credentials" -ForegroundColor White
Write-Host "3. Test all features" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Congratulations! Your Smart Property Manager is live! 🚀" -ForegroundColor Green
