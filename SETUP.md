# UpdateQ - Setup Guide

This guide will help you set up and run the UpdateQ application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.13+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **MongoDB Atlas Account** (or connection string)
- **Firecrawl API Key** - Get from [Firecrawl](https://firecrawl.dev)
- **Claude API Key** - Get from [Anthropic](https://console.anthropic.com/)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/evi13van/UpdateQ.git
cd UpdateQ
```

---

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note:** If you're using a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2.3 Create Environment File

Create a `.env` file in the `backend/` directory:

```bash
# Windows PowerShell
New-Item -Path .env -ItemType File

# Or create manually: backend/.env
```

### 2.4 Configure Environment Variables

Open `backend/.env` and add the following (replace with your actual values):

```env
APP_ENV=development
PORT=8000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/updateq?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long-random-string
JWT_EXPIRES_IN=86400
CORS_ORIGINS=http://localhost:3000
CLAUDE_API_KEY=sk-ant-api03-your-claude-api-key-here
FIRECRAWL_API_KEY=fc-your-firecrawl-api-key-here
```

**Important Notes:**
- **MONGODB_URI**: Replace with your MongoDB Atlas connection string (database name should be `updateq`)
- **JWT_SECRET**: Generate a secure random string (minimum 32 characters). You can use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- **CLAUDE_API_KEY**: Get from [Anthropic Console](https://console.anthropic.com/)
- **FIRECRAWL_API_KEY**: Get from [Firecrawl](https://firecrawl.dev) (format: `fc-...`)

### 2.5 Verify Backend Setup

Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
Connected to MongoDB Atlas
```

Test the health endpoint:
- Open browser: `http://localhost:8000/healthz`
- Should return: `{"status":"healthy","database":"connected"}`

If everything works, stop the server (Ctrl+C) and proceed to frontend setup.

---

## Step 3: Frontend Setup

### 3.1 Navigate to Frontend Directory

Open a new terminal window and:

```bash
cd frontend
```

### 3.2 Install Node Dependencies

```bash
npm install
```

### 3.3 Create Environment File

Create a `.env.local` file in the `frontend/` directory:

```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File

# Or create manually: frontend/.env.local
```

### 3.4 Configure Frontend Environment

Open `frontend/.env.local` and add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Note:** This tells the frontend where to find the backend API.

---

## Step 4: Run the Application

### 4.1 Start Backend Server

In your first terminal (backend directory):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Keep this running. You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
Connected to MongoDB Atlas
```

### 4.2 Start Frontend Server

In your second terminal (frontend directory):

```bash
cd frontend
npm run dev
```

Keep this running. You should see:
```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
```

### 4.3 Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Step 5: Test the Application

### 5.1 Register a New Account

1. Click "Get Started" or navigate to `/register`
2. Enter your email and password (minimum 8 characters)
3. Submit the form
4. You should be automatically logged in and redirected

### 5.2 Run Your First Analysis

1. Click "New Review" or navigate to `/analyze`
2. Enter test URLs (one per line, up to 20):
   ```
   https://www.bankrate.com/mortgages/mortgage-rates/
   https://www.nerdwallet.com/mortgages/mortgage-rates
   ```
3. Fill in Domain Context:
   - **What is this content about?**: `Mortgage rates and home loan guides for US borrowers`
   - **What specific entities should we check?**: `Interest rates, loan limits, tax deadlines, product names`
   - **What makes information stale?**: `Rates older than 1 month, references to 2022 or earlier, expired deadlines`
4. Click "Start Review"
5. Wait for processing (should take 30-60 seconds per URL)
6. View results on the results page

### 5.3 Verify Features

- ✅ View analysis history at `/history`
- ✅ Export results to CSV
- ✅ Assign issues to writers at `/assignments`
- ✅ Add writers and create manual tasks

---

## Troubleshooting

### Backend Issues

**Problem: MongoDB connection fails**
- Check your `MONGODB_URI` in `.env`
- Verify your IP is whitelisted in MongoDB Atlas
- Ensure database name is `updateq`

**Problem: "Module not found" errors**
- Run: `pip install -r requirements.txt` again
- Make sure you're in the `backend/` directory
- Check if virtual environment is activated

**Problem: Claude API errors**
- Verify `CLAUDE_API_KEY` is correct in `.env`
- Check your Anthropic account has API access
- Ensure you have credits/quota available

**Problem: Firecrawl errors**
- Verify `FIRECRAWL_API_KEY` is correct (starts with `fc-`)
- Check your Firecrawl account status
- Ensure you have credits/quota available

### Frontend Issues

**Problem: "Cannot connect to API" errors**
- Verify backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Look for CORS errors in browser console
- Ensure backend CORS_ORIGINS includes `http://localhost:3000`

**Problem: Build errors**
- Delete `node_modules` and `.next` folder
- Run: `npm install` again
- Check Node.js version: `node --version` (should be 18+)

**Problem: Authentication not working**
- Clear browser localStorage
- Check backend JWT_SECRET is set
- Verify backend auth endpoints are accessible

---

## Environment Variables Reference

### Backend (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 chars) |
| `CLAUDE_API_KEY` | Yes | Anthropic Claude API key |
| `FIRECRAWL_API_KEY` | Yes | Firecrawl API key |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: http://localhost:3000) |
| `PORT` | No | Backend port (default: 8000) |
| `JWT_EXPIRES_IN` | No | JWT expiration in seconds (default: 86400 = 24 hours) |

### Frontend (.env.local)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |

---

## Development Workflow

1. **Backend changes**: Server auto-reloads with `--reload` flag
2. **Frontend changes**: Next.js auto-reloads in development mode
3. **Database changes**: Changes persist in MongoDB Atlas
4. **Environment changes**: Restart servers after changing `.env` files

---

## Need Help?

- Check the logs in both terminal windows for error messages
- Verify all environment variables are set correctly
- Ensure both servers are running
- Check MongoDB Atlas connection status
- Verify API keys are valid and have quota

---

## Quick Start Checklist

- [ ] Python 3.13+ installed
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env.local` file created with API URL
- [ ] MongoDB Atlas connection string configured
- [ ] Claude API key configured
- [ ] Firecrawl API key configured
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] Application accessible at http://localhost:3000

