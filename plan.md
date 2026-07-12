# Implementation Plan - Autonomous AI Civilization

> **IMPORTANT:** Before implementation begins, please answer the questions at the bottom of this document regarding LLM provider selection and API keys.

---

## Overview
Build a self-running virtual AI civilization with 10 agents, persistent memory via **Supermemory** (mandatory), SQLite database (no Supabase/auth), FastAPI backend, and React frontend with a 2D map and causal provenance graph.

**Total estimated effort:** ~40-60 hours (6 phases)

---

## Phase 1: Foundation — Backend Core (Est. 8-10 hrs)

### Sprint 1.1: Project Scaffolding & Configuration
- [ ] Initialize Python virtual environment
- [ ] Create project folder structure (`backend/app/...`)
- [ ] Create `requirements.txt` with dependencies:
  - `fastapi`, `uvicorn`, `websockets`
  - `sqlalchemy`, `aiosqlite`
  - `langchain`, `langchain-community`
  - `supermemory` (the Supermemory SDK)
  - `pydantic`, `python-dotenv`
- [ ] Create `core/config.py` — env variable loading (`SUPERMEMORY_API_KEY`, `LLM_API_KEY`, `DATABASE_URL`)
- [ ] Verify Supermemory SDK installation: `pip install supermemory`

### Sprint 1.2: Database Layer
- [ ] Create `db/connection.py` — SQLAlchemy engine + session factory
- [ ] Create `db/models.py` — All ORM models:
  - `SimulationSettings`, `Agent`, `Relationship`, `Location`
  - `RoutineBlock`, `WorldResource`, `MemoryMetadata`
  - `Hypothesis`, `Project`
- [ ] Create `db/seeding.py` — Seed script with:
  - 10 agents with names, professions, personalities
  - 7 locations with x,y coordinates
  - Daily routine blocks for each agent (24-hour schedule)
  - Initial resources (wood: 10, tools: 2, water: 100)
  - Default simulation settings (Day 1, 08:00, sunny, paused)
- [ ] Write test: verify seed data integrity

### Sprint 1.3: Simulation Engine
- [ ] Create `simulation/clock.py`:
  - Tick counter, time advancement (5-min increments)
  - Day progression logic
  - 4 speed modes: realtime (5s/tick), accelerated (1s/tick), demo (100ms/tick), paused
- [ ] Create `simulation/routine.py`:
  - Schedule lookup per agent based on current time
  - Deterministic location movement (no LLM calls)
  - Co-location detection (which agents are at same location)
- [ ] Create `simulation/engine.py`:
  - Master tick orchestrator
  - Needs decay formulas (Energy -2/tick, Hunger +1/tick, Social -1/tick)
  - Weather system (deterministic: sunny until Day 3 → drought)
  - Crop moisture simulation (starts 80%, decays to 12% by Day 3)
  - Trigger detection for LLM cognition events
- [ ] Write test: tick 100 iterations, verify clock progression and needs values

---

## Phase 2: Supermemory Integration (Est. 6-8 hrs)

### Sprint 2.1: Supermemory Client
- [ ] Create `memory/supermemory_client.py`:
  - Initialize `Supermemory()` client from env key
  - `add_memory(agent_id, content, metadata)` → calls `client.add(content=..., containerTags=[f"agent_{agent_id}"])`, returns `external_memory_id`
  - `search_memories(agent_id, query, top_k=5)` → calls `client.search.documents(q=query, containerTags=[f"agent_{agent_id}"])`, returns ranked results
  - `add_public_knowledge(content)` → stores under `containerTags=["public_library"]`
  - `search_public(query)` → searches public library container
  - `add_world_event(content)` → stores under `containerTags=["world_state"]`
- [ ] Implement retry wrapper (3 attempts, exponential backoff, 5s timeout)
- [ ] Implement fallback: if Supermemory API fails, use SQLite keyword search
- [ ] Log all Supermemory operations with timing

