from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from database import connect_to_mongo, close_mongo_connection, get_database
from routers import auth, analysis, writers
import sys


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting UpdateQ API...", file=sys.stderr)
    try:
        await connect_to_mongo()
        print("✅ Application startup complete", file=sys.stderr)
    except Exception as e:
        print(f"❌ FATAL: Application startup failed", file=sys.stderr)
        print(f"   Error: {str(e)}", file=sys.stderr)
        raise
    yield
    # Shutdown
    print("🛑 Shutting down UpdateQ API...", file=sys.stderr)
    await close_mongo_connection()


app = FastAPI(title="UpdateQ API", version="1.0.0", lifespan=lifespan)

# CORS middleware
print(f"🌐 Configuring CORS for origins: {settings.cors_origins_list}", file=sys.stderr)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
print("📋 Registering API routers...", file=sys.stderr)
app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(writers.router)
print("✅ All routers registered successfully", file=sys.stderr)


@app.get("/healthz")
async def health_check():
    try:
        db = get_database()
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@app.get("/")
async def root():
    return {"message": "UpdateQ API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    import os
    # Use PORT environment variable for Render compatibility, fallback to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)