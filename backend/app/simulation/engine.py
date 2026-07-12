import asyncio
import json
from datetime import datetime
from typing import Callable

from sqlalchemy.orm import Session

from app.db.connection import SessionLocal
from app.db.models import (
    SimulationSettings,
    Agent,
    WorldResource,
    Location,
)
from app.simulation.clock import SimulationClock
from app.simulation.routine import get_current_routine
import random
from app.ai.orchestrator import orchestrator
from app.memory.service import record_observation, record_hypothesis, record_social_memory, retrieve_agent_context


class SimulationEngine:
    def __init__(self, on_state_change: Callable[[dict], None] | None = None):
        self.clock = SimulationClock()
        self.on_state_change = on_state_change
        self.speed = "paused"
        self.running = False
        self._tick_count = 0
        self._drought_triggered = False
        self._crop_moisture = 80.0

    def load_state(self, db: Session):
        settings = db.query(SimulationSettings).first()
        if settings:
            self.clock = SimulationClock(
                current_day=settings.current_day,
                current_time=settings.current_time,
            )
            self.speed = settings.simulation_speed
            self._weather = settings.weather

    def save_state(self, db: Session):
        settings = db.query(SimulationSettings).first()
        if settings:
            settings.current_day = self.clock.current_day
            settings.current_time = self.clock.get_time_str()
            settings.weather = self._weather
            settings.simulation_speed = self.speed
            db.commit()

    async def start(self):
        self.running = True
        while self.running:
            if self.speed != "paused":
                await self._process_tick()
                interval = self._get_tick_interval()
                await asyncio.sleep(interval)
            else:
                await asyncio.sleep(0.1)

    def stop(self):
        self.running = False

    def set_speed(self, speed: str):
        self.speed = speed

    def _get_tick_interval(self) -> float:
        intervals = {
            "realtime": 5.0,
            "accelerated": 1.0,
            "demo": 0.1,
        }
        return intervals.get(self.speed, 5.0)

    async def _process_tick(self):
        self.clock.tick()
        self._tick_count += 1
        db = SessionLocal()
        try:
            state_diff = self._compute_tick_changes(db)
            self.save_state(db)
            if self.on_state_change:
                self.on_state_change(state_diff)
        finally:
            db.close()

    def _compute_tick_changes(self, db: Session) -> dict:
        changes = {
            "tick": self._tick_count,
            "clock": self.clock.get_state(),
            "agents": {},
            "events": [],
        }

        self._update_weather(changes)
        self._update_crop_moisture(changes)
        self._update_agent_states(db, changes)

        return changes

    def _update_weather(self, changes: dict):
        if self.clock.current_day >= 3 and not self._drought_triggered:
            self._weather = "drought"
            self._drought_triggered = True
            changes["events"].append(
                {
                    "type": "weather_change",
                    "value": "drought",
                    "day": self.clock.current_day,
                }
            )
        elif self.clock.current_day < 3:
            self._weather = "sunny"
        changes["weather"] = self._weather

    def _update_crop_moisture(self, changes: dict):
        if self._weather == "drought":
            self._crop_moisture = max(5, self._crop_moisture - 2)
        else:
            self._crop_moisture = min(100, self._crop_moisture + 1)

        if self._crop_moisture < 15 and not any(
            e.get("type") == "crop_warning" for e in changes["events"]
        ):
            changes["events"].append(
                {
                    "type": "crop_warning",
                    "moisture": self._crop_moisture,
                    "day": self.clock.current_day,
                }
            )

        changes["crop_moisture"] = self._crop_moisture

    def _update_agent_states(self, db: Session, changes: dict):
        agents = db.query(Agent).all()
        for agent in agents:
            routine = get_current_routine(db, agent.id, self.clock.get_time_str())
            old_location = agent.location_id
            old_activity = agent.current_activity

            if routine:
                agent.location_id = routine.location_id
                agent.current_activity = routine.activity
            else:
                agent.current_activity = "idle"

            agent.energy = max(0, agent.energy - 1)
            agent.hunger = min(100, agent.hunger + 1)

            if (
                "MEAL" in agent.current_activity
                or "LUNCH" in agent.current_activity
                or "DINNER" in agent.current_activity
            ):
                agent.hunger = max(0, agent.hunger - 20)
                agent.energy = min(100, agent.energy + 10)

            if "SLEEP" in agent.current_activity:
                agent.energy = min(100, agent.energy + 10)
                agent.hunger = min(100, agent.hunger + 2)

            location_move = agent.location_id != old_location
            
            if location_move:
                changes["events"].append({
                    "type": "MOVEMENT",
                    "agent_id": agent.id,
                    "summary": f"Moved to {agent.location_id.replace('_', ' ').title()}",
                    "day": self.clock.current_day,
                    "time": self.clock.get_time_str()
                })
                
            if agent.current_activity != old_activity:
                changes["events"].append({
                    "type": "TASK_STARTED",
                    "agent_id": agent.id,
                    "summary": f"Started {agent.current_activity.replace('_', ' ')}",
                    "day": self.clock.current_day,
                    "time": self.clock.get_time_str()
                })

            changes["agents"][agent.id] = {
                "location_id": agent.location_id,
                "current_activity": agent.current_activity,
                "energy": agent.energy,
                "hunger": agent.hunger,
                "moved": location_move,
            }

        # -----------------------------
        # LLM Cognition (1 Agent / Tick)
        # -----------------------------
        if agents:
            thinking_agent = random.choice(agents)
            
            if thinking_agent.name == "Aadi" and "REFLECTION" in thinking_agent.current_activity:
                # Custom loop for Aadi's hypothesis generation
                raw_mems = retrieve_agent_context(db, thinking_agent.id, "recent interesting events", top_k=5)
                mem_str = "\n".join([m.get("content", "") for m in raw_mems])
                hypothesis = orchestrator.generate_hypothesis(thinking_agent.profession, mem_str)
                if hypothesis:
                    record_hypothesis(db, thinking_agent.id, hypothesis.title, hypothesis.description, self.clock.current_day)
                    changes["events"].append({
                        "type": "NEW_IDEA",
                        "agent_id": thinking_agent.id,
                        "summary": hypothesis.title,
                        "content": hypothesis.description,
                        "day": self.clock.current_day,
                        "time": self.clock.get_time_str()
                    })
            else:
                # Conversation Check
                social_activities = ["LEISURE", "REST", "SOCIALIZING", "IDLE", "LUNCH", "DINNER", "PLAY"]
                is_thinking_social = any(sa in thinking_agent.current_activity for sa in social_activities)
                
                conversation_partner = None
                potential_partners = [
                    a for a in agents 
                    if a.id != thinking_agent.id 
                    and a.location_id == thinking_agent.location_id
                ]
                
                if potential_partners:
                    free_partners = [p for p in potential_partners if any(sa in p.current_activity for sa in social_activities)]
                    
                    if free_partners:
                        conversation_partner = random.choice(free_partners)
                    else:
                        conversation_partner = random.choice(potential_partners)
                
                if conversation_partner:
                    # Execute Conversation
                    mem_a_raw = retrieve_agent_context(db, thinking_agent.id, "recent life events", top_k=3)
                    mem_b_raw = retrieve_agent_context(db, conversation_partner.id, "recent life events", top_k=3)
                    
                    mem_a_str = "\n".join([m.get("content", "") for m in mem_a_raw])
                    mem_b_str = "\n".join([m.get("content", "") for m in mem_b_raw])
                    
                    conv = orchestrator.generate_conversation(
                        f"{thinking_agent.name} the {thinking_agent.profession} ({thinking_agent.baseline_personality})",
                        f"{conversation_partner.name} the {conversation_partner.profession} ({conversation_partner.baseline_personality})",
                        mem_a_str,
                        mem_b_str
                    )
                    
                    if conv:
                        # Record Memories with Topic for better context
                        mem_text_a = f"Topic: {conv.topic}. They said: '{conv.agent_b_reply}'"
                        mem_text_b = f"Topic: {conv.topic}. They said: '{conv.agent_a_speech}'"
                        
                        record_social_memory(db, thinking_agent.id, conversation_partner.id, mem_text_a, self.clock.current_day, self.clock.get_time_str())
                        record_social_memory(db, conversation_partner.id, thinking_agent.id, mem_text_b, self.clock.current_day, self.clock.get_time_str())
                        
                        # Add to event feed
                        changes["events"].append({
                            "type": "CONVERSATION",
                            "agent_id": thinking_agent.id,
                            "summary": f"Chatted with {conversation_partner.name} about {conv.topic}",
                            "content": f"{thinking_agent.name}: {conv.agent_a_speech}\n{conversation_partner.name}: {conv.agent_b_reply}",
                            "day": self.clock.current_day,
                            "time": self.clock.get_time_str()
                        })
                        
                        # Set last speech for UI
                        changes["agents"][thinking_agent.id]["last_speech"] = conv.agent_a_speech
                        changes["agents"][conversation_partner.id]["last_speech"] = conv.agent_b_reply
                        
                else:
                    # Solitary Action
                    mem_raw = retrieve_agent_context(db, thinking_agent.id, "current tasks and feelings", top_k=3)
                    mem_str = "\n".join([m.get("content", "") for m in mem_raw])
                    
                    context = f"At {thinking_agent.location_id}, feeling energy {thinking_agent.energy}, doing {thinking_agent.current_activity}."
                    action = orchestrator.decide_action(f"{thinking_agent.name} the {thinking_agent.profession}", context, memories=mem_str)
                    
                    if action and action.speech_bubble:
                        record_observation(db, thinking_agent.id, action.speech_bubble, 5, 5, thinking_agent.location_id, self.clock.current_day, self.clock.get_time_str())
                        changes["events"].append({
                            "type": "MESSAGE_SPOKEN",
                            "agent_id": thinking_agent.id,
                            "summary": action.speech_bubble[:30] + "...",
                            "content": action.speech_bubble,
                            "day": self.clock.current_day,
                            "time": self.clock.get_time_str()
                        })
                        
                        # Set last speech for UI
                        changes["agents"][thinking_agent.id]["last_speech"] = action.speech_bubble

        db.commit()

    def trigger_drought(self):
        self._drought_triggered = True
        self._weather = "drought"
        self._crop_moisture = 12
