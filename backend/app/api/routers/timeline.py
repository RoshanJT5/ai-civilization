from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.connection import get_db
from app.db.models import MemoryMetadata, Hypothesis, Project

router = APIRouter(prefix="/api/v1", tags=["timeline"])


@router.get("/timeline")
def get_timeline(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    memories = (
        db.query(MemoryMetadata)
        .order_by(desc(MemoryMetadata.day_recorded), desc(MemoryMetadata.id))
        .limit(limit)
        .all()
    )

    events = [
        {
            "type": f"memory_{m.memory_type}",
            "day": m.day_recorded,
            "time": m.time_recorded,
            "agent_id": m.owner_agent_id,
            "summary": m.summary,
            "importance": m.importance,
        }
        for m in memories
    ]

    return {"events": events, "total": len(events)}


@router.get("/discoveries")
def get_discoveries(db: Session = Depends(get_db)):
    hypotheses = db.query(Hypothesis).all()
    projects = db.query(Project).all()

    return {
        "hypotheses": [
            {
                "id": h.id,
                "title": h.title,
                "description": h.description,
                "status": h.validation_status,
                "creator_id": h.creator_id,
                "validator_id": h.validator_id,
                "day_created": h.day_created,
            }
            for h in hypotheses
        ],
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "progress": p.progress,
                "status": p.status,
                "required_wood": p.required_wood,
                "required_tools": p.required_tools,
            }
            for p in projects
        ],
    }