### Sprint 2.2: Memory Service
- [ ] Create `memory/service.py`:
  - `record_observation(agent_id, event_text, importance, location)`:
    1. Call `supermemory_client.add_memory(agent_id, event_text)`
    2. Save `MemoryMetadata` row in SQLite with returned `external_memory_id`
  - `record_social_memory(listener_id, speaker_id, summary)`:
    1. Create derived summary (prepend: `"[Heard from {speaker_name}]: {summary}"`)
    2. Call `supermemory_client.add_memory(listener_id, derived_text)`
    3. Save metadata with `source_agent_id=speaker_id`
  - `retrieve_context(agent_id, query)`:
    1. Search private: `supermemory_client.search_memories(agent_id, query)`
    2. Search public: `supermemory_client.search_public(query)`
    3. Merge results, rank by score, return top 5
  - `search_by_metadata(agent_id, memory_type, limit=10)` — fallback query via SQLite

### Sprint 2.3: Integration Test
- [ ] Write integration test: add memory → search memory → verify match
- [ ] Test social memory transfer with 2 agents
- [ ] Test public library search
- [ ] Test error handling (invalid API key, timeout)

---

## Phase 3: AI Cognition Layer (Est. 10-12 hrs)

### Sprint 3.1: LangChain Setup
- [ ] Create `ai/orchestrator.py`:
  - Initialize LLM client (configurable: OpenAI / Grok / Gemini — user to confirm)
  - Define Pydantic output schemas:
    - `AgentActionSchema`: `action_type: str, target_id: Optional[str], speech_bubble: Optional[str], reflection_thought: Optional[str], mood_change: int`
    - `HypothesisSchema`: `title: str, description: str, supporting_memory_ids: List[str], confidence: float`
    - `ValidationSchema`: `feasible: bool, rationale: str, required_resources: Dict[str, int]`
  - Create LangChain prompt templates with structured output parsers

### Sprint 3.2: Decision Chain
- [ ] Create `ai/prompts.py`:
  - **Agent Identity Template:** Name, profession, personality, communication style, current needs
  - **Decision Prompt:** "You are {name}, the {profession}. Current time: {time}. Location: {location}. Needs: {needs}. Recent memories: {memories}. What do you do next?"
  - Output: `AgentActionSchema`
- [ ] Wire Decision Chain into engine: triggered when agent is at a trigger location/time

### Sprint 3.3: Conversation Chain
- [ ] **Conversation Prompt:** "Agent A ({personality}) and Agent B ({personality}) are at {location}. Agent A wants to discuss: {topic}. Generate a natural conversation."
  - Output: multi-turn dialogue with summaries
- [ ] Wire into engine: triggered when 2+ agents co-located at meal times

### Sprint 3.4: Reflection Chain (Child Agent — Aadi)
- [ ] **Nightly Reflection Prompt:** "You are Aadi, a curious 10-year-old. Today you learned: {memories_from_supermemory}. Do any of these connect in an interesting way? Can you form a hypothesis?"
  - Searches Supermemory for both agricultural and engineering memories
  - Output: `HypothesisSchema`
- [ ] Trigger: automatically at 20:00 daily if Aadi has new cross-domain memories
- [ ] Save hypothesis to `hypotheses` table in SQLite

### Sprint 3.5: Validation Chain
- [ ] **Validation Prompt:** "You are {expert_name}, the {profession}. You are evaluating this proposal: {hypothesis}. Available resources: {resources}. Is this feasible? What resources are needed?"
  - Output: `ValidationSchema`
- [ ] **Leadership Approval Prompt:** "You are Rohan, the Leader. Arun has validated this proposal: {validated_hypothesis}. Do you approve?"
  - Output: `approved: bool`, `notes: str`
- [ ] On approval: create `Project` record in SQLite

### Sprint 3.6: Priority Queue & Throttling
- [ ] Implement cognitive task queue with priority levels:
  - HIGH: Validation chains, Reflection chains
  - MEDIUM: Decision chains (triggered by anomalies)
  - LOW: Conversation chains, decorative decisions
- [ ] Throttle to max 1 LLM call per tick
- [ ] Cache identical context results within same day
- [ ] Fallback deterministic behavior on LLM failure

---

## Phase 4: API & Realtime Layer (Est. 6-8 hrs)

