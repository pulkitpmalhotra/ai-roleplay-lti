# 🚀 Supabase Deployment Fix

## Environment Variables Needed in Vercel

Add these to your Vercel environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=https://ai-roleplay-lti.vercel.app
EMERGENT_LLM_KEY=sk-emergent-4066a577787A9750e3
LTI_SECRET=your-lti-secret
LTI_KEY=your-lti-key
JWT_SECRET=your-jwt-secret
```

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  lti_user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table
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

-- Insert default scenario
INSERT INTO scenarios (title, description, objective, bot_tone, bot_context, bot_character, learning_objectives, is_active)
VALUES (
  'Customer Service Excellence',
  'Practice handling difficult customer service situations with empathy and professionalism',
  'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
  'Professional, patient, and empathetic',
  'You are dealing with frustrated customers who have various complaints about products or services. Your goal is to help resolve their issues while maintaining a positive company image.',
  'Customer Service Representative',
  '["Demonstrate active listening skills", "Show empathy and understanding", "Offer practical solutions", "De-escalate tense situations", "Maintain professional demeanor"]',
  true
);

-- Create policies for public access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON scenarios FOR ALL USING (true);
```