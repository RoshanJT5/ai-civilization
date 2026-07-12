from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import SimulationSettings, WorldResource

router = APIRouter(prefix="/api/v1/world", tags=["world"])


@router.get("")
def get_world_state(db: Session = Depends(get_db)):
    settings = db.query(SimulationSettings).first()
    resources = db.query(WorldResource).all()
    return {
        "simulation": {
            "current_day": settings.current_day,
            "current_time": settings.current_time,
            "weather": settings.weather,
            "speed": settings.simulation_speed,
        },
        "resources": {r.id: r.quantity for r in resources},
    }
