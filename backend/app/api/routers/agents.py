from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.db.models import Agent, MemoryMetadata, Hypothesis

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


@router.get("")
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return [
        {
            "id": a.id,
            "name": a.name,
            "profession": a.profession,
            "age_stage": a.age_stage,
            "location_id": a.location_id,
            "current_activity": a.current_activity,
            "mood": a.mood,
            "energy": a.energy,
            "hunger": a.hunger,
            "social": a.social,
            "curiosity": a.curiosity,
        }
        for a in agents
    ]


@router.get("/{agent_id}")
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        return {"error": "Agent not found"}, 404

    memories = (
        db.query(MemoryMetadata)
        .filter(MemoryMetadata.owner_agent_id == agent_id)
        .order_by(MemoryMetadata.day_recorded.desc())
        .limit(100)
        .all()
    )

    hypotheses = db.query(Hypothesis).filter(Hypothesis.creator_id == agent_id).all()

    return {
        "id": agent.id,
        "name": agent.name,
        "profession": agent.profession,
        "age_stage": agent.age_stage,
        "personality": agent.baseline_personality,
        "communication_style": agent.communication_style,
        "location_id": agent.location_id,
        "current_activity": agent.current_activity,
        "mood": agent.mood,
        "needs": {
            "energy": agent.energy,
            "hunger": agent.hunger,
            "social": agent.social,
            "curiosity": agent.curiosity,
        },
        "memories": [
            {
                "id": m.id,
                "summary": m.summary,
                "type": m.memory_type,
                "importance": m.importance,
                "source_agent": m.source_agent_id,
                "day": m.day_recorded,
                "time": m.time_recorded,
            }
            for m in memories
        ],
        "hypotheses": [
            {
                "id": h.id,
                "title": h.title,
                "description": h.description,
                "status": h.validation_status,
                "day_created": h.day_created,
            }
            for h in hypotheses
        ],
    }
