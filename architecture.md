# System Architecture Specification - Autonomous AI Civilization

## 1. High-Level Architecture Flow
The system is built as a modular monolith using **FastAPI** (Python backend) and **React** (TypeScript frontend), with real-time UI synchronization via WebSockets or Server-Sent Events (SSE).

```
 +------------------------------------------------------------------------------------------------+
 |                                          React Frontend                                        |
 |  (Map.tsx, Inspector.tsx, Roster.tsx, ProvenanceGraph.tsx, TopBar.tsx)                        |
 |  State: Zustand store <-> WebSocket/SSE                                                        |
 +------------------------------------------------------------------------------------------------+
                                                  ^
                                                  | (WebSocket / SSE Realtime Updates)
                                                  v
 +------------------------------------------------------------------------------------------------+
 |                                       FastAPI Backend API                                      |
 |  (main.py -> routers: /world, /agents, /timeline, /stream, /admin)                            |
 +------------------------------------------------------------------------------------------------+
          |                                |                               |
          | (Read/Write State)             | (Cognition & Reflections)     | (Episodic Search & Store)
          v                                v                               v
 +-------------------+           +-------------------+           +-------------------+
 |  SQLite Database  |           |   LangChain / LLM |           |    Supermemory    |
 | (Local Data Store)|           | (Agent Decision    |           | (Vector Memory    |
 |  - agents         |           |  Chains, Reflection|           |  Python SDK)      |
 |  - locations      |           |  Validation Chains)|           |  - Per-agent       |
 |  - relationships  |           +-------------------+           |    container tags  |
 |  - routine_blocks |                                         |  - Public library   |
 |  - resources      |                                         |  - Semantic search  |
 |  - memory_metadata|                                         +-------------------+
 |  - hypotheses     |
 |  - projects       |
 |  - simulation_    |
 |    settings       |
 +-------------------+
```

---

## 2. Supermemory Integration Architecture

### 2.1 Client Setup
Supermemory is the **sole vector memory provider**. No other vector DB or embedding service is used.

```python
from supermemory import Supermemory

client = Supermemory()  # Reads SUPERMEMORY_API_KEY from env
```

### 2.2 Memory Partitioning Strategy
| Container Tag | Scope | Example Usage |
|---|---|---|
| `agent_{agent_id}` | Private episodic memories for each agent | `agent_mira`, `agent_aadi`, `agent_arun` |
| `public_library` | Shared public knowledge (books, announcements) | All agents query this + their private tag |
| `world_state` | Global world events and state summaries | Drought events, season changes, major milestones |

### 2.3 Memory Lifecycle (per tick/event)

```
Event Occurs (e.g., drought detected)
    |
    v
[1] Classify: SQLite writes metadata (importance, type, owner)
    |
    v
[2] Upload: supermemory_client.add(
        content=text_description,
        containerTags=[f"agent_{agent_id}"]
    )
    <- Returns external_memory_id (UUID)
    |
    v
[3] Map: SQLite saves external_memory_id + metadata
    |
    v
[4] Retrieve (when needed):
    supermemory_client.search.documents(
        q=query_text,
        containerTags=[f"agent_{agent_id}"]
    )
    <- Returns ranked memory results with scores
```

### 2.4 Social Memory Transfer Flow
1. Agent A has a memory in container `agent_A`.
2. Agent A tells Agent B about it.
3. Agent B's derived memory is created by summarizing (NOT copying) the original.
4. The derived memory is stored in container `agent_B` with `source_agent_id = A`.
5. SQLite records the provenance hop.

### 2.5 Error Handling & Retry Policy
- **Timeout:** All Supermemory API calls use 5-second timeout.
- **Retry:** 3 attempts with exponential backoff (1s, 2s, 4s).
- **Fallback:** On total failure, use SQLite `memory_metadata` for basic keyword-based retrieval.
- **Logging:** All Supermemory operations are logged with timing and status.

---

## 3. SQLite Database Schema

