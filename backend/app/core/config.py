from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FCM_SERVER_KEY: str = ""

    # APNs configuration
    APNS_KEY_ID: str = ""
    APNS_TEAM_ID: str = ""
    APNS_BUNDLE_ID: str = ""
    APNS_KEY_PATH: str = ""
    APNS_USE_SANDBOX: bool = True


settings = Settings()
