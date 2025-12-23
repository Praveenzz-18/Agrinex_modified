from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    APPWRITE_ENDPOINT: str = "https://cloud.appwrite.io/v1"
    APPWRITE_PROJECT_ID: str = ""
    APPWRITE_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