### 3.1 Schema Tables

#### `simulation_settings`
- `id` (INTEGER, PRIMARY KEY)
- `current_day` (INTEGER)
- `current_time` (TEXT) - e.g. "08:30"
- `weather` (TEXT) - e.g. "sunny", "drought"
- `simulation_speed` (TEXT) - "realtime", "accelerated", "demo", "paused"

#### `agents`
- `id` (TEXT, PRIMARY KEY) - e.g. "mira", "aadi"
- `name` (TEXT)
- `profession` (TEXT)
- `age_stage` (TEXT) - "adult", "child"
- `baseline_personality` (TEXT) - detailed JSON string
- `communication_style` (TEXT)
- `location_id` (TEXT) - current location FK
- `current_activity` (TEXT)
- `mood` (TEXT)
- `energy` (INTEGER) - 0-100
- `hunger` (INTEGER) - 0-100
- `social` (INTEGER) - 0-100
- `curiosity` (INTEGER) - 0-100

#### `relationships`
- `id` (INTEGER, PRIMARY KEY)
- `agent_a_id` (TEXT, FK)
- `agent_b_id` (TEXT, FK)
- `closeness` (INTEGER) - 0-100
- `trust` (INTEGER) - 0-100
- `interaction_count` (INTEGER)

#### `locations`
- `id` (TEXT, PRIMARY KEY) - e.g. "farm", "workshop"
- `name` (TEXT)
- `description` (TEXT)
- `x` (INTEGER) - horizontal coordinate
- `y` (INTEGER) - vertical coordinate

#### `routine_blocks`
- `id` (INTEGER, PRIMARY KEY)
- `agent_id` (TEXT, FK)
- `start_time` (TEXT) - "08:00"
- `end_time` (TEXT) - "12:00"
- `activity` (TEXT) - e.g. "FARM_WORK", "DINNER"
- `location_id` (TEXT, FK)

#### `world_resources`
- `id` (TEXT, PRIMARY KEY) - e.g. "wood", "tools", "water"
- `quantity` (INTEGER)

#### `memory_metadata`
- `id` (INTEGER, PRIMARY KEY)
- `external_memory_id` (TEXT) - Supermemory document ID
- `owner_agent_id` (TEXT, FK)
- `memory_type` (TEXT) - "episodic", "social", "book", "hypothesis"
- `summary` (TEXT)
- `importance` (INTEGER) - 1-10
- `emotional_weight` (INTEGER) - 1-10
- `source_agent_id` (TEXT, FK, NULLABLE)
- `location_id` (TEXT, FK)
- `day_recorded` (INTEGER)
- `time_recorded` (TEXT)

#### `hypotheses`
- `id` (INTEGER, PRIMARY KEY)
- `creator_id` (TEXT, FK)
- `title` (TEXT)
- `description` (TEXT)
- `validation_status` (TEXT) - "proposed", "validated", "rejected", "implemented"
- `validator_id` (TEXT, FK, NULLABLE)
- `day_created` (INTEGER)

#### `projects`
- `id` (INTEGER, PRIMARY KEY)
- `hypothesis_id` (INTEGER, FK)
- `title` (TEXT)
- `description` (TEXT)
- `progress` (INTEGER) - 0-100
- `required_wood` (INTEGER)
- `required_tools` (INTEGER)
- `current_wood` (INTEGER)
- `current_tools` (INTEGER)
- `status` (TEXT) - "pending", "in_progress", "completed"

---

## 4. LangChain Cognition Pipeline

### 4.1 Chain Pipeline Architecture

```
Agent State + Needs + Location + Time
          |
          v
+---------------------+
| Memory Retrieval    |  <- Supermemory semantic search (top-5 memories)
+---------------------+
          |
          v
+---------------------+
| Context Assembly    |  <- Merge: identity prompt + observed state + memories
+---------------------+
          |
          v
+---------------------+
| LLM Decision Chain  |  <- Structured JSON output via Pydantic
+---------------------+
          |
          v
+---------------------+
| Action Execution    |  <- Parse output, update DB, broadcast event
+---------------------+
```

