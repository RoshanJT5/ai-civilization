from sqlalchemy.orm import Session

from app.db.models import RoutineBlock


def get_current_routine(
    db: Session, agent_id: str, time_str: str
) -> RoutineBlock | None:
    time_minutes = _time_to_minutes(time_str)
    blocks = db.query(RoutineBlock).filter(RoutineBlock.agent_id == agent_id).all()
    for block in blocks:
        start = _time_to_minutes(block.start_time)
        end = _time_to_minutes(block.end_time)
        if start <= end:
            if start <= time_minutes < end:
                return block
        else:
            if time_minutes >= start or time_minutes < end:
                return block
    return None


def get_agents_at_location(db: Session, location_id: str, time_str: str) -> list[str]:
    from app.db.models import Agent

    agents = db.query(Agent).all()
    result = []
    for agent in agents:
        routine = get_current_routine(db, agent.id, time_str)
        if routine and routine.location_id == location_id:
            result.append(agent.id)
    return result


def get_next_location(agent_id: str, db: Session, current_time_str: str) -> str | None:
    blocks = (
        db.query(RoutineBlock)
        .filter(RoutineBlock.agent_id == agent_id)
        .order_by(RoutineBlock.start_time)
        .all()
    )
    current_minutes = _time_to_minutes(current_time_str)

    for block in blocks:
        start = _time_to_minutes(block.start_time)
        if current_minutes < start:
            return block.location_id
    return None


def _time_to_minutes(t: str) -> int:
    parts = t.split(":")
    return int(parts[0]) * 60 + int(parts[1])
