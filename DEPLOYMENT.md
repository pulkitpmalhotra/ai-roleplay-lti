# 🚀 Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account
- Node.js 18+ locally

## Step-by-Step Deployment

### 1. Push to GitHub
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: LTI Gemini Roleplay Bot"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/lti-gemini-roleplay-bot.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
   - **Install Command**: `npm install`

### 3. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

```
LTI_SECRET=your-lti-secret-key-here
LTI_KEY=your-lti-consumer-key
EMERGENT_LLM_KEY=sk-emergent-4066a577787A9750e3
DATABASE_URL=./database.sqlite
JWT_SECRET=your-jwt-secret-key-32-characters-long
APP_URL=https://your-app-name.vercel.app
ENCRYPTION_KEY=your-encryption-key-32-chars-long
NODE_ENV=production
```

### 4. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your deployed app at `https://your-app-name.vercel.app`

### 5. Test Deployment
- Home page: `https://your-app-name.vercel.app`
- Admin: `https://your-app-name.vercel.app/admin`
- LTI Test: `https://your-app-name.vercel.app/api/lti/launch?test=true`

### 6. Configure Custom Domain (Optional)
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update APP_URL environment variable

## Important Notes

### Database Considerations
- SQLite works for development but consider upgrading to PostgreSQL or MySQL for production
- For Vercel, consider using Vercel Postgres or Supabase

### Scaling Considerations
- Vercel has function execution limits (10 seconds for Hobby, 60 seconds for Pro)
- Consider upgrading to Pro plan for production use
- Monitor usage and costs

### Security
- Use strong, unique values for all secrets
- Enable HTTPS only
- Consider implementing rate limiting

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify database connectivity
- Test API endpoints individually

### LTI Integration
- Update Docebo LMS with new Vercel URL
- Test LTI launch flow thoroughly
- Verify grade passback functionality