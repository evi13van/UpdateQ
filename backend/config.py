from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


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


settings = Settings()