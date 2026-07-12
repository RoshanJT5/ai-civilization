from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db, init_db
from app.db.seeding import seed_database
from app.db.models import SimulationSettings

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/simulation")
def get_simulation_settings(db: Session = Depends(get_db)):
    settings = db.query(SimulationSettings).first()
    if not settings:
        return {"speed": "paused", "weather": "sunny", "day": 1, "time": "08:00"}
    return {
        "speed": settings.simulation_speed,
        "weather": settings.weather,
        "day": settings.current_day,
        "time": settings.current_time,
    }


@router.post("/simulation")
def set_simulation_speed(data: dict, db: Session = Depends(get_db)):
    settings = db.query(SimulationSettings).first()
    if not settings:
        return {"error": "No simulation settings found"}, 400

    if "speed" in data:
        valid_speeds = ["realtime", "accelerated", "demo", "paused"]
        if data["speed"] in valid_speeds:
            settings.simulation_speed = data["speed"]

    if "weather" in data:
        settings.weather = data["weather"]

    db.commit()
    return {"status": "ok", "speed": settings.simulation_speed}


@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    init_db()
    seed_database(db)
    return {"status": "ok", "message": "Simulation reset with fresh seed"}


@router.post("/trigger-drought")
def trigger_drought(db: Session = Depends(get_db)):
    settings = db.query(SimulationSettings).first()
    if settings:
        settings.weather = "drought"
        db.commit()
    return {"status": "ok", "weather": "drought"}
