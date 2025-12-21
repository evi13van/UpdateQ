
# Backend Development Plan for UpdateQ

## 1️⃣ Executive Summary

### What Will Be Built
A FastAPI backend that powers UpdateQ's content freshness analysis platform, enabling content managers to identify outdated information across web pages through AI-powered detection.

### Why
The frontend (built with Next.js) currently uses mock data. This backend will provide real data persistence, user authentication, content extraction via Playwright, and LLM-based factual decay detection via Claude API.

### Key Constraints
- **Runtime:** Python 3.13 with FastAPI (async)
- **Database:** MongoDB Atlas only (no local instance)
- **Driver:** Motor (async MongoDB driver) with Pydantic v2 models
- **No Docker** — local development and deployment without containers
- **Testing:** Manual testing via frontend UI after every task
- **Git:** Single branch `main` only — commit and push after each sprint
- **API Base:** `/api/v1/*`
- **Background Tasks:** Synchronous by default; use `BackgroundTasks` only if strictly necessary

### Sprint Structure
This plan uses **dynamic sprints (S0 → Sn)** to fully cover all frontend-visible features:
- **S0:** Environment setup and frontend connection
- **S1:** Basic authentication (signup, login, logout)
- **S2:** URL submission and domain context storage
- **S3:** Content extraction with Playwright
- **S4:** LLM-based detection with Claude API
- **S5:** Results retrieval and CSV export
- **S6:** Analysis history management
- **S7:** Writer assignment tracking

---

## 2️⃣ In-Scope & Success Criteria

### In-Scope Features
- User registration, login, logout with JWT authentication
- URL batch submission (1-20 URLs) with domain context configuration
- JS-rendered content extraction using Playwright (headless Chromium)
- LLM-based factual decay detection using Claude API (claude-3-haiku)
- Results table with issue prioritization and sorting
- CSV export for writer handoff
- Analysis run history (view, delete)
- Writer assignment tracking (assign issues, update status, mark complete)
- Manual task creation for assignments

### Success Criteria
- All frontend features functional end-to-end
- All task-level manual tests pass via UI
- Each sprint's code pushed to `main` after verification
- MongoDB Atlas connection successful
- Authentication flow works (signup → login → protected routes → logout)
- Content extraction handles JS-rendered pages and tables
- LLM detection identifies stale claims with context awareness
- CSV export produces clean, readable output
- Analysis history persists and displays correctly
- Writer assignments track status changes

---

## 3️⃣ API Design

### Base Path
All endpoints use `/api/v1` prefix

### Error Envelope
```json
{ "error": "Human-readable error message" }
```

### Authentication Endpoints

#### `POST /api/v1/auth/signup`
**Purpose:** Register new user account  
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```
**Response (201):**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "user"
}
```
**Validation:** Email format valid, password min 8 chars, email unique

#### `POST /api/v1/auth/login`
**Purpose:** Authenticate user and issue JWT  
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```
**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "user"
  }
}
```
**Validation:** Credentials match stored user

#### `POST /api/v1/auth/logout`
**Purpose:** Invalidate user session (client-side token removal)  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{ "message": "Logged out successfully" }
```

#### `GET /api/v1/auth/me`
**Purpose:** Get current authenticated user  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "user"
}
```

### Analysis Endpoints

#### `POST /api/v1/analysis/start`
**Purpose:** Submit URL batch with domain context for analysis  
**Request:**
```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "domainContext": {
    "description": "Mortgage rates and home loan guides",
    "entityTypes": "Interest rates, loan limits, deadlines",
    "stalenessRules": "Rates older than 1 month, 2022 references"
  }
}
```
**Response (201):**
```json
{
  "runId": "run_xyz789",
  "status": "processing",
  "urlCount": 2
}
```
**Validation:** 1-20 URLs, valid HTTP/HTTPS format, no duplicates, all context fields present

