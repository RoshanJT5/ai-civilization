from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.connection import Base


class SimulationSettings(Base):
    __tablename__ = "simulation_settings"

    id = Column(Integer, primary_key=True)
    current_day = Column(Integer, default=1)
    current_time = Column(String, default="08:00")
    weather = Column(String, default="sunny")
    simulation_speed = Column(String, default="paused")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    profession = Column(String, nullable=False)
    age_stage = Column(String, default="adult")
    baseline_personality = Column(Text, default="{}")
    communication_style = Column(String, default="neutral")
    location_id = Column(String, ForeignKey("locations.id"))
    current_activity = Column(String, default="idle")
    mood = Column(String, default="neutral")
    energy = Column(Integer, default=100)
    hunger = Column(Integer, default=50)
    social = Column(Integer, default=50)
    curiosity = Column(Integer, default=50)

    location = relationship("Location", backref="agents")


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True)
    agent_a_id = Column(String, ForeignKey("agents.id"))
    agent_b_id = Column(String, ForeignKey("agents.id"))
    closeness = Column(Integer, default=30)
    trust = Column(Integer, default=30)
    interaction_count = Column(Integer, default=0)


class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)


class RoutineBlock(Base):
    __tablename__ = "routine_blocks"

    id = Column(Integer, primary_key=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    activity = Column(String, nullable=False)
    location_id = Column(String, ForeignKey("locations.id"))


class WorldResource(Base):
    __tablename__ = "world_resources"

    id = Column(String, primary_key=True)
    quantity = Column(Integer, default=0)


class MemoryMetadata(Base):
    __tablename__ = "memory_metadata"

    id = Column(Integer, primary_key=True)
    external_memory_id = Column(String, default="")
    owner_agent_id = Column(String, ForeignKey("agents.id"))
    memory_type = Column(String, default="episodic")
    summary = Column(String, default="")
    importance = Column(Integer, default=5)
    emotional_weight = Column(Integer, default=5)
    source_agent_id = Column(String, ForeignKey("agents.id"), nullable=True)
    location_id = Column(String, ForeignKey("locations.id"), nullable=True)
    day_recorded = Column(Integer)
    time_recorded = Column(String)


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(Integer, primary_key=True)
    creator_id = Column(String, ForeignKey("agents.id"))
    title = Column(String)
    description = Column(String)
    validation_status = Column(String, default="proposed")
    validator_id = Column(String, ForeignKey("agents.id"), nullable=True)
    day_created = Column(Integer)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    hypothesis_id = Column(Integer, ForeignKey("hypotheses.id"))
    title = Column(String)
    description = Column(String)
    progress = Column(Integer, default=0)
    required_wood = Column(Integer, default=10)
    required_tools = Column(Integer, default=2)
    current_wood = Column(Integer, default=0)
    current_tools = Column(Integer, default=0)
    status = Column(String, default="pending")