### Sprint 4.1: REST API Endpoints
- [ ] Create `api/main.py` — FastAPI app with CORS, lifespan
- [ ] Create `api/routers/world.py`:
  - `GET /api/v1/world` — current simulation state (day, time, weather, resources)
- [ ] Create `api/routers/agents.py`:
  - `GET /api/v1/agents` — list all agents
  - `GET /api/v1/agents/{id}` — single agent detail + memories
- [ ] Create `api/routers/timeline.py`:
  - `GET /api/v1/timeline` — paginated event timeline
  - `GET /api/v1/discoveries` — all hypotheses and projects
- [ ] Create `api/routers/admin.py`:
  - `POST /api/v1/admin/simulation` — set speed, pause, trigger drought event
  - `POST /api/v1/admin/reset` — reseed database

### Sprint 4.2: Realtime Streaming
- [ ] Implement WebSocket endpoint `/api/v1/stream`
- [ ] On each tick, broadcast state diff as JSON:
  ```json
  {
    "tick": 42,
    "agents": { "mira": { "location": "farm", "energy": 85, ... } },
    "events": [ { "type": "memory_stored", "agent": "mira", "summary": "..." } ]
  }
  ```
- [ ] Implement heartbeat ping/pong for connection health
- [ ] Support SSE fallback if WebSocket unavailable

---

## Phase 5: Frontend Dashboard (Est. 12-15 hrs)

### Sprint 5.1: Project Setup
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies: `zustand`, `reactflow`, `lucide-react`, `tailwindcss`
- [ ] Configure Tailwind with custom HSL theme (colors from design.md)
- [ ] Set up Google Fonts (Outfit + Inter)

### Sprint 5.2: Core Store & WebSocket
- [ ] Create `store/worldStore.ts` (Zustand):
  - `worldState`: simulation settings, weather
  - `agents`: map of agent ID → agent state
  - `events`: timeline of events
  - `discoveries`: hypotheses + projects
  - `selectedAgentId`: currently inspected agent
  - Actions: `connectWebSocket()`, `setSpeed()`, `selectAgent()`, `triggerDrought()`

### Sprint 5.3: TopBar Component
- [ ] Create `components/TopBar.tsx`:
  - Day counter, date, 24h clock display
  - Weather icon (animated)
  - Speed control buttons (1x, 2x, Demo, Pause)
  - Glassmorphic styling with backdrop blur

### Sprint 5.4: Agent Roster (Left Sidebar)
- [ ] Create `components/Roster.tsx`:
  - Agent cards with avatar (emoji/initials), name, profession
  - Need indicator bar (mini version, single color)
  - Status dot (green/yellow/gray)
  - Click to select agent → updates `selectedAgentId` in store
  - Search/filter field

### Sprint 5.5: 2D World Map (Center)
- [ ] Create `components/Map.tsx`:
  - SVG-based settlement layout with 7 location nodes
  - Agent avatar sprites positioned at their current location
  - Smooth CSS transitions for agent movement between locations
  - Speech bubble popups when agents talk
  - Weather overlay (particle effects for drought/sun)
  - "Memory activity" glow pulse when Supermemory is accessed
  - Camera follow mode when agent is selected

### Sprint 5.6: Inspector Panel (Right Sidebar)
- [ ] Create `components/Inspector.tsx`:
  - Agent detail header (name, profession, mood)
  - Need meters (Hunger, Energy, Social, Curiosity) as horizontal HSL-colored bars
  - Memory tabs:
    - **Recent:** cards with summary, source, importance, date
    - **Hypotheses:** Aadi's active hypotheses with validation status
    - **Social Network:** mini force-directed graph of relationships
  - Supermemory activity indicator (pulsing icon during API calls)

### Sprint 5.7: Provenance Graph (Bottom Panel)
- [ ] Create `components/ProvenanceGraph.tsx` using React Flow:
  - 7 node types with distinct colors (Observation=Orange, Memory=Purple, Conversation=Blue, Child Link=Violet, Hypothesis=Neon Violet, Validation=Teal, Action=Emerald)
  - Directed edges showing causal flow
  - Click node → highlight related agents/resources
  - Hover → show detailed Supermemory content
  - Auto-layout: nodes appear sequentially as events unfold
  - Collapsible panel (expand for full view, minimize to timeline bar)

