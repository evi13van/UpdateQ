from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import sys


class Settings(BaseSettings):
    app_env: str = "development"
    port: int = 8000
    mongodb_uri: str
    jwt_secret: str
    jwt_expires_in: int = 86400
    cors_origins: str = "http://localhost:3000"
    claude_api_key: str
    firecrawl_api_key: str
    perplexity_api_key: str
    playwright_timeout: int = 15000  # Kept for backward compatibility (not used)

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Add diagnostic logging for configuration loading
try:
    print("🔧 Loading configuration...", file=sys.stderr)
    settings = Settings()
    print(f"✅ Configuration loaded successfully", file=sys.stderr)
    print(f"   - App Environment: {settings.app_env}", file=sys.stderr)
    print(f"   - Port: {settings.port}", file=sys.stderr)
    print(f"   - MongoDB URI: {'***' if settings.mongodb_uri else 'MISSING'}", file=sys.stderr)
    print(f"   - JWT Secret: {'***' if settings.jwt_secret else 'MISSING'}", file=sys.stderr)
    print(f"   - Claude API Key: {'***' if settings.claude_api_key else 'MISSING'}", file=sys.stderr)
    print(f"   - Firecrawl API Key: {'***' if settings.firecrawl_api_key else 'MISSING'}", file=sys.stderr)
    print(f"   - Perplexity API Key: {'***' if settings.perplexity_api_key else 'MISSING'}", file=sys.stderr)
    print(f"   - CORS Origins: {settings.cors_origins}", file=sys.stderr)
except Exception as e:
    print(f"❌ FATAL: Failed to load configuration", file=sys.stderr)
    print(f"   Error Type: {type(e).__name__}", file=sys.stderr)
    print(f"   Error Message: {str(e)}", file=sys.stderr)
    print(f"   This usually means required environment variables are missing", file=sys.stderr)
    raise