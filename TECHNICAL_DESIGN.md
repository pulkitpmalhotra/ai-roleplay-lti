# 📋 LTI Gemini Roleplay Bot - Technical Design Document

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Docebo LMS    │    │   Next.js App    │    │  Gemini 2.0     │
│                 │    │                  │    │  Flash API      │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │LTI Consumer │◄┼────┼►│ LTI Provider │ │    │                 │
│ └─────────────┘ │    │ └──────────────┘ │    │                 │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Grade        │◄┼────┼►│Grade Passback│ │    │ │Emergent     │ │
│ │Management   │ │    │ │System        │ │    │ │Universal    │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │Key          │ │
└─────────────────┘    │                  │    │ └─────────────┘ │
                       │ ┌──────────────┐ │    │                 │
                       │ │AI Roleplay   │◄┼────┼─────────────────┘
                       │ │Engine        │ │    │
                       │ └──────────────┘ │    │
                       │                  │    │
                       │ ┌──────────────┐ │    │
                       │ │SQLite        │ │    │
                       │ │Database      │ │    │
                       │ └──────────────┘ │    │
                       └──────────────────┘    │
```

### Technology Stack
- **Frontend**: Next.js 14 (React) with Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI Integration**: Google Gemini 2.0 Flash via Emergent Universal Key
- **Authentication**: LTI 1.1 & 1.3, JWT tokens
- **Deployment**: Vercel (serverless functions)

## 🎯 Core Components

### 1. LTI Integration Layer
**Location**: `/app/lib/lti-provider.js`

**Responsibilities**:
- Handle LTI 1.1 and 1.3 authentication
- Validate launch parameters and signatures
- Extract user context and permissions
- Manage grade passback to LMS
- Create secure session tokens

**Key Features**:
```javascript
class LTIProvider {
  validateLTI11Launch(params, signature, method, url)
  validateLTI13Launch(token)
  extractUserInfo(params)
  sendGrade(outcomeServiceUrl, sourcedId, score)
  createSessionToken(userId, scenarioId, ltiContext)
}
```

### 2. AI Roleplay Engine
**Location**: `/app/lib/ai-roleplay-engine.js`

**Responsibilities**:
- Manage roleplay sessions and conversations
- Generate contextual AI responses using Gemini
- Track learning objective progress
- Calculate completion percentages and grades
- Handle scenario-specific character prompts

**Key Features**:
```javascript
class AIRoleplayEngine {
  createSession(userId, scenarioId, ltiContext)
  generateResponse(sessionId, userMessage)
  analyzeLearningProgress(sessionId, userMessage, aiResponse, scenario)
  calculateCompletionPercentage(sessionId)
  updateSessionStats(sessionId)
}
```

### 3. Scenario Management System
**Location**: `/app/lib/scenario-manager.js`

**Responsibilities**:
- CRUD operations for training scenarios
- Validation of scenario data
- Performance analytics and statistics
- Admin interface backend logic

**Key Features**:
```javascript
class ScenarioManager {
  createScenario(scenarioData)
  getScenario(id)
  updateScenario(id, scenarioData)
  deleteScenario(id)
  getScenarioStats(id)
  validateScenarioData(data)
}
```

## 🗄️ Database Design

### Entity Relationship Diagram
```
Users (1) ──── (M) Learning_Sessions (M) ──── (1) Scenarios
  │                      │
  │                      │
  │              (1) ─── (M) Messages
  │                      │
  │              (1) ─── (M) Learning_Progress
  │
(1) ─── (M) LTI_Launches
```

### Database Schema

#### 1. Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lti_user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Scenarios Table
```sql
CREATE TABLE scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  bot_tone TEXT NOT NULL,
  bot_context TEXT NOT NULL,
  bot_character TEXT NOT NULL,
  learning_objectives TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);
```

#### 3. Learning Sessions Table
```sql
CREATE TABLE learning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  scenario_id INTEGER NOT NULL,
  lti_context_id TEXT,
  lti_resource_link_id TEXT,
  session_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  total_messages INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  final_grade REAL DEFAULT 0.0,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
);
```

#### 4. Messages Table
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  token_count INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES learning_sessions (id)
);
```

#### 5. Learning Progress Table
```sql
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  objective_key TEXT NOT NULL,
  objective_description TEXT NOT NULL,
  achieved BOOLEAN DEFAULT 0,
  achievement_timestamp DATETIME,
  evidence_message_id INTEGER,
  score REAL DEFAULT 0.0,
  FOREIGN KEY (session_id) REFERENCES learning_sessions (id),
  FOREIGN KEY (evidence_message_id) REFERENCES messages (id)
);
```

