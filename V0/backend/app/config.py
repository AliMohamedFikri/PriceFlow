import os

class Settings:
    PROJECT_NAME: str = "PriceFlow API"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database configuration
    # By default, use sqlite in the backend directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_PATH: str = os.path.join(BASE_DIR, "priceflow.db")
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH}"
    
    # JWT security settings
    # For local dev / demo, use a static key. In production, this would be an env var.
    SECRET_KEY: str = "priceflow_super_secret_graduation_project_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for seamless demo
    
    # Path to original workspace files for local parsing
    # The parent of the 'backend' folder will contain the raw HTML files
    WORKSPACE_DIR: str = os.path.dirname(BASE_DIR)

settings = Settings()