#### `GET /api/v1/analysis/runs/{runId}`
**Purpose:** Get analysis run details and results  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{
  "id": "run_xyz789",
  "userId": "user_abc123",
  "timestamp": 1703001234567,
  "urlCount": 2,
  "totalIssues": 5,
  "status": "completed",
  "domainContext": {
    "description": "Mortgage rates",
    "entityTypes": "Interest rates",
    "stalenessRules": "Rates older than 1 month"
  },
  "results": [
    {
      "url": "https://example.com/page1",
      "title": "Mortgage Rates 2023",
      "status": "success",
      "issueCount": 3,
      "issues": [
        {
          "id": "issue_1",
          "description": "Outdated year reference",
          "flaggedText": "In 2023, rates are...",
          "reasoning": "Current year is 2025",
          "status": "open"
        }
      ]
    }
  ]
}
```

#### `GET /api/v1/analysis/runs`
**Purpose:** List all analysis runs for authenticated user  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{
  "runs": [
    {
      "id": "run_xyz789",
      "timestamp": 1703001234567,
      "urlCount": 2,
      "totalIssues": 5,
      "status": "completed",
      "domainContext": {
        "description": "Mortgage rates"
      }
    }
  ]
}
```

#### `DELETE /api/v1/analysis/runs/{runId}`
**Purpose:** Delete analysis run and all associated results  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{ "message": "Analysis run deleted" }
```

#### `GET /api/v1/analysis/runs/{runId}/export`
**Purpose:** Export analysis results as CSV  
**Request:** Bearer token in Authorization header  
**Response (200):** CSV file with headers:
```
URL,Page Title,Issue Count,Issue Description,Flagged Text,Reasoning
```
**Content-Type:** `text/csv; charset=utf-8`

### Writer Assignment Endpoints

#### `PATCH /api/v1/analysis/runs/{runId}/issues/{issueId}`
**Purpose:** Update issue status and assignment details  
**Request:**
```json
{
  "status": "in_progress",
  "assignedTo": "Sarah Jenkins",
  "googleDocUrl": "https://docs.google.com/document/d/123",
  "dueDate": 1703001234567
}
```
**Response (200):**
```json
{
  "id": "issue_1",
  "status": "in_progress",
  "assignedTo": "Sarah Jenkins",
  "assignedAt": 1703001234567,
  "googleDocUrl": "https://docs.google.com/document/d/123",
  "dueDate": 1703001234567
}
```

#### `GET /api/v1/analysis/issues`
**Purpose:** Get all issues across all runs for authenticated user  
**Request:** Bearer token in Authorization header  
**Query Params:** `?status=in_progress` (optional filter)  
**Response (200):**
```json
{
  "issues": [
    {
      "runId": "run_xyz789",
      "url": "https://example.com/page1",
      "pageTitle": "Mortgage Rates 2023",
      "issue": {
        "id": "issue_1",
        "description": "Outdated year",
        "flaggedText": "In 2023...",
        "reasoning": "Current year is 2025",
        "status": "in_progress",
        "assignedTo": "Sarah Jenkins",
        "assignedAt": 1703001234567
      }
    }
  ]
}
```

#### `POST /api/v1/analysis/manual-task`
**Purpose:** Create manual task assignment (not from analysis)  
**Request:**
```json
{
  "title": "Update homepage hero section",
  "writerName": "Mike Chen",
  "googleDocUrl": "https://docs.google.com/document/d/456",
  "dueDate": 1703001234567
}
```
**Response (201):**
```json
{
  "id": "task_manual_1",
  "title": "Update homepage hero section",
  "status": "in_progress",
  "assignedTo": "Mike Chen",
  "googleDocUrl": "https://docs.google.com/document/d/456",
  "dueDate": 1703001234567
}
```

### Writer Management Endpoints

#### `GET /api/v1/writers`
**Purpose:** Get list of writers for authenticated user  
**Request:** Bearer token in Authorization header  
**Response (200):**
```json
{
  "writers": [
    {
      "id": "writer_1",
      "name": "Sarah Jenkins",
      "email": "sarah.j@example.com"
    }
  ]
}
```

#### `POST /api/v1/writers`
**Purpose:** Add new writer  
**Request:**
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.j@example.com"
}
```
**Response (201):**
```json
{
  "id": "writer_1",
  "name": "Sarah Jenkins",
  "email": "sarah.j@example.com"
}
```

---

## 4️⃣ Data Model (MongoDB Atlas)

### Collections

#### `users`
**Purpose:** Store user accounts  
**Fields:**
- `_id` (ObjectId, required) — MongoDB auto-generated ID
- `email` (string, required, unique) — User email address
- `password_hash` (string, required) — Argon2 hashed password
- `name` (string, required) — Display name (derived from email)
- `created_at` (datetime, required) — Account creation timestamp
- `updated_at` (datetime, required) — Last update timestamp

