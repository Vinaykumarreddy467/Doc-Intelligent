"""DocuIntell Configuration"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "phi3"
    upload_dir: str = "./uploads"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.upload_dir, exist_ok=True)
