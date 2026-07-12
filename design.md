# Design and UI/UX Specification - Autonomous AI Civilization

## 1. Design Aesthetics & Visual Identity
To achieve a premium, state-of-the-art feel, the user interface will employ a modern **dark-mode glassmorphic** layout using a carefully curated HSL color palette, custom gradients, and soft micro-animations.

### 1.1 Color Palette (HSL Theme)
- **Background Deep:** `hsl(224, 71%, 4%)` (Ultra dark blue-gray)
- **Surface Layer:** `hsla(224, 71%, 8%, 0.6)` (Semi-transparent glass pane)
- **Primary Glow:** `hsl(250, 95%, 70%)` (Electric violet / neon purple)
- **Secondary Accent:** `hsl(190, 90%, 50%)` (Teal / cyan)
- **Warning Alert:** `hsl(15, 95%, 60%)` (Sunset orange / drought alert)
- **Success Glow:** `hsl(145, 80%, 50%)` (Emerald green / validation success)
- **Muted Gray:** `hsl(220, 20%, 60%)` (Metadata and descriptive text)

### 1.2 Typography & Elements
- **Google Fonts:** `Outfit` (for headers) and `Inter` (for body copy).
- **Glassmorphism:** Use `backdrop-filter: blur(12px) saturate(180%)` with thin translucent borders (`border: 1px solid rgba(255, 255, 255, 0.08)`) to mimic premium OS surfaces.
- **Micro-Animations:** Smooth hover states on cards, glowing indicator dots for active/sleeping status, and CSS transitions (`cubic-bezier(0.4, 0, 0.2, 1)`) for map coordinates.
- **Memory Glow Effect:** When an agent logs or retrieves a memory from Supermemory, a brief purple glow pulse around their avatar indicates memory activity.

---

## 2. Layout Structure
The dashboard is split into four primary grid sections to optimize space and maximize observability:

```
+---------------------------------------------------------------------------------------+
|  [Top Bar] Day N | Date | 24h Clock (08:00) | Weather | Simulation Speed & Pause Controls |
+-----------------------+---------------------------------------+-----------------------+
|                       |                                       |                       |
|  [Left Sidebar]       |  [Center Workspace]                   |  [Right Sidebar]      |
|  Agent Roster         |  Stylized 2D Map of Settlement        |  Inspector Panel      |
|  - Avatar & Name      |  - Farm, Workshop, School, Kitchen    |  - Goals & Needs      |
|  - Profession         |  - Avatars moving on paths            |  - Private Memories   |
|  - Need Indicator     |  - Floating speech bubbles            |  - Relationships      |
|  - Active/Idle state  |                                       |                       |
|                       |                                       |                       |
+-----------------------+---------------------------------------+-----------------------+
|  [Bottom Panel] Interactive Event Timeline & Causal Provenance Graph                  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Component Details

### 3.1 The World Map (Center Canvas)
- **Format:** An interactive 2D canvas/SVG grid showing the layout of the settlement.
- **Locations:**
  - **Mira's Farm** (Bottom Left)
  - **Arun's Workshop** (Top Right)
  - **Dev's Library/School** (Center Top)
  - **Sana's Clinic** (Middle Right)
  - **Town Hall / Rohan's Office** (Center)
  - **Kabir's Kitchen / Tavern** (Center Bottom)
  - **Reservoir / Fields** (Periphery)
- **Avatars:** Small animated circular sprites containing the agent's portrait, labeled with their current action (e.g. `[Mira - Farming]`). When talking, a floating speech bubble appears next to their sprite.
- **Path Animation:** Agents move along predefined paths between locations using CSS transitions. Movement is deterministic based on the routine schedule with no LLM calls required for navigation.
- **Weather Overlay:** A subtle particle effect overlay changes based on weather state (sunny, drought, rain).

### 3.2 Agent Inspector (Right Panel)
- **Follow Mode:** Clicking any agent in the Left Roster centers the map camera on them and updates the Inspector with their live state.
- **Need Meters:** Horizontal indicator bars for Hunger, Energy, Social, and Curiosity. They deplete/recharge dynamically according to physical routines.
- **Memory Tabs:**
  - **Recent Memories:** Cards sorted by recency and salience. Each memory card shows: summary text, source agent (if derived), emotional weight, and a "View in Supermemory" indicator.
  - **Hypotheses:** Current ideas the agent is thinking about (especially active for the child Aadi). Shows validation status and linked evidence chain.
  - **Social Network:** Closeness and trust metrics with other agents. Visualized as a mini force-directed graph.
- **Memory Activity Indicator:** A small pulsing icon next to the memory tab when Supermemory is being queried or written to.

### 3.3 Agent Roster (Left Sidebar)
- **Agent Cards:** Each card shows avatar (emoji-based or initials), name, profession title, a colored need bar, and a status dot (green=active, yellow=idle, gray=sleeping).
- **Sorting:** Agents can be sorted by name, profession, or need level.
- **Search/Filter:** A quick filter field to find agents by name or profession.

### 3.4 Top Bar Controls
- **Clock Display:** Shows current day, date, and 24-hour time in a monospace font.
- **Weather Icon:** Animated weather indicator (sun, drought symbol, rain).
- **Speed Controls:** Four buttons — `1x` (Realtime), `2x` (Accelerated), `Demo` (compressed for judges), `||` (Pause).
- **Seed Trigger Button:** A hidden/easter-egg button that manually triggers the drought event for testing.

### 3.5 The Causal Provenance Graph (Bottom Panel)
- **Climax of the Demo:** An interactive node-based flowchart showing how knowledge spreads.
- **Node Types:**
  - **Observation Node (Orange):** Represents a physical trigger (e.g. `Crop Soil Moisture: 12%`).
  - **Memory Node (Purple):** Mira registers `[Private Memory: Crop Drought Alert]`. Clicking shows the Supermemory document ID.
  - **Conversation Node (Blue):** Conversation item `[Mira tells Kabir at Dinner]`.
  - **Child Link Node (Violet):** Aadi retrieves this memory from Supermemory and pairs it with engineering notes.
  - **Hypothesis Node (Neon Violet):** Aadi registers `[Hypothesis: Pipe water from reservoir to fields]`.
  - **Validation Node (Teal):** Arun validates slope & capacity.
  - **Action/Result Node (Emerald):** Rohan approves, construction starts, field recovers.
- **Interactivity:** Clicking any node highlights the corresponding agents or resources, proving the causal sequence. Hovering shows the exact Supermemory memory content and timestamp.

### 3.6 Responsive Breakpoints
- **Desktop (1920x1080):** Full 4-panel layout as shown above.
- **Tablet (768px):** Sidebars collapse into drawers. Map takes full width.
- **Mobile (<480px):** Only the map and top bar are visible. All panels accessible via hamburger menu.

---

## 4. Data Flow for UI Updates
1. Backend tick advances → state changes in SQLite.
2. Backend broadcasts state diff via WebSocket/SSE.
3. Frontend store (Zustand) receives diff, updates reactive state.
4. React components re-render based on store subscriptions.
5. Memory operations show real-time indicators when Supermemory API is called.
6. Provenance graph nodes appear asynchronously as each step of the causal chain completes.

---

## 5. Frontend Tech Stack
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand (lightweight, no boilerplate)
- **Real-time:** WebSocket or EventSource (SSE) for server push
- **Styling:** Tailwind CSS with custom theme extending the HSL palette
- **Map Rendering:** SVG-based (react-konva or custom SVG components)
- **Provenance Graph:** React Flow (reactflow.dev) for interactive node graphs