### 4.2 Chain Definitions

- **Decision Chain:** Prompted with agent identity, current needs, location, time, visible observations, and relevant retrieved memories. Returns structured JSON: `{action_type, target_id, speech_bubble, reflection_thought, mood_change}`.
- **Conversation Chain:** Takes contexts of both co-located agents and generates a multi-turn dialogue focused on unresolved memories or goals.
- **Reflection Chain (Child Aadi):** Invoked at 20:00 daily. Searches Aadi's memories via Supermemory, detects unresolved contradictions or cross-domain connections, outputs a candidate `HypothesisSchema`.
- **Validation Chain (Expert Agents):** Receives a proposed project + engineering constraints + resource inventory. Evaluates feasibility and returns `ValidationSchema`.

### 4.3 LLM Call Optimization
- **Priority Queue:** LLM calls are queued with priority levels (HIGH for validation/reflection, MEDIUM for decisions, LOW for decorative conversations).
- **Throttling:** Max 1 LLM call per tick to stay within rate limits.
- **Caching:** Identical context calls within the same day return cached results.
- **Fallback:** If LLM fails or times out, use deterministic default behavior.

---

## 5. Simulation Engine Architecture

### 5.1 Tick Loop
```
[Start Tick]
    |
    v
[1] Advance Clock (+5 min)
    |
    v
[2] Update Weather (deterministic schedule)
    |
    v
[3] Update Crop/Resources (deterministic decay)
    |
    v
[4] Move Agents by Schedule (deterministic, no LLM)
    |
    v
[5] Decay Needs (deterministic formula)
    |
    v
[6] Check Triggers (co-location, anomalies, time-of-day)
    |
    v
[7] If Triggered -> Enqueue LLM Cognition Task
    |
    v
[8] If LLM Task Available -> Execute (max 1 per tick)
    |
    v
[9] Broadcast State Diff via WebSocket
    |
    v
[End Tick]
```

### 5.2 Speed Modes
| Mode | Tick Interval | Use Case |
|---|---|---|
| Realtime | 5s per tick | Watching agents live |
| Accelerated | 1s per tick | Faster simulation |
| Demo | 100ms per tick | 3-minute judge demo |
| Paused | Stopped | Inspection mode |

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/world` | Current world state (weather, day, time, resources) |
| GET | `/api/v1/agents` | List all agents with current state |
| GET | `/api/v1/agents/{id}` | Single agent detail + memories |
| GET | `/api/v1/timeline` | Full event timeline |
| GET | `/api/v1/discoveries` | Hypotheses + projects |
| GET | `/api/v1/admin/simulation` | Get sim settings |
| POST | `/api/v1/admin/simulation` | Set speed, pause, trigger events |
| WS/SSE | `/api/v1/stream` | Real-time state diff stream |

---

## 7. Project Structure
```
ai-civilization/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── world.py
│   │   │   │   ├── agents.py
│   │   │   │   ├── timeline.py
│   │   │   │   └── admin.py
│   │   │   └── main.py
│   │   ├── simulation/
│   │   │   ├── clock.py
│   │   │   ├── routine.py
│   │   │   └── engine.py
│   │   ├── memory/
│   │   │   ├── service.py
│   │   │   └── supermemory_client.py
│   │   ├── ai/
│   │   │   ├── orchestrator.py
│   │   │   └── prompts.py
│   │   ├── db/
│   │   │   ├── connection.py
│   │   │   ├── models.py
│   │   │   └── seeding.py
│   │   └── core/
│   │       └── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.tsx
│   │   │   ├── Inspector.tsx
│   │   │   ├── Roster.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── ProvenanceGraph.tsx
│   │   ├── store/
│   │   │   └── worldStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── prd.md
├── design.md
├── architecture.md
├── mvp.md
└── plan.md
```
