import { useWorldStore } from '../store/worldStore'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

const AVATAR_MAP: Record<string, string> = {
  farmer: '/avatars/avatar_farmer.png', engineer: '/avatars/avatar_engineer.png',
  teacher: '/avatars/avatar_teacher.png', doctor: '/avatars/avatar_doctor.png',
  leader: '/avatars/avatar_leader.png', cook: '/avatars/avatar_cook.png',
  artist: '/avatars/avatar_artist.png', logistics: '/avatars/avatar_logistics.png',
  naturalist: '/avatars/avatar_naturalist.png', child: '/avatars/avatar_child.png',
}

const ACTIVITY_COLORS: Record<string, string> = {
  SLEEP: 'bg-gray-500', FARM_WORK: 'bg-yellow-500', WORKSHOP_WORK: 'bg-orange-500',
  TEACHING: 'bg-blue-500', CLINIC_HOURS: 'bg-emerald-500', ADMIN_WORK: 'bg-purple-500',
  DINNER: 'bg-pink-500', LUNCH: 'bg-pink-400', LEISURE: 'bg-teal-400',
  EXPLORATION: 'bg-cyan-400', LEARNING: 'bg-indigo-400', NIGHTLY_REFLECTION: 'bg-violet-500',
  default: 'bg-gray-400',
}

export default function Roster() {
  const agents = useWorldStore((s) => s.agents)
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId)
  const selectAgent = useWorldStore((s) => s.selectAgent)
  const memoryActivity = useWorldStore((s) => s.memoryActivity)
  const isRosterOpen = useWorldStore((s) => s.isRosterOpen)
  const setIsRosterOpen = useWorldStore((s) => s.setIsRosterOpen)

  if (!isRosterOpen) {
    return (
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-full flex flex-col items-center py-4 gap-4">
        <button 
          onClick={() => setIsRosterOpen(true)}
          className="p-2 bg-yellow-400 border-4 border-black hover:bg-yellow-300 shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1"
        >
          <ChevronRight size={24} strokeWidth={3} />
        </button>
        <div className="flex-1 flex flex-col items-center gap-4 mt-4 overflow-y-auto custom-scrollbar w-full">
          {Object.values(agents).map((agent) => (
            <button key={agent.id} onClick={() => { selectAgent(agent.id); setIsRosterOpen(true); }} className="relative group">
              <img 
                src={AVATAR_MAP[agent.profession.toLowerCase()] || '/avatars/avatar_farmer.png'} 
                alt={agent.name}
                className={`w-10 h-10 rounded-full border-2 border-black object-cover ${selectedAgentId === agent.id ? 'ring-4 ring-blue-500' : ''}`}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-full flex flex-col">
      <div className="p-3 border-b-4 border-black bg-yellow-400 flex items-center justify-between shrink-0">
        <h2 className="text-2xl text-black uppercase transform -skew-x-6 font-black drop-shadow-[2px_2px_0_#FFF] flex items-center gap-2">
          <Users size={24} /> ROSTER
        </h2>
        <button 
          onClick={() => setIsRosterOpen(false)}
          className="p-1 hover:bg-yellow-300 rounded-sm transition-colors border-2 border-transparent hover:border-black"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#f8f9fa] comic-halftone">
        {Object.values(agents).map((agent) => (
          <button
            key={agent.id}
            onClick={() => selectAgent(agent.id)}
            className={`w-full flex items-center gap-3 p-2 rounded-sm text-left transition-transform border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] ${
              selectedAgentId === agent.id ? 'bg-blue-200' : 'bg-white'
            } ${memoryActivity === agent.id ? 'animate-pulse bg-yellow-200' : ''}`}
          >
            <div className="flex-shrink-0 w-14 h-14 border-2 border-black bg-gray-200 rounded-full overflow-hidden">
              <img 
                src={AVATAR_MAP[agent.profession.toLowerCase()] || '/avatars/avatar_farmer.png'} 
                alt={agent.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-black font-['Comic_Neue'] uppercase truncate pr-2">
                  {agent.name}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-black uppercase transform rotate-2 whitespace-nowrap">
                  {agent.profession}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border-2 border-black font-bold text-[10px] uppercase truncate max-w-[80px] ${ACTIVITY_COLORS[agent.current_activity] || ACTIVITY_COLORS.default} text-black`}>
                  {agent.current_activity?.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-3 bg-gray-200 border-2 border-black overflow-hidden relative">
                  <div
                    className={`h-full ${agent.energy > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${agent.energy}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
