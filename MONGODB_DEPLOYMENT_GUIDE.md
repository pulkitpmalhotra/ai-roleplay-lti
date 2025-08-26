# 🚀 MongoDB Deployment Guide for Vercel

## Changes Made to Fix Deployment Issues

The application has been updated to use **MongoDB instead of SQLite** to make it compatible with Vercel's serverless environment.

### ✅ Key Changes:
1. **Database Migration**: SQLite → MongoDB
2. **Fixed Hardcoded URL**: Using environment variables
3. **Updated Dependencies**: Removed `better-sqlite3`, added `mongodb`
4. **API Routes Updated**: All endpoints now use MongoDB

---

## 🔧 Deployment Steps

### Option 1: MongoDB Atlas (Recommended - Free Tier Available)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free account
   - Create a new cluster (free tier M0)

2. **Get Connection String**
   - In Atlas dashboard, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/database_name`)

3. **Configure Vercel Environment Variables**
   In your Vercel dashboard → Settings → Environment Variables, add:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/lti-roleplay-bot
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lti-roleplay-bot
   NODE_ENV=production
   LTI_SECRET=your-strong-lti-secret-key
   LTI_KEY=your-lti-consumer-key
   EMERGENT_LLM_KEY=sk-emergent-4066a577787A9750e3
   JWT_SECRET=your-jwt-secret-32-characters-long
   ENCRYPTION_KEY=your-encryption-key-32-chars-long
   APP_URL=https://your-app-name.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```

### Option 2: Use Existing Emergent MongoDB

If you have access to the Emergent platform's MongoDB:

1. **Get MongoDB Connection String**
   - Check your environment for existing `MONGO_URL`
   - It should be something like: `mongodb://localhost:27017/database_name`

2. **Update Environment Variables**
   Make sure these are set in your deployment environment:
   ```
   MONGO_URL=your-emergent-mongodb-connection-string
   MONGODB_URI=your-emergent-mongodb-connection-string
   ```

---

## 🚀 Deploy to Vercel

### Method 1: Git Push (if connected to GitHub)
1. Commit your changes:
   ```bash
   git add .
   git commit -m "Switch to MongoDB for Vercel compatibility"
   git push origin main
   ```
2. Vercel will automatically deploy

### Method 2: Manual Deploy
1. In Vercel dashboard, click "New Project"
2. Import your repository
3. Set environment variables (as listed above)
4. Deploy

---

## 🧪 Test After Deployment

1. **Homepage**: `https://your-app.vercel.app`
2. **Scenarios API**: `https://your-app.vercel.app/api/scenarios`
3. **LTI Test**: `https://your-app.vercel.app/api/lti/launch?test=true`
4. **Admin Dashboard**: `https://your-app.vercel.app/admin`

---

## 🔍 Troubleshooting

### Common Issues:

1. **"MongoDB connection failed"**
   - Check your connection string format
   - Ensure IP address is whitelisted in Atlas (use 0.0.0.0/0 for all IPs)
   - Verify username/password are correct

2. **"Environment variable not found"**
   - Make sure all required environment variables are set in Vercel
   - Check variable names match exactly (case-sensitive)

3. **"Function timeout"**
   - MongoDB connections might be slow on first request
   - Consider using MongoDB connection pooling
   - Check your database cluster region (choose closest to your users)

### Vercel Function Logs:
- Go to Vercel dashboard → Functions tab
- Check logs for detailed error messages

---

## 🎯 Next Steps After Deployment

1. **Test All Features**:
   - Create a scenario in admin dashboard
   - Test LTI launch flow
   - Verify roleplay sessions work

2. **Update LMS Configuration**:
   - Update Docebo with new Vercel URL
   - Test LTI integration end-to-end

3. **Monitor Performance**:
   - Check Vercel function execution times
   - Monitor MongoDB Atlas usage
   - Set up alerts for errors

---

## 💡 Production Optimization

Once deployed and working:

1. **Database Optimization**:
   - Create proper indexes for frequently queried fields
   - Set up MongoDB connection pooling
   - Consider database sharding for large scale

2. **Vercel Optimization**:
   - Upgrade to Vercel Pro for better performance limits
   - Enable Vercel Analytics
   - Set up proper error monitoring

3. **Security**:
   - Use strong, unique values for all secrets
   - Implement proper authentication
   - Set up rate limiting

---

Your application should now work correctly on Vercel with MongoDB! 🎉

The key fixes applied:
- ✅ Database compatibility (MongoDB)
- ✅ Environment variable usage
- ✅ Serverless function optimization
- ✅ API route compatibility