import { create } from 'zustand'

export interface AgentState {
  id: string
  name: string
  profession: string
  age_stage: string
  location_id: string
  current_activity: string
  mood: string
  energy: number
  hunger: number
  social: number
  curiosity: number
  moved?: boolean
  last_speech?: string
}

export interface WorldState {
  simulation: {
    current_day: number
    current_time: string
    weather: string
    speed: string
  }
  resources: Record<string, number>
}

export interface TimelineEvent {
  type: string
  day: number
  time: string
  agent_id?: string
  agent_name?: string
  agent_profession?: string
  summary: string
  importance: number
  content?: string
  payload?: any
  emotion?: string
  trigger?: string
  impact?: string
}

interface WorldStore {
  world: WorldState | null
  agents: Record<string, AgentState>
  events: TimelineEvent[]
  selectedAgentId: string | null
  speed: string
  cropMoisture: number
  connected: boolean
  memoryActivity: string | null
  uiMode: 'comic_map' | 'visual_novel'
  isRosterOpen: boolean
  currentViewLocation: string

  setWorld: (world: WorldState) => void
  updateAgent: (id: string, data: Partial<AgentState>) => void
  addEvent: (event: TimelineEvent) => void
  selectAgent: (id: string | null) => void
  setSpeed: (speed: string) => void
  setCropMoisture: (moisture: number) => void
  setConnected: (connected: boolean) => void
  setMemoryActivity: (agentId: string | null) => void
  setUiMode: (mode: 'comic_map' | 'visual_novel') => void
  setIsRosterOpen: (isOpen: boolean) => void
  setCurrentViewLocation: (location: string) => void
  handleStateDiff: (diff: any) => void
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  world: null,
  agents: {},
  events: [],
  selectedAgentId: null,
  speed: 'paused',
  cropMoisture: 80,
  connected: false,
  memoryActivity: null,
  uiMode: 'visual_novel',
  isRosterOpen: true,
  currentViewLocation: 'town_hall',

  setWorld: (world) => set({ world }),
  updateAgent: (id, data) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [id]: { ...state.agents[id], ...data },
      },
    })),
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 200),
    })),
  selectAgent: (id) => set({ selectedAgentId: id }),
  setSpeed: (speed) => set({ speed }),
  setCropMoisture: (moisture) => set({ cropMoisture: moisture }),
  setConnected: (connected) => set({ connected }),
  setMemoryActivity: (agentId) => set({ memoryActivity: agentId }),
  setUiMode: (mode) => set({ uiMode: mode }),
  setIsRosterOpen: (isOpen) => set({ isRosterOpen: isOpen }),
  setCurrentViewLocation: (location) => set({ currentViewLocation: location }),

  handleStateDiff: (diff) => {
    const state = get()

    if (diff.clock) {
      set({
        world: {
          ...state.world!,
          simulation: {
            ...state.world?.simulation!,
            current_day: diff.clock.current_day,
            current_time: diff.clock.current_time,
            weather: diff.weather || state.world?.simulation.weather || 'sunny',
            speed: state.speed,
          },
        },
      })
    }

    if (diff.weather) {
      set((s) => ({
        world: s.world
          ? {
              ...s.world,
              simulation: { ...s.world.simulation, weather: diff.weather },
            }
          : s.world,
      }))
    }

    if (diff.crop_moisture !== undefined) {
      set({ cropMoisture: diff.crop_moisture })
    }

    if (diff.agents) {
      set((state) => {
        const updated = { ...state.agents }
        for (const [id, data] of Object.entries(diff.agents)) {
          updated[id] = {
            ...(updated[id] || {
              id,
              name: id.charAt(0).toUpperCase() + id.slice(1),
              profession: '',
              age_stage: 'adult',
              location_id: '',
              current_activity: '',
              mood: 'neutral',
              energy: 100,
              hunger: 50,
              social: 50,
              curiosity: 50,
            }),
            ...(data as Partial<AgentState>),
          }
        }
        return { agents: updated }
      })
    }

    if (diff.events) {
      for (const event of diff.events) {
        state.addEvent({
          type: event.type,
          day: event.day || state.world?.simulation.current_day || 1,
          time: state.world?.simulation.current_time || '08:00',
          agent_id: event.agent_id,
          summary: event.summary || event.type,
          importance: event.importance || 5,
          content: event.content,
          payload: event.payload,
        })
      }
    }
  },
}))
