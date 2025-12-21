# UpdateQ - Content Freshness Analysis Platform

UpdateQ helps content managers identify outdated information across web pages through AI-powered detection.

## Project Structure

```
UpdateQ/
├── backend/          # FastAPI backend
│   ├── auth/        # Authentication (JWT)
│   ├── crud/        # Database operations
│   ├── models/      # Pydantic models
│   ├── routers/     # API endpoints
│   ├── services/    # Content extraction & detection
│   ├── config.py    # Settings management
│   ├── database.py  # MongoDB connection
│   └── main.py      # FastAPI app
├── frontend/         # Next.js frontend
│   ├── app/         # Next.js app router pages
│   ├── components/  # React components
│   └── lib/         # Utilities & API service
└── README.md
```

## Prerequisites

- Python 3.13+
- Node.js 18+
- MongoDB Atlas account (connection URI provided)

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment variables setup:**
   - Create `backend/.env` file with required variables (see `.env.example`)
   - Required: `MONGODB_URI`, `JWT_SECRET`, `CLAUDE_API_KEY`, `FIRECRAWL_API_KEY`

5. **Configure environment variables in `backend/.env`:**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Secure random string (min 32 characters)
   - `CLAUDE_API_KEY`: Your Anthropic Claude API key
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key for web scraping
   - `CORS_ORIGINS`: Frontend URL (default: http://localhost:3000)

6. **Start the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`
   - Health check: `http://localhost:8000/healthz`
   - API docs: `http://localhost:8000/docs`

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables are already configured in `.env.local`:**
   - API URL: `http://localhost:8000/api/v1`

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Analysis
- `POST /api/v1/analysis/start` - Submit URLs for analysis
- `GET /api/v1/analysis/runs/{runId}` - Get analysis results
- `GET /api/v1/analysis/runs` - List all analysis runs
- `DELETE /api/v1/analysis/runs/{runId}` - Delete analysis run
- `GET /api/v1/analysis/runs/{runId}/export` - Export results as CSV
- `PATCH /api/v1/analysis/runs/{runId}/issues/{issueId}` - Update issue
- `GET /api/v1/analysis/issues` - Get all issues
- `POST /api/v1/analysis/manual-task` - Create manual task

### Writers
- `GET /api/v1/writers` - Get writers list
- `POST /api/v1/writers` - Add new writer

## Testing the Application

1. **Start both servers** (backend on :8000, frontend on :3000)

2. **Register a new account:**
   - Go to `http://localhost:3000/register`
   - Enter email and password (min 8 characters)
   - Submit to create account

3. **Login:**
   - Go to `http://localhost:3000/login`
   - Enter your credentials
   - You'll be redirected to the dashboard

4. **Run an analysis:**
   - Click "New Analysis" or go to `/analyze`
   - Paste URLs (1-20, one per line)
   - Fill in domain context form
   - Submit and wait for processing
   - View results with detected issues

5. **Export results:**
   - From results page, click "Export to CSV"
   - Open in Excel/Google Sheets
   - Copy/paste URL blocks for writer handoff

6. **Manage assignments:**
   - Go to `/assignments`
   - Add writers
   - Assign issues to writers
   - Track status updates

## Important Notes

### API Keys Required
The application requires two API keys for full functionality:

1. **Claude API Key** (Anthropic):
   - Get from https://console.anthropic.com/
   - Required for AI-powered stale content detection
   - Add to `backend/.env` as `CLAUDE_API_KEY`

2. **Firecrawl API Key**:
   - Get from https://firecrawl.dev/
   - Required for web content extraction
   - Add to `backend/.env` as `FIRECRAWL_API_KEY`

Without valid API keys, the respective services will fail gracefully and return appropriate error messages.

### MongoDB Connection
The MongoDB URI is already configured to connect to your Atlas cluster:
```
mongodb+srv://yseidl_db_user:SslKY2zzHjH0kmkM@cluster0.pozigxt.mongodb.net/?appName=Cluster0
```

The database name is `updateq` with collections:
- `users` - User accounts
- `analysis_runs` - Analysis runs and results
- `writers` - Writer information

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3000` (frontend dev server)
- `http://localhost:3001` (alternative port)

## Development Workflow

1. Make changes to backend code
2. FastAPI auto-reloads (if using `--reload` flag)
3. Test via frontend UI or API docs at `/docs`
4. Make changes to frontend code
5. Next.js auto-reloads
6. Test in browser

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.13+)
- Verify virtual environment is activated
- Check MongoDB connection in `.env`

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### CORS errors
- Verify backend CORS_ORIGINS includes frontend URL
- Check browser console for exact error
- Ensure backend is running on port 8000

### Authentication issues
- Check JWT_SECRET is set in backend `.env`
- Clear browser localStorage
- Try registering a new account

## Production Deployment

For production deployment:
1. Update `JWT_SECRET` to a secure random string (min 32 chars)
2. Add valid `CLAUDE_API_KEY`
3. Update `CORS_ORIGINS` to include production frontend URL
4. Set `APP_ENV=production`
5. Use a production WSGI server (e.g., gunicorn)
6. Build frontend: `npm run build`
7. Deploy frontend with `npm start`

## License

Proprietary - All rights reserved