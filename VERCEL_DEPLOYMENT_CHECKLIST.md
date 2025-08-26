# ✅ Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. Code Preparation
- [x] Remove development-only files
- [x] Optimize package.json dependencies
- [x] Configure vercel.json
- [x] Set up environment variables template
- [x] Create deployment documentation

### 2. Database Considerations
**Important**: SQLite won't work in Vercel's serverless environment. You need to:

#### Option A: Use Vercel Postgres (Recommended)
```bash
# Install Vercel Postgres
npm install @vercel/postgres

# Update your database.js to use Vercel Postgres
# See database migration script below
```

#### Option B: Use Supabase (Alternative)
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Create Supabase project and get connection string
```

### 3. Environment Variables for Vercel
Set these in Vercel Dashboard:

```
NODE_ENV=production
LTI_SECRET=your-strong-lti-secret-key
LTI_KEY=your-lti-consumer-key
EMERGENT_LLM_KEY=sk-emergent-4066a577787A9750e3
JWT_SECRET=your-jwt-secret-32-characters-long
ENCRYPTION_KEY=your-encryption-key-32-chars-long
APP_URL=https://your-app-name.vercel.app
POSTGRES_URL=your-postgres-connection-string
```

## Step-by-Step Deployment

### Step 1: Push to GitHub
```bash
# Make sure you're in the app directory
cd /app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: LTI Gemini Roleplay Bot ready for Vercel"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/lti-gemini-roleplay-bot.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- Add all the environment variables listed above
- Make sure to use strong, unique values for secrets

### Step 4: Configure Database
Since SQLite doesn't work in serverless, you'll need to migrate to PostgreSQL:

```sql
-- Create tables in your PostgreSQL database
-- Copy the schema from TECHNICAL_DESIGN.md
-- Insert default scenario data
```

### Step 5: Test Deployment
1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test home page loads
3. Test admin dashboard: `/admin`
4. Test LTI launch: `/api/lti/launch?test=true`
5. Create a test scenario
6. Test full roleplay flow

## Post-Deployment Configuration

### 1. Custom Domain (Optional)
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records
4. Update APP_URL environment variable

### 2. LMS Integration
Update your Docebo LMS with the new URLs:
- **Launch URL**: `https://your-app-name.vercel.app/api/lti/launch`
- **LTI Version**: 1.1 & 1.3 Compatible
- **Consumer Key**: (your LTI_KEY)
- **Shared Secret**: (your LTI_SECRET)

### 3. Monitoring Setup
- Enable Vercel Analytics
- Set up error tracking
- Monitor function execution times
- Track costs and usage

## Database Migration Script

If you need to migrate from SQLite to PostgreSQL:

```javascript
// migrate-to-postgres.js
const { Pool } = require('pg');
const Database = require('better-sqlite3');

async function migrateDatabase() {
  // Connect to PostgreSQL
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  // Connect to SQLite
  const sqlite = new Database('./database.sqlite');

  try {
    // Create PostgreSQL tables (copy schema from TECHNICAL_DESIGN.md)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        objective TEXT NOT NULL,
        bot_tone TEXT NOT NULL,
        bot_context TEXT NOT NULL,
        bot_character TEXT NOT NULL,
        learning_objectives TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Migrate scenarios
    const scenarios = sqlite.prepare('SELECT * FROM scenarios').all();
    for (const scenario of scenarios) {
      await pool.query(`
        INSERT INTO scenarios (title, description, objective, bot_tone, bot_context, bot_character, learning_objectives, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        scenario.title,
        scenario.description,
        scenario.objective,
        scenario.bot_tone,
        scenario.bot_context,
        scenario.bot_character,
        scenario.learning_objectives,
        scenario.is_active
      ]);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
    sqlite.close();
  }
}

migrateDatabase();
```

## Troubleshooting Common Issues

### Build Failures
- **Missing dependencies**: Check package.json includes all required packages
- **Environment variables**: Ensure all required env vars are set in Vercel
- **TypeScript errors**: Even though we use JS, check for any TS config issues

### Runtime Errors
- **Database connection**: Verify PostgreSQL connection string is correct  
- **Function timeout**: Increase timeout in vercel.json if needed
- **Memory issues**: Monitor function memory usage

### LTI Integration Issues
- **CORS errors**: Update LTI provider configuration
- **Signature validation**: Verify LTI secrets match between Docebo and Vercel
- **Redirect issues**: Check APP_URL is correctly set to your Vercel domain

## Performance Optimization

### 1. Function Optimization
- Keep serverless functions small and focused
- Use connection pooling for database
- Implement caching where appropriate

### 2. Cost Management
- Monitor Vercel function execution time
- Track Gemini API usage
- Optimize database queries

### 3. Scaling Preparation
- Use Vercel Pro for better performance limits
- Implement rate limiting
- Consider database connection limits

## Security Checklist
- [x] Strong, unique secrets in environment variables
- [x] HTTPS only (automatic with Vercel)
- [x] LTI signature validation
- [x] SQL injection protection (parameterized queries)
- [x] CSRF protection (built-in Next.js)
- [x] Proper error handling (no sensitive data in error messages)

## Success Metrics
After deployment, verify:
- ✅ Home page loads in < 2 seconds
- ✅ Admin dashboard functional
- ✅ LTI launch flow works end-to-end
- ✅ Roleplay sessions create successfully
- ✅ AI responses generated within 5 seconds
- ✅ Progress tracking updates correctly
- ✅ Grade passback to LMS works (if configured)

Your LTI Gemini Roleplay Bot should now be successfully deployed on Vercel! 🚀