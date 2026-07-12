import { useWorldStore } from '../store/worldStore'

interface LocationDef {
  id: string
  name: string
  x: number
  y: number
}

const LOCATIONS: LocationDef[] = [
  { id: 'farm', name: "Mira's Farm", x: 150, y: 380 },
  { id: 'workshop', name: "Arun's Workshop", x: 550, y: 120 },
  { id: 'clinic', name: "Sana's Clinic", x: 600, y: 280 },
  { id: 'library', name: "Dev's Library", x: 350, y: 100 },
  { id: 'kitchen', name: "Kabir's Kitchen", x: 350, y: 380 },
  { id: 'town_hall', name: 'Town Hall', x: 400, y: 240 },
  { id: 'reservoir', name: 'Reservoir', x: 150, y: 120 },
]

const PROFESSION_COLORS: Record<string, string> = {
  farmer: '#8B5A2B',
  engineer: '#4F4F4F',
  teacher: '#4682B4',
  doctor: '#E6E6FA',
  leader: '#FFD700',
  cook: '#FF8C00',
  artist: '#FF69B4',
  logistics: '#2E8B57',
  naturalist: '#228B22',
  child: '#FFC0CB',
}

export default function Map() {
  const agents = useWorldStore((s) => s.agents)
  const cropMoisture = useWorldStore((s) => s.cropMoisture)
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId)
  const memoryActivity = useWorldStore((s) => s.memoryActivity)

  return (
    <div className="comic-panel h-full relative overflow-hidden bg-[#2a2a2a]">
      {/* Map Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/comic_settlement_map.png')", opacity: 0.5 }}
      />
      
      {/* Comic Halftone Overlay Effect */}
      <div className="absolute inset-0 comic-halftone pointer-events-none" />

      <svg
        viewBox="0 0 750 500"
        className="w-full h-full relative z-10"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="droughtGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 100, 0, 0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="comicShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000" floodOpacity="0.8"/>
          </filter>
        </defs>

        {cropMoisture < 30 && (
          <rect width="750" height="500" fill="url(#droughtGrad)" className="animate-pulse" />
        )}

        {/* Render Locations */}
        {LOCATIONS.map((loc) => (
          <g 
            key={loc.id} 
            filter="url(#comicShadow)"
            onClick={() => {
              const store = useWorldStore.getState()
              store.setCurrentViewLocation(loc.id)
              store.setUiMode('visual_novel')
            }}
            style={{ cursor: 'pointer' }}
            className="hover:opacity-80 transition-opacity"
          >
            <rect
              x={loc.x - 60}
              y={loc.y - 25}
              width={120}
              height={50}
              rx={4}
              fill="#ffffff"
              stroke="#000000"
              strokeWidth={3}
            />
            <rect
              x={loc.x - 56}
              y={loc.y - 21}
              width={112}
              height={42}
              rx={2}
              fill="#f0f0f0"
            />
            <text
              x={loc.x}
              y={loc.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#000000"
              fontSize={14}
              fontFamily="'Bangers', 'Comic Sans MS', cursive"
              fontWeight="bold"
              letterSpacing="1"
            >
              {loc.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Render Agents (Human Avatars) */}
        {Object.values(agents).map((agent) => {
          const loc = LOCATIONS.find((l) => l.id === agent.location_id)
          if (!loc) return null

          const isSelected = agent.id === selectedAgentId
          const isMemoryActive = agent.id === memoryActivity
          const shirtColor = PROFESSION_COLORS[agent.profession.toLowerCase()] || '#ffffff'

          return (
            <g
              key={agent.id}
              transform={`translate(${loc.x + (Math.random() - 0.5) * 60}, ${loc.y + 30})`}
              className="transition-transform duration-1000 ease-in-out hover:scale-110"
              onClick={(e) => {
                e.stopPropagation()
                const store = useWorldStore.getState()
                store.selectAgent(agent.id)
                store.setCurrentViewLocation(loc.id)
                store.setUiMode('visual_novel')
              }}
              style={{ cursor: 'pointer', transformOrigin: 'center' }}
            >
              {/* Comic Action Lines for Activity */}
              {isMemoryActive && (
                <path 
                  d="M -20,-40 L -30,-50 M 0,-45 L 0,-60 M 20,-40 L 30,-50" 
                  stroke="#FFD700" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  className="animate-ping"
                />
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <ellipse cx="0" cy="22" rx="20" ry="8" fill="rgba(255, 255, 0, 0.4)" filter="url(#comicShadow)" />
              )}

              {/* Human Avatar SVG */}
              <g filter="url(#comicShadow)">
                {/* Head */}
                <circle cx="0" cy="-14" r="8" fill="#FFCDB2" stroke="#000" strokeWidth="2" />
                {/* Body */}
                <path d="M -8,-6 Q 0,-10 8,-6 L 6,10 L -6,10 Z" fill={shirtColor} stroke="#000" strokeWidth="2" />
                {/* Legs (Animated when moving ideally, static for now) */}
                <line x1="-3" y1="10" x2="-4" y2="22" stroke="#000" strokeWidth="3" strokeLinecap="round" className="comic-leg-l" />
                <line x1="3" y1="10" x2="4" y2="22" stroke="#000" strokeWidth="3" strokeLinecap="round" className="comic-leg-r" />
              </g>

              {/* Speech Bubble / Name Tag */}
              <g transform="translate(0, -35)">
                <path d="M -25,-15 L 25,-15 L 25,5 L 5,5 L 0,12 L -5,5 L -25,5 Z" fill="#fff" stroke="#000" strokeWidth="2" />
                <text
                  x={0}
                  y={-3}
                  textAnchor="middle"
                  fill="#000"
                  fontSize={10}
                  fontFamily="'Bangers', 'Comic Sans MS', cursive"
                  fontWeight="bold"
                >
                  {agent.name.toUpperCase()}
                </text>
              </g>
            </g>
          )
        })}
      </svg>

      {/* Comic Style Status Box */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 p-3 bg-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded transform -rotate-1">
        <span className="text-black font-bold font-['Bangers'] tracking-wider">SOIL MOISTURE</span>
        <div className="w-32 h-4 border-2 border-black bg-gray-200 overflow-hidden">
          <div
            className={`h-full border-r-2 border-black transition-all duration-500 ${
              cropMoisture > 50
                ? 'bg-green-400'
                : cropMoisture > 20
                  ? 'bg-yellow-400'
                  : 'bg-red-500'
            }`}
            style={{ width: `${cropMoisture}%` }}
          />
        </div>
        <span
          className={`font-bold font-['Bangers'] ${
            cropMoisture < 20 ? 'text-red-600 animate-pulse' : 'text-black'
          }`}
        >
          {Math.round(cropMoisture)}%
        </span>
      </div>
    </div>
  )
}