**Example Document:**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439011')",
  "email": "maria@contentmanage.com",
  "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "name": "maria",
  "created_at": "2025-12-20T10:30:00Z",
  "updated_at": "2025-12-20T10:30:00Z"
}
```

#### `analysis_runs`
**Purpose:** Store analysis run metadata and results  
**Fields:**
- `_id` (ObjectId, required) — MongoDB auto-generated ID
- `user_id` (ObjectId, required) — Reference to users collection
- `timestamp` (datetime, required) — Run creation time
- `url_count` (int, required) — Number of URLs in batch
- `total_issues` (int, required, default=0) — Total issues found
- `status` (string, required) — One of: processing, completed, failed
- `domain_context` (object, required) — Embedded domain context
  - `description` (string, required)
  - `entity_types` (string, required)
  - `staleness_rules` (string, required)
- `results` (array, required) — Array of detection results (embedded)
  - `url` (string, required)
  - `title` (string, required)
  - `status` (string, required) — success or failed
  - `issue_count` (int, required)
  - `issues` (array, required) — Array of issue objects
    - `id` (string, required) — Unique issue ID
    - `description` (string, required)
    - `flagged_text` (string, required)
    - `reasoning` (string, required)
    - `status` (string, optional) — open, in_progress, completed, posted
    - `assigned_to` (string, optional) — Writer name
    - `assigned_at` (datetime, optional) — Assignment timestamp
    - `completed_at` (datetime, optional) — Completion timestamp
    - `google_doc_url` (string, optional) — Google Doc link
    - `due_date` (datetime, optional) — Due date

**Example Document:**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439012')",
  "user_id": "ObjectId('507f1f77bcf86cd799439011')",
  "timestamp": "2025-12-20T11:00:00Z",
  "url_count": 2,
  "total_issues": 3,
  "status": "completed",
  "domain_context": {
    "description": "Mortgage rates and home loan guides",
    "entity_types": "Interest rates, loan limits, deadlines",
    "staleness_rules": "Rates older than 1 month, 2022 references"
  },
  "results": [
    {
      "url": "https://example.com/mortgage-rates",
      "title": "Current Mortgage Rates 2023",
      "status": "success",
      "issue_count": 3,
      "issues": [
        {
          "id": "issue_abc123",
          "description": "Outdated year reference",
          "flagged_text": "In 2023, rates are...",
          "reasoning": "Current year is 2025",
          "status": "in_progress",
          "assigned_to": "Sarah Jenkins",
          "assigned_at": "2025-12-20T12:00:00Z",
          "google_doc_url": "https://docs.google.com/document/d/123",
          "due_date": "2025-12-23T12:00:00Z"
        }
      ]
    }
  ]
}
```

#### `writers`
**Purpose:** Store writer information for assignments  
**Fields:**
- `_id` (ObjectId, required) — MongoDB auto-generated ID
- `user_id` (ObjectId, required) — Reference to users collection (owner)
- `name` (string, required) — Writer full name
- `email` (string, required) — Writer email address
- `created_at` (datetime, required) — Creation timestamp

**Example Document:**
```json
{
  "_id": "ObjectId('507f1f77bcf86cd799439013')",
  "user_id": "ObjectId('507f1f77bcf86cd799439011')",
  "name": "Sarah Jenkins",
  "email": "sarah.j@example.com",
  "created_at": "2025-12-20T10:30:00Z"
}
```

---

## 5️⃣ Frontend Audit & Feature Map

### Dashboard (`/`)
**Route:** [`frontend/app/page.tsx`](frontend/app/page.tsx:1)  
**Purpose:** Landing page (logged out) or dashboard (logged in) showing recent analysis runs  
**Data Needed:**
- User authentication status
- Recent analysis runs (last 3) with stats
**Required Endpoints:**
- `GET /api/v1/auth/me` — Check auth status
- `GET /api/v1/analysis/runs` — Fetch recent runs
**Auth:** Optional (shows different view based on auth status)

### Login (`/login`)
**Route:** [`frontend/app/login/page.tsx`](frontend/app/login/page.tsx:1)  
**Purpose:** User authentication form  
**Data Needed:** None (form submission only)  
**Required Endpoints:**
- `POST /api/v1/auth/login` — Authenticate user
**Auth:** None

### Register (`/register`)
**Route:** [`frontend/app/register/page.tsx`](frontend/app/register/page.tsx:1)  
**Purpose:** New user registration form  
**Data Needed:** None (form submission only)  
**Required Endpoints:**
- `POST /api/v1/auth/signup` — Create new user
**Auth:** None

