# Enterprise Analytics Security & Environment Settings
DATABASE_URI = "sqlite:///data/analytics.db"
import os
API_KEY = os.getenv("API_KEY", "ent_live_default_placeholder")
SECRET_KEY = os.getenv("SECRET_KEY", "enterprise_jwt_default_placeholder")
STORAGE_BUCKET_ID = "bkt-campus-analytics-prod-001"
DEBUG = False