#### 6. LTI Launches Table
```sql
CREATE TABLE lti_launches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  scenario_id INTEGER,
  context_id TEXT,
  resource_link_id TEXT,
  launch_url TEXT,
  outcome_service_url TEXT,
  result_sourcedid TEXT,
  launch_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
);
```

## 🎨 Frontend Architecture

### Page Structure
```
/app
├── page.js                 # Home page (marketing/info)
├── admin/
│   └── page.js            # Admin dashboard
├── select-scenario/
│   └── page.js            # Scenario selection
└── roleplay/
    └── [sessionToken]/
        └── page.js        # Roleplay interface
```

### Component Architecture
- **Server-Side Rendering**: All pages use SSR for better performance and SEO
- **Tailwind CSS**: Utility-first styling with custom components
- **Form Handling**: Server actions for scenario creation and session management
- **State Management**: Local state with React hooks, no external state manager needed

### Key Frontend Features
1. **Responsive Design**: Mobile-first approach using Tailwind breakpoints
2. **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
3. **Progressive Enhancement**: Works without JavaScript (forms submit via HTTP)
4. **Real-time Updates**: Dynamic progress tracking and message display

## 🔧 Backend Architecture

### API Route Structure
```
/app/api/
├── lti/
│   └── launch/route.js           # LTI launch endpoint
├── scenarios/route.js            # Public scenarios API
├── admin/
│   └── scenarios/
│       ├── route.js              # Admin scenarios CRUD
│       └── [id]/
│           ├── route.js          # Individual scenario operations
│           └── toggle/route.js   # Activate/deactivate scenarios
└── roleplay/
    ├── start/route.js            # Create new session
    ├── start-session/route.js    # Form-based session creation
    ├── chat/route.js             # Chat interactions
    ├── session/
    │   └── [sessionToken]/route.js # Session details
    └── messages/
        └── [sessionToken]/route.js # Message history
```

### Authentication & Authorization
1. **LTI Authentication**: OAuth 1.0a signatures and JWT validation
2. **Session Management**: JWT tokens for roleplay sessions
3. **Role-Based Access**: Admin, instructor, and student permissions
4. **CSRF Protection**: Built-in Next.js protection

### Error Handling
- **Global Error Boundary**: Catches and reports React errors
- **API Error Responses**: Consistent JSON error format
- **Validation**: Server-side validation with detailed error messages
- **Logging**: Comprehensive logging for debugging and monitoring

## 🤖 AI Integration

### Gemini 2.0 Flash Integration
**Why Gemini 2.0 Flash?**
- **Cost Effective**: Best price-performance ratio for scaling
- **Fast Response**: Low latency for real-time conversations
- **Context Aware**: Excellent for maintaining character consistency
- **Multi-turn Conversations**: Handles complex roleplay scenarios

### AI Prompt Engineering
```javascript
buildSystemPrompt(scenario) {
  return `You are a ${scenario.bot_character} in a roleplay training scenario.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description}
- Learning Objective: ${scenario.objective}
- Your Character: ${scenario.bot_character}
- Tone: ${scenario.bot_tone}
- Context: ${scenario.bot_context}

