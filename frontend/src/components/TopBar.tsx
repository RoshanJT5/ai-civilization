import { useWorldStore } from '../store/worldStore'
import { Play, Pause, Zap, FastForward, Sun, CloudRain, AlertTriangle } from 'lucide-react'

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: <Sun size={24} className="text-yellow-500 drop-shadow-[2px_2px_0_#000]" />,
  drought: <AlertTriangle size={24} className="text-red-500 drop-shadow-[2px_2px_0_#000]" />,
  rain: <CloudRain size={24} className="text-blue-500 drop-shadow-[2px_2px_0_#000]" />,
}

export default function TopBar() {
  const world = useWorldStore((s) => s.world)
  const speed = useWorldStore((s) => s.speed)
  const setSpeed = useWorldStore((s) => s.setSpeed)
  const uiMode = useWorldStore((s) => s.uiMode)
  const setUiMode = useWorldStore((s) => s.setUiMode)
  const currentLocation = useWorldStore((s) => s.currentViewLocation)
  const setCurrentLocation = useWorldStore((s) => s.setCurrentViewLocation)

  if (!world) return null

  const { simulation } = world
  const weatherIcon = WEATHER_ICONS[simulation.weather] || WEATHER_ICONS.sunny

  const speeds = [
    { key: 'paused', icon: <Pause size={18} />, label: 'HALT' },
    { key: 'realtime', icon: <Play size={18} />, label: '1x' },
    { key: 'accelerated', icon: <FastForward size={18} />, label: '2x' },
    { key: 'demo', icon: <Zap size={18} />, label: 'DEMO' },
  ]

  return (
    <header className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center justify-between px-6 py-4 relative overflow-hidden">
      {/* Halftone backdrop for the top bar */}
      <div className="absolute inset-0 comic-halftone opacity-50 pointer-events-none" />

      <div className="flex items-center gap-8 relative z-10">
        <h1 className="text-4xl font-display text-black drop-shadow-[3px_3px_0_#FFD700] uppercase transform -skew-x-6">
          AI Civilization
        </h1>

        <div className="flex items-center gap-4 bg-black px-4 py-2 text-white font-bold uppercase transform rotate-1 shadow-[4px_4px_0_#4682B4]">
          <span className="text-xl text-yellow-400">Day {simulation.current_day}</span>
          <span className="text-xl tracking-widest font-['Bangers']">{simulation.current_time}</span>
          <div className="flex items-center gap-2 border-l-2 border-white/30 pl-4 ml-2">
            {weatherIcon}
            <span className="text-lg">{simulation.weather}</span>
          </div>
        </div>

        {/* Location Selector (Only visible in Visual Novel mode) */}
        {uiMode === 'visual_novel' && (
          <select 
            value={currentLocation} 
            onChange={(e) => setCurrentLocation(e.target.value)}
            className="bg-white border-4 border-black px-4 py-2 text-xl font-['Bangers'] tracking-wider text-black shadow-[3px_3px_0_#000] outline-none cursor-pointer hover:bg-yellow-100"
          >
            <option value="town_hall">TOWN HALL / SQUARE</option>
            <option value="farm">FARM FIELD</option>
            <option value="kitchen">KITCHEN / HOUSE</option>
            <option value="workshop">WORKSHOP</option>
            <option value="library">LIBRARY / SCHOOL</option>
            <option value="clinic">CLINIC</option>
            <option value="reservoir">RESERVOIR</option>
          </select>
        )}
      </div>

      <div className="flex items-center gap-6 relative z-10">
        {/* UI Mode Toggle */}
        <div className="flex bg-black p-1 border-2 border-black shadow-[3px_3px_0_#000]">
          <button 
            onClick={() => setUiMode('visual_novel')}
            className={`px-4 py-1 font-bold uppercase text-sm ${uiMode === 'visual_novel' ? 'bg-yellow-400 text-black' : 'text-white hover:bg-white/20'}`}
          >
            Visual Novel
          </button>
          <button 
            onClick={() => setUiMode('comic_map')}
            className={`px-4 py-1 font-bold uppercase text-sm ${uiMode === 'comic_map' ? 'bg-yellow-400 text-black' : 'text-white hover:bg-white/20'}`}
          >
            Comic Map
          </button>
        </div>

        <div className="flex items-center gap-3 bg-gray-200 p-2 border-2 border-black shadow-[3px_3px_0_#000]">
          <span className="text-sm font-bold text-black uppercase transform -rotate-2">SPEED:</span>
        {speeds.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setSpeed(s.key)
              const ws = (window as any).__ws
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(`speed:${s.key}`)
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 border-2 border-black font-bold uppercase text-sm transition-transform hover:-translate-y-1 hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
              speed === s.key
                ? 'bg-yellow-400 text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] transform scale-105'
                : 'bg-white text-black'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
      </div>
    </header>
  )
}