### Sprint 5.8: Integration & Polish
- [ ] Wire WebSocket store updates to all components
- [ ] Implement glassmorphic styling across all panels
- [ ] Add micro-animations (hover, transitions, glowing dots)
- [ ] Responsive layout: desktop full, tablet drawers, mobile minimal
- [ ] Test end-to-end real-time updates

---

## Phase 6: Demo Polish & Testing (Est. 4-6 hrs)

### Sprint 6.1: Seeded Scenario Verification
- [ ] Run full seeded drought scenario end-to-end
- [ ] Verify all 6 steps of the 3-min demo flow work
- [ ] Verify timeline logs match expected sequence
- [ ] Verify Provenance Graph renders all 7 node types

### Sprint 6.2: Error Handling & Edge Cases
- [ ] Test Supermemory API timeout → verify fallback works
- [ ] Test LLM API failure → verify deterministic fallback
- [ ] Test database corruption → verify recovery
- [ ] Test rapid speed changes (pause → demo → 1x)

### Sprint 6.3: Performance Optimization
- [ ] Add SQLite indexes on frequently queried columns
- [ ] Optimize WebSocket payload size (send diffs only)
- [ ] Verify max 1 LLM call per tick enforcement
- [ ] Test with 1000+ ticks for memory leaks

### Sprint 6.4: Polish & Documentation
- [ ] Final UI polish (animations, transitions, glow effects)
- [ ] Add "Memory Activity" visual indicator on agent cards
- [ ] Write `README.md` with setup instructions
- [ ] Create `.env.example` with required environment variables
- [ ] Add Supermemory API key setup instructions

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Vector Memory** | Supermemory (Python SDK) | Persistent semantic memory, mandatory — no other vector DB |
| **Database** | SQLite + SQLAlchemy | Structured state persistence, zero config, no auth |
| **Backend** | FastAPI + Uvicorn | Async Python API with WebSocket support |
| **LLM Framework** | LangChain | Structured JSON output, prompt templating |
| **LLM Provider** | TBD (OpenAI/Grok/Gemini) | Agent reasoning and decision-making |
| **Frontend** | React + Vite + TypeScript | Modern web UI |
| **State Management** | Zustand | Lightweight reactive store |
| **Styling** | Tailwind CSS | Dark-mode glassmorphic theme |
| **Map** | SVG (custom) | 2D settlement visualization |
| **Graph** | React Flow | Provenance node graph |
| **Real-time** | WebSocket / SSE | Live state streaming |

---

## Required Environment Variables
```
SUPERMEMORY_API_KEY=sm_...        # Required: from https://supermemory.ai
GROQ_API_KEY=gsk_...               # Required: from https://console.groq.com
LLM_PROVIDER=groq                 # Confirmed: Groq
DATABASE_URL=sqlite:///./civilization.db
```

## Confirmed Decisions
- **LLM Provider:** Groq (fast inference, using `mixtral-8x7b-32768` or `llama-3.1-8b-instant`)
- **Supermemory API Key:** User will obtain from https://supermemory.ai
- **Agents:** Default 10 agents with standard schedules

---

## Open Questions

> [!NOTE]
> Before we begin implementation, please confirm:

### 1. LLM Provider Selection
Which LLM API do you want to power the agents?
- **OpenAI** (`gpt-4o` or `gpt-4o-mini` — cheaper, faster)
- **Groq** (if you have access — fast inference)
- **Google Gemini** (`gemini-2.0-flash` or `gemini-1.5-pro`)
- **OpenRouter** (multi-provider via single API key)

### 2. Supermemory Account
Do you have a Supermemory API key ready at https://supermemory.ai? If not, we'll need to create an account and generate one.

### 3. Agent Customization
Do you want to use the default 10 agents and schedules from the spec, or do you have custom changes?

### 4. LLM Model for Reasoning
For the LangChain chains, we need a capable reasoning model. Recommended options:
- `gpt-4o-mini` (cheap, fast, good structured output)
- `gemini-2.0-flash` (free tier available)
- `gpt-4o` (most capable, more expensive)
