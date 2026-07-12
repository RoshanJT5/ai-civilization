from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supermemory_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: str = "groq"
    database_url: str = "sqlite:///./civilization.db"
    sim_tick_interval_realtime: float = 5.0
    sim_tick_interval_accelerated: float = 1.0
    sim_tick_interval_demo: float = 0.1

    class Config:
        env_file = ".env"


settings = Settings()
