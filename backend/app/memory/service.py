import logging
from sqlalchemy.orm import Session

from app.db.models import MemoryMetadata, Agent
from app.memory.supermemory_client import supermemory

logger = logging.getLogger(__name__)


def record_observation(
    db: Session,
    agent_id: str,
    event_text: str,
    importance: int = 5,
    emotional_weight: int = 5,
    location_id: str | None = None,
    day: int = 1,
    time_str: str = "08:00",
) -> str | None:
    ext_id = supermemory.add_memory(agent_id, event_text)
    meta = MemoryMetadata(
        external_memory_id=ext_id or "",
        owner_agent_id=agent_id,
        memory_type="episodic",
        summary=event_text[:200],
        importance=importance,
        emotional_weight=emotional_weight,
        location_id=location_id,
        day_recorded=day,
        time_recorded=time_str,
    )
    db.add(meta)
    db.commit()
    logger.info(f"Memory recorded: agent={agent_id} type=episodic id={ext_id}")
    return ext_id


def record_social_memory(
    db: Session,
    listener_id: str,
    speaker_id: str,
    summary: str,
    day: int = 1,
    time_str: str = "08:00",
) -> str | None:
    speaker = db.query(Agent).filter(Agent.id == speaker_id).first()
    speaker_name = speaker.name if speaker else speaker_id
    derived = f"[Heard from {speaker_name}]: {summary}"

    ext_id = supermemory.add_memory(listener_id, derived)
    meta = MemoryMetadata(
        external_memory_id=ext_id or "",
        owner_agent_id=listener_id,
        memory_type="social",
        summary=derived[:200],
        importance=6,
        emotional_weight=4,
        source_agent_id=speaker_id,
        day_recorded=day,
        time_recorded=time_str,
    )
    db.add(meta)
    db.commit()
    logger.info(
        f"Social memory: listener={listener_id} speaker={speaker_id} id={ext_id}"
    )
    return ext_id


def record_hypothesis(
    db: Session,
    creator_id: str,
    title: str,
    description: str,
    day: int = 1,
) -> str | None:
    content = f"HYPOTHESIS: {title} - {description}"
    ext_id = supermemory.add_memory(creator_id, content)
    meta = MemoryMetadata(
        external_memory_id=ext_id or "",
        owner_agent_id=creator_id,
        memory_type="hypothesis",
        summary=content[:200],
        importance=8,
        emotional_weight=7,
        day_recorded=day,
    )
    db.add(meta)
    db.commit()
    return ext_id


def retrieve_agent_context(
    db: Session, agent_id: str, query: str, top_k: int = 5
) -> list[dict]:
    results = supermemory.search_memories(agent_id, query, top_k)
    return results


def get_memories_for_agent(
    db: Session, agent_id: str, limit: int = 20
) -> list[MemoryMetadata]:
    return (
        db.query(MemoryMetadata)
        .filter(MemoryMetadata.owner_agent_id == agent_id)
        .order_by(MemoryMetadata.day_recorded.desc())
        .limit(limit)
        .all()
    )
