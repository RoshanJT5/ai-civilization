# Product Requirements Document (PRD) - Autonomous AI Civilization

## 1. Introduction & Core Concept
The **Autonomous AI Civilization** is a self-running, observable virtual world populated by a society of ten agents: nine specialized adults and one curious child. Unlike conventional chatbot systems or user-controlled games, this project is a persistent multi-agent memory laboratory where the user acts as a passive observer.

The defining mechanic is **Information Boundary & Bounded Autonomy**: agents are not omniscient. They only know what they observe directly, what they are told by other agents, what they read in the library, or what they infer. By sharing memories selectively and connecting cross-domain experiences, they can create validated discoveries that dynamically alter the state of their world.

All memory operations are handled exclusively through **Supermemory** (https://supermemory.ai) — a persistent, self-growing long-term memory API. No other vector store or embedding service is used.

---

## 2. Target Audience & Success Criteria
- **Audience:** Hackathon judges, AI developers, and researchers interested in agentic memory systems.
- **Success Criteria:**
  - **The Bounded Memory Loop:** Visually demonstrate a causal sequence of events:
    1. An event occurs (e.g., Drought observed by Mira).
    2. The event becomes a private memory in Supermemory.
    3. The memory is shared socially (e.g., Mira talks to a family member).
    4. The child (Aadi) retrieves the memory from Supermemory, connects it with other domain knowledge (e.g., engineering facts from Arun), and forms a hypothesis.
    5. The hypothesis is validated by an expert, approved by the leader, and implemented as a project.
    6. The project modifies the physical world state (e.g., irrigation canal built, field moisture recovers).
  - **Observability:** Instant readability of agent status, schedules, relationships, active tasks, and memory provenance.
  - **Efficiency:** Robust execution under API token quotas via deterministic routines and a cognitive priority queue.

---

## 3. Scope & Boundaries

### 3.1 In Scope (MVP)
1. **Clock & Routine Engines:** A deterministic tick-based clock (advancing in 5-minute increments) that controls movement, schedules, weather, resources, and crops.
2. **Ten Persistent Agents:** Detailed identities, professional roles, need meters, and private memory scopes.
3. **Structured Cognition:** Agents use LLM reasoning (via LangChain structured JSON schemas) to make decisions and generate contextual conversations only when triggered by important events (e.g., meetings, anomalies).
4. **Episodic & Long-Term Memory (Supermemory):** All semantic retrieval and storage of memories uses the Supermemory Python SDK (`pip install supermemory`) or its REST API. Scoped per agent via `container_tags`. **No other vector DB or embedding service is used.**
5. **Causal Provenance Graph:** Visual representation showing how a world event became a memory, traveled socially, combined into a hypothesis, and caused a physical project.
6. **Local Persistence:** Local SQLite database storing all structured state (roles, schedules, relationships, locations, events, projects, resources, inventory). No Supabase or auth connection required.

### 3.2 Out of Scope
- Complex economics/markets, genetics/reproduction, warfare, open-ended user creation, photorealistic 3D rendering, and agent voice generation.

---

## 4. Functional Requirements

### FR-1: Simulation Clock
- The world advances in ticks representing 5 minutes.
- Supports 4 speeds: Realtime, Accelerated, Demo (compressed time), and Paused.
- Fully deterministic schedules govern physical movements and state transitions without triggering LLM calls.

### FR-2: Agent Roster & Bounded Roster Roles
- Nine specialized adults with distinct professions (Farmer, Engineer, Doctor, Teacher, Logistics, Cook, Artist, Leader, Naturalist) and one child synthesizer.
- Agents maintain need scores (Energy, Hunger, Social Connection, Safety, Curiosity, Purpose) that influence their behaviors.

### FR-3: Scoped Memory Ownership (Supermemory)
- **Private Memory Namespaces:** Each agent has its own Supermemory container identified by `container_tag = f"agent_{agent_id}"`.
- **Social Memory Transfer:** When Agent A tells Agent B something, Agent B stores a derived memory in its own container with `source_agent_id` attribution. The original memory is NOT copied — only a summarized, filtered version is created. This preserves information hops and prevents direct copy-pasting of observations.
- **Public Knowledge:** Books read and town announcements are saved under the global container tag `"public_library"`. Every agent's memory queries merge their private container results with `"public_library"` results.
- **Memory Metadata:** SQLite keeps a `memory_metadata` table that maps each Supermemory document ID (`external_memory_id`) to agent ownership, importance score, emotional weight, type classification, and provenance chain.

### FR-4: Synthesis and Hypothesis Generation (The Child Agent)
- The child agent (Aadi) has a flexible exploration routine and performs nightly reflection.
- Aadi retrieves memories from different domains (e.g., agriculture and engineering) via Supermemory semantic search to generate a "Hypothesis".
- A hypothesis must link supporting source memories to trace causality.
- Hypothesis generation uses the Supertypical pattern: `client.profile(container_tag="agent_aadi", q="unresolved problems")` to retrieve relevant context.

### FR-5: Domain Validation & Project Execution
- A proposed hypothesis is submitted to the relevant expert agent (e.g., Arun the Engineer for plumbing, Sana the Doctor for health).
- If validated by the expert, it goes to Rohan (the Leader) for approval.
- Approved projects consume resources (wood, tools, labor) over multiple ticks to complete, changing the world state.

### FR-6: Realtime UI Dashboard
- Stylized 2D visual layout showing locations (farm, workshop, clinic, school, kitchen, town hall, reservoir).
- Realtime streaming of agent movement and speech bubbles via WebSockets or SSE.
- Inspector panel: Displays agent active goals, relationships, need levels, and current activity.
- Provenance viewer: Renders the causal chain nodes (Event -> Memory -> Talk -> Child Reflection -> Validation -> Project -> Solution).

---

## 5. Non-Functional Requirements
- **Performance:** DB reads/writes must be highly optimized using SQLite indexes.
- **Quota Management:** Limit the number of LLM invocations using a priority queue. Decorative turns bypass LLMs.
- **Supermemory Reliability:** All Supermemory API calls must have timeout (default 5s), retry (3 attempts with exponential backoff), and fallback to deterministic defaults on failure.
- **Demo Reliability:** The simulation must support a seeded scenario (e.g., starting with a drought on Day 3) to ensure a high-fidelity demonstration for judges within 3 minutes.
- **Fail-Safety:** If a remote API call fails, the simulation must fallback to deterministic defaults instead of freezing.