LEARNING OBJECTIVES TO HELP STUDENT ACHIEVE:
${JSON.parse(scenario.learning_objectives).map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

INSTRUCTIONS:
1. Stay completely in character as ${scenario.bot_character}
2. Maintain a ${scenario.bot_tone} tone throughout the conversation
3. Create realistic, challenging scenarios that help students practice the learning objectives
4. Provide constructive feedback when students demonstrate good skills
5. Gradually escalate difficulty to help students grow
6. Keep responses conversational and engaging
7. Don't break character or mention that you're an AI
8. Focus on helping students achieve the learning objectives through practice

IMPORTANT: Respond only as ${scenario.bot_character}. Do not provide meta-commentary or break character.`;
}
```

### Learning Progress Analysis
The system uses AI to analyze student responses against learning objectives:
- **Keyword Analysis**: Simple pattern matching for basic achievements
- **Contextual Understanding**: AI analyzes conversation quality and appropriateness
- **Progressive Scoring**: Objectives become progressively harder to achieve
- **Real-time Feedback**: Immediate progress updates during conversation

## 📊 Reporting & Analytics

### Progress Tracking
1. **Individual Progress**: Per-student completion rates and objective achievements
2. **Scenario Performance**: Success rates and average completion times per scenario
3. **Learning Analytics**: Detailed breakdown of which objectives are challenging
4. **Usage Statistics**: Session counts, message volumes, and engagement metrics

### Grade Calculation Algorithm
```javascript
calculateFinalGrade(sessionId) {
  const progress = this.getSessionProgress(sessionId);
  if (progress.length === 0) return 0;

  // Weighted scoring based on objective importance
  const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
  const maxPossibleScore = progress.length;
  
  // Grade is percentage of objectives achieved
  return Math.round((totalScore / maxPossibleScore) * 100) / 100;
}
```

### LMS Integration Reporting
- **Grade Passback**: Automatic grade synchronization with Docebo
- **Completion Tracking**: Status updates (in-progress, completed, abandoned)
- **Time Tracking**: Session duration and engagement time
- **Attempt Tracking**: Multiple attempt handling and best score retention

## 🔒 Security Considerations

### Data Protection
1. **Encryption**: All sensitive data encrypted at rest and in transit
2. **PII Handling**: Minimal PII collection, compliant with GDPR/CCPA
3. **Session Security**: Secure JWT tokens with expiration
4. **SQL Injection Protection**: Parameterized queries throughout

### LTI Security
1. **Signature Validation**: Strict OAuth signature verification
2. **Timestamp Validation**: Prevents replay attacks
3. **Origin Verification**: Validates launch origin and context
4. **Role Enforcement**: Proper permission checks for admin functions

### Infrastructure Security
1. **HTTPS Only**: All traffic encrypted in transit
2. **Environment Variables**: Secure secret management
3. **Rate Limiting**: API rate limiting to prevent abuse
4. **CORS Configuration**: Strict cross-origin request policies

## 🚀 Deployment Architecture

### Vercel Serverless Functions
- **Auto-scaling**: Scales automatically based on demand
- **Cold Start Optimization**: Optimized for fast cold starts
- **Regional Distribution**: Global edge network for low latency
- **Function Timeout**: 30-second timeout for complex AI operations

### Performance Optimizations
1. **Server-Side Rendering**: Faster initial page loads
2. **Static Asset Optimization**: Automatic image and asset optimization
3. **Database Connection Pooling**: Efficient database connection management
4. **Caching Strategy**: Strategic caching of scenarios and static content

### Monitoring & Observability
1. **Error Tracking**: Comprehensive error reporting and alerting
2. **Performance Monitoring**: Response time and throughput metrics
3. **Usage Analytics**: User engagement and feature adoption tracking
4. **Cost Monitoring**: AI usage and infrastructure cost tracking

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: All functions are stateless for easy scaling
- **Database Optimization**: Indexed queries and connection pooling
- **CDN Distribution**: Static assets served from global CDN
- **Load Balancing**: Automatic load distribution across regions

### Cost Optimization
1. **AI Model Selection**: Gemini 2.0 Flash for optimal cost-performance
2. **Intelligent Caching**: Cache frequent requests to reduce AI calls
3. **Resource Monitoring**: Track and optimize expensive operations
4. **Tiered Pricing**: Support for different usage tiers

### Future Enhancements
1. **Multi-tenancy**: Support for multiple organizations
2. **Advanced Analytics**: ML-powered learning insights
3. **Custom AI Models**: Fine-tuned models for specific scenarios
4. **Real-time Collaboration**: Multi-user roleplay scenarios
5. **Mobile App**: Native mobile applications
6. **Voice Integration**: Speech-to-text and text-to-speech capabilities

---

## 🔄 Data Flow Diagrams

### LTI Launch Flow
```
1. User clicks LTI link in Docebo
2. Docebo sends LTI launch request to /api/lti/launch
3. System validates LTI signature and parameters
4. User record created/updated in database
5. User redirected to scenario selection page
6. User selects scenario and creates session
7. Roleplay interface loaded with session context
```

### Roleplay Session Flow
```
1. User sends message via chat interface
2. Message saved to database
3. AI prompt constructed with scenario context
4. Gemini API called with conversation history
5. AI response generated and saved
6. Learning progress analyzed and updated
7. Response and progress sent back to user
8. Grade calculated and potentially sent to LMS
```

### Admin Management Flow
```
1. Admin accesses admin dashboard
2. Scenario list loaded from database
3. Admin creates/edits scenario with form
4. Validation performed on server-side
5. Scenario saved to database
6. Statistics and analytics updated
7. Changes reflected in student scenario selection
```

This technical design provides a comprehensive overview of the LTI Gemini Roleplay Bot architecture, ensuring scalability, security, and maintainability for enterprise-level deployment.