### Settings (`/settings`)
**Route:** [`frontend/app/settings/page.tsx`](frontend/app/settings/page.tsx:1)  
**Purpose:** User profile and logout  
**Data Needed:**
- Current user information
**Required Endpoints:**
- `GET /api/v1/auth/me` — Get user profile
- `POST /api/v1/auth/logout` — Logout
**Auth:** Required

### New Analysis (`/analyze`)
**Route:** [`frontend/app/analyze/page.tsx`](frontend/app/analyze/page.tsx:1)  
**Purpose:** URL input form with domain context configuration  
**Data Needed:**
- Saved domain contexts (localStorage only — no backend)
**Required Endpoints:**
- `POST /api/v1/analysis/start` — Submit analysis
**Auth:** Required

### Processing Status (`/analyze/processing/[id]`)
**Route:** [`frontend/app/analyze/processing/[id]/page.tsx`](frontend/app/analyze/processing/[id]/page.tsx:1)  
**Purpose:** Show analysis progress and completion  
**Data Needed:**
- Analysis run status (polling)
**Required Endpoints:**
- `GET /api/v1/analysis/runs/{runId}` — Poll for status
**Auth:** Required

### Results Table (`/results/[id]`)
**Route:** [`frontend/app/results/[id]/page.tsx`](frontend/app/results/[id]/page.tsx:1)  
**Purpose:** Display analysis results with sorting, filtering, and CSV export  
**Data Needed:**
- Complete analysis run with all results and issues
**Required Endpoints:**
- `GET /api/v1/analysis/runs/{runId}` — Fetch results
- `GET /api/v1/analysis/runs/{runId}/export` — Export CSV
- `PATCH /api/v1/analysis/runs/{runId}/issues/{issueId}` — Assign issues
**Auth:** Required

### Analysis History (`/history`)
**Route:** [`frontend/app/history/page.tsx`](frontend/app/history/page.tsx:1)  
**Purpose:** List all past analysis runs  
**Data Needed:**
- All analysis runs for user
**Required Endpoints:**
- `GET /api/v1/analysis/runs` — List all runs
- `DELETE /api/v1/analysis/runs/{runId}` — Delete run
**Auth:** Required

### Writer Assignments (`/assignments`)
**Route:** [`frontend/app/assignments/page.tsx`](frontend/app/assignments/page.tsx:1)  
**Purpose:** Track assigned issues and writer progress  
**Data Needed:**
- All issues with status (assigned, in_progress, completed)
- Writer list
**Required Endpoints:**
- `GET /api/v1/analysis/issues` — Get all issues
- `GET /api/v1/writers` — Get writer list
- `POST /api/v1/writers` — Add new writer
- `PATCH /api/v1/analysis/runs/{runId}/issues/{issueId}` — Update issue status
- `POST /api/v1/analysis/manual-task` — Create manual task
**Auth:** Required

---

## 6️⃣ Configuration & ENV Vars

### Core Environment Variables
- `APP_ENV` — Environment (development, production)
- `PORT` — HTTP port (default: 8000)
- `MONGODB_URI` — MongoDB Atlas connection string (required)
- `JWT_SECRET` — Token signing key (required, min 32 chars)
- `JWT_EXPIRES_IN` — Seconds before JWT expiry (default: 86400 = 24 hours)
- `CORS_ORIGINS` — Allowed frontend URL(s) (comma-separated)
- `CLAUDE_API_KEY` — Anthropic Claude API key (required for detection)
- `PLAYWRIGHT_TIMEOUT` — Page load timeout in milliseconds (default: 15000)

### Example `.env` File
```
APP_ENV=development
PORT=8000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/updateq?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=86400
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CLAUDE_API_KEY=sk-ant-api03-...
PLAYWRIGHT_TIMEOUT=15000
```

---

## 7️⃣ Background Work

### Content Extraction & Detection
**Trigger:** User submits URL batch via `POST /api/v1/analysis/start`  
**Purpose:** Extract JS-rendered content with Playwright, then analyze with Claude API  
**Idempotency:** Each run creates new analysis_run document; re-running same URLs creates separate run  
**UI Completion Check:** Frontend polls `GET /api/v1/analysis/runs/{runId}` for `status: "completed"`

**Flow:**
1. User submits URLs + domain context
2. Backend creates `analysis_run` document with `status: "processing"`
3. Backend uses `BackgroundTasks` to process URLs sequentially:
   - For each URL: Extract content with Playwright (15s timeout)
   - If extraction succeeds: Send to Claude API for detection
   - If extraction fails: Mark as `status: "failed"` and continue
4. After all URLs processed: Update `analysis_run` with `status: "completed"` and `total_issues`
5. Frontend polls and redirects to results when complete

---

## 8️⃣ Integrations

### Playwright (Content Extraction)
**Purpose:** Extract JS-rendered content as users see it  
**Flow:**
1. Launch headless Chromium browser
2. Navigate to URL with 15-second timeout
3. Wait for `networkidle` state
4. Extract: page title, meta tags, body text, tables with structure
5. Strip: scripts, styles, nav, footer elements
6. Return extracted content or error message

**Extra ENV Vars:** None (uses `PLAYWRIGHT_TIMEOUT`)

### Claude API (Factual Decay Detection)
**Purpose:** Analyze extracted content for stale claims  
**Flow:**
1. Construct prompt with: domain context + current date + extracted content
2. Call Claude API (claude-3-haiku model)
3. Parse JSON response with array of issues
4. Each issue contains: description, flagged_text, reasoning
5. Return issues array or empty array if none found

**Extra ENV Vars:**
- `CLAUDE_API_KEY` — Anthropic API key (required)

---

## 9️⃣ Testing Strategy (Manual via Frontend)

### Validation Approach
- All testing performed through frontend UI
- Every task includes Manual Test Step and User Test Prompt
- After all tasks in sprint pass → commit and push to `main`
- If any task fails → fix and retest before pushing

### Test Format
Each task specifies:
- **Manual Test Step:** Exact UI action + expected result
- **User Test Prompt:** Copy-paste friendly instruction for testing

---

## 🔟 Dynamic Sprint Plan & Backlog

---

## 🧱 S0 – Environment Setup & Frontend Connection

### Objectives
- Create FastAPI skeleton with `/api/v1` base path and `/healthz` endpoint
- Connect to MongoDB Atlas using `MONGODB_URI`
- `/healthz` performs DB ping and returns JSON status
- Enable CORS for frontend
- Replace dummy API URLs in frontend with real backend URLs
- Initialize Git at root, set default branch to `main`, push to GitHub
- Create single `.gitignore` at root

### User Stories
- As a developer, I can verify backend is running and connected to MongoDB Atlas
- As a frontend developer, I can make API calls to the backend without CORS errors
- As a team, we have version control set up with GitHub

### Tasks

#### Task 1: Create FastAPI project structure
**Actions:**
- Create `backend/` directory at project root
- Create `backend/main.py` with FastAPI app
- Create `backend/requirements.txt` with dependencies:
  - `fastapi==0.115.0`
  - `uvicorn[standard]==0.32.0`
  - `motor==3.6.0`
  - `pydantic==2.10.0`
  - `pydantic-settings==2.6.0`
  - `python-jose[cryptography]==3.3.0`
  - `passlib[argon2]==1.7.4`
  - `python-multipart==0.0.12`
  - `anthropic==0.39.0`
  - `playwright==1.48.0`
- Create `backend/.env.example` with all required env vars
- Create `backend/config.py` for settings management using Pydantic Settings

**Manual Test Step:**
- Run `pip install -r backend/requirements.txt` → all packages install successfully
- Run `uvicorn backend.main:app --reload --port 8000` → server starts on port 8000

**User Test Prompt:**
> "Install dependencies with `pip install -r backend/requirements.txt`, then start the server with `uvicorn backend.main:app --reload --port 8000`. Confirm it starts without errors."

#### Task 2: Implement `/healthz` endpoint with MongoDB ping
**Actions:**
- Create `backend/database.py` with Motor client initialization
- Implement MongoDB connection using `MONGODB_URI` from env
- Add `/healthz` endpoint in `main.py` that:
  - Pings MongoDB with `await db.command('ping')`
  - Returns `{"status": "healthy", "database": "connected"}` on success
  - Returns `{"status": "unhealthy", "database": "disconnected"}` on failure
- Add CORS middleware for frontend origins from `CORS_ORIGINS` env var

**Manual Test Step:**
- Open browser to `http://localhost:8000/healthz` → see `{"status": "healthy", "database": "connected"}`

**User Test Prompt:**
> "Navigate to http://localhost:8000/healthz in your browser. You should see a JSON response showing healthy status and database connected."

#### Task 3: Update frontend API URLs
**Actions:**
- Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
- Update [`frontend/lib/mock-service.ts`](frontend/lib/mock-service.ts:1) to use real API URLs instead of mock data
- Replace mock functions with actual `fetch()` calls to backend endpoints
- Keep mock data as fallback for development

**Manual Test Step:**
- Start frontend with `npm run dev` → no console errors about API URLs

**User Test Prompt:**
> "Start the frontend with `npm run dev` and open http://localhost:3000. Check the browser console for any API-related errors."

#### Task 4: Initialize Git and push to GitHub
**Actions:**
- Run `git init` at project root (if not already initialized)
- Create `.gitignore` at root with:
  ```
  __pycache__/
  *.pyc
  *.pyo
  *.pyd
  .env
  .venv/
  venv/
  env/
  .DS_Store
  node_modules/
  .next/
  ```
- Run `git add .`
- Run `git commit -m "S0: Initial backend setup with FastAPI and MongoDB Atlas"`
- Run `git branch -M main`
- Create GitHub repo and push: `git remote add origin <repo-url>` then `git push -u origin main`

**Manual Test Step:**
- Visit GitHub repo URL → see initial commit with backend files

**User Test Prompt:**
> "Visit your GitHub repository and confirm you see the initial commit with the backend directory and files."

### Definition of Done
- Backend runs locally on port 8000
- `/healthz` returns success with MongoDB Atlas connection
- Frontend can make API calls without CORS errors
- Git initialized with `main` branch
- Code pushed to GitHub

---

## 🧩 S1 – Basic Auth (Signup / Login / Logout)

### Objectives
- Implement JWT-based signup, login, and logout
- Store users in MongoDB with Argon2 hashed passwords
- Protect one backend route and one frontend page

### User Stories
- As a user, I can create an account with email and password
- As a user, I can log in and receive a JWT token
- As a user, I can log out and my session ends
- As a user, I can access protected routes only when authenticated

### Endpoints
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Tasks

#### Task 1: Create User model and database operations
**Actions:**
- Create `backend/models/user.py` with Pydantic v2 User model
- Fields: `id`, `email`, `password_hash`, `name`, `created_at`, `updated_at`
- Create `backend/crud/user.py` with async functions:
  - `create_user(email, password)` — hash password with Argon2, insert to MongoDB
  - `get_user_by_email(email)` — fetch user by email
  - `verify_password(plain_password, hashed_password)` — verify with Argon2

**Manual Test Step:**
- Run Python REPL, import functions, call `create_user("test@example.com", "password123")` → user created in MongoDB Atlas

**User Test Prompt:**
> "Open a Python REPL, import the user CRUD functions, and create a test user. Check MongoDB Atlas to confirm the user document exists."

#### Task 2: Implement JWT token generation and validation
**Actions:**
- Create `backend/auth/jwt.py` with functions:
  - `create_access_token(user_id)` — generate JWT with expiry from `JWT_EXPIRES_IN`
  - `verify_token(token)` — decode and validate JWT, return user_id
- Use `python-jose` library with `JWT_SECRET` from env

**Manual Test Step:**
- Run Python REPL, generate token, decode it → see user_id in payload

**User Test Prompt:**
> "In a Python REPL, generate a JWT token and then decode it. Confirm the user_id is present in the payload."

#### Task 3: Implement signup endpoint
**Actions:**
- Create `backend/routers/auth.py` with FastAPI router
- Add `POST /api/v1/auth/signup` endpoint:
  - Validate email format and password length (min 8 chars)
  - Check email uniqueness
  - Create user with hashed password
  - Return user object (without password)
- Mount router in `main.py` at `/api/v1/auth`

**Manual Test Step:**
- Use frontend signup form at `/register` → enter email/password → submit → see success message

**User Test Prompt:**
> "Go to http://localhost:3000/register, enter an email and password (min 8 chars), and submit. You should see a success message."

#### Task 4: Implement login endpoint
**Actions:**
- Add `POST /api/v1/auth/login` endpoint in `auth.py`:
  - Validate credentials against stored user
  - Generate JWT token on success
  - Return token and user object
- Update frontend to store token in localStorage

**Manual Test Step:**
- Use frontend login form at `/login` → enter credentials → submit → redirected to dashboard

