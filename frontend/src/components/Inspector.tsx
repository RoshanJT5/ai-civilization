import { useEffect, useState, useMemo } from 'react'
import { useWorldStore } from '../store/worldStore'
import { Brain, Lightbulb, Users, MemoryStick as Memory, Activity, X } from 'lucide-react'

const AVATAR_MAP: Record<string, string> = {
  farmer: '/avatars/avatar_farmer.png', engineer: '/avatars/avatar_engineer.png',
  teacher: '/avatars/avatar_teacher.png', doctor: '/avatars/avatar_doctor.png',
  leader: '/avatars/avatar_leader.png', cook: '/avatars/avatar_cook.png',
  artist: '/avatars/avatar_artist.png', logistics: '/avatars/avatar_logistics.png',
  naturalist: '/avatars/avatar_naturalist.png', child: '/avatars/avatar_child.png',
}

type Tab = 'tasks' | 'memories' | 'hypotheses'

export default function Inspector() {
  const selectedAgentId = useWorldStore((s) => s.selectedAgentId)
  const agents = useWorldStore((s) => s.agents)
  const events = useWorldStore((s) => s.events)
  const agent = selectedAgentId ? agents[selectedAgentId] : null
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [agentDetail, setAgentDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const selectAgent = useWorldStore((s) => s.selectAgent)

  const groupedMemories = useMemo(() => {
    if (!agentDetail?.memories) return {};
    return agentDetail.memories.reduce((acc: Record<string, any[]>, m: any) => {
      const sourceId = m.source_agent;
      const groupName = sourceId ? (agents[sourceId]?.name || sourceId) : 'Personal Memories';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(m);
      return acc;
    }, {});
  }, [agentDetail?.memories, agents]);

  useEffect(() => {
    if (!selectedAgentId) return setAgentDetail(null)
    setLoading(true)
    fetch(`/api/v1/agents/${selectedAgentId}`)
      .then((r) => r.json())
      .then((data) => { setAgentDetail(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedAgentId])

  if (!agent) {
    return (
      <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-full flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-black p-3 z-10 border-b-4 border-black">
          <h3 className="text-yellow-400 font-['Bangers'] text-3xl uppercase tracking-wider text-center">LIVE WORLD ACTIVITY</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] comic-halftone space-y-3 custom-scrollbar">
          {(() => {
            const displayEvents = events.filter(e => e.type !== 'MOVEMENT');
            if (displayEvents.length === 0) {
              return <p className="text-gray-500 text-center italic text-sm font-bold uppercase mt-8">No activity recorded yet...</p>;
            }

            return displayEvents.map((evt, idx) => {
              const agentName = evt.agent_id ? agents[evt.agent_id]?.name : 'System';
              const isMsg = evt.type === 'MESSAGE_SPOKEN' || evt.type === 'conversation';
              const isThought = evt.type === 'NEW_IDEA';
              
              let borderColor = 'border-green-400';
              if (isMsg) { borderColor = 'border-blue-400'; }
              if (isThought) { borderColor = 'border-purple-400'; }
              
              return (
                <div key={idx} className={`p-3 bg-white border-2 border-black shadow-[3px_3px_0_#000] border-l-8 ${borderColor}`}>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">{evt.type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Day {evt.day} | {evt.time}</span>
                  </div>
                  <p className="text-sm font-bold text-black font-['Comic_Neue'] leading-relaxed">
                    <span className="text-blue-600 font-black">{agentName}: </span>
                    {evt.summary || evt.content || JSON.stringify(evt.payload)}
                  </p>
                </div>
              )
            });
          })()}
        </div>
      </div>
    )
  }

  const containerClasses = isFullScreen 
    ? "fixed inset-8 z-[9999] bg-white border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden rounded-xl"
    : "bg-white border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] h-full flex flex-col overflow-hidden"

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={`p-4 border-b-4 border-black bg-[#4682B4] flex items-center gap-4 text-white shrink-0 relative ${isFullScreen ? 'py-6' : ''}`}>
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="bg-yellow-400 text-black border-2 border-black hover:bg-yellow-500 shadow-[2px_2px_0_#000] p-1 px-3 font-bold text-xs uppercase"
            title="Toggle Full Screen"
          >
            {isFullScreen ? 'Minimize' : 'Maximize'}
          </button>
          <button 
            onClick={() => { selectAgent(null); setIsFullScreen(false); }}
            className="bg-red-500 text-white border-2 border-black hover:bg-red-600 shadow-[2px_2px_0_#000] p-1"
            title="Close profile and return to Live World Activity"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
        <img 
          src={AVATAR_MAP[agent.profession?.toLowerCase()] || '/avatars/avatar_farmer.png'} 
          alt={agent.name}
          className="w-16 h-16 rounded-full border-4 border-black object-cover bg-white shadow-[2px_2px_0_#000]" 
        />
        <div className="flex-1">
          <h3 className="text-3xl font-display uppercase tracking-widest drop-shadow-[2px_2px_0_#000]">
            {agent.name}
          </h3>
          <p className="text-sm font-bold bg-black text-white px-2 py-0.5 inline-block uppercase transform -skew-x-6 mt-1">
            {agent.profession} · {agent.current_activity?.replace(/_/g, ' ')} · {agent.location_id?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 border-b-4 border-black bg-[#f8f9fa] grid grid-cols-2 gap-3">
        {[
          { label: 'Energy', value: agent.energy, color: 'bg-green-400' },
          { label: 'Hunger', value: 100 - agent.hunger, color: 'bg-red-400' },
          { label: 'Social', value: agent.social, color: 'bg-blue-400' },
          { label: 'Curiosity', value: agent.curiosity, color: 'bg-purple-400' },
        ].map((need) => (
          <div key={need.label} className="border-2 border-black bg-white p-1 shadow-[2px_2px_0_0_#000]">
            <div className="flex justify-between text-xs font-bold uppercase text-black mb-1">
              <span>{need.label}</span>
              <span>{need.value}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 border border-black relative overflow-hidden">
              <div className={`h-full border-r border-black ${need.color}`} style={{ width: `${need.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b-4 border-black bg-gray-200 shrink-0">
        {[
          { key: 'tasks', label: 'Tasks', icon: <Users size={16} /> },
          { key: 'memories', label: 'Memories', icon: <Memory size={16} /> },
          { key: 'hypotheses', label: 'Ideas', icon: <Lightbulb size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold uppercase text-sm border-r-4 border-black last:border-r-0 transition-colors ${
              activeTab === tab.key ? 'bg-yellow-400 text-black shadow-[inset_0_-4px_0_#000]' : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#f8f9fa] comic-halftone">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl font-bold animate-pulse text-black uppercase transform -rotate-3">LOADING...</span>
          </div>
        ) : activeTab === 'memories' ? (
          <div className={`space-y-6 ${isFullScreen ? 'p-4' : ''}`}>
            {Object.entries(groupedMemories).map(([groupName, groupMemories]: [string, any]) => (
              <div key={groupName} className="mb-6">
                <h4 className="text-xl font-['Bangers'] tracking-widest uppercase mb-3 text-white bg-black inline-block px-4 py-1 transform -skew-x-6 border-2 border-white shadow-[2px_2px_0_#FFD700]">
                  {groupName === 'Personal Memories' ? groupName : `Memories with ${groupName}`}
                </h4>
                <div className={`grid gap-3 ${isFullScreen ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {groupMemories.map((m: any) => (
                    <div key={m.id} className="p-3 bg-white border-2 border-black shadow-[3px_3px_0_#000] flex flex-col justify-between">
                      <p className="text-sm font-bold text-black font-['Comic_Neue'] leading-relaxed mb-3">
                        "{m.summary}"
                      </p>
                      <div className="flex gap-2 items-center mt-auto border-t-2 border-dashed border-gray-300 pt-2">
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">{m.type}</span>
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Day {m.day} {m.time ? `| ${m.time}` : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!agentDetail?.memories || agentDetail.memories.length === 0) && (
              <p className="text-gray-500 text-center italic mt-4 font-bold uppercase">No memories recorded yet...</p>
            )}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className={`space-y-3 ${isFullScreen ? 'grid grid-cols-2 lg:grid-cols-4 gap-4 space-y-0 p-4' : ''}`}>
            {events.filter(e => e.agent_id === selectedAgentId && e.type !== 'MOVEMENT').reverse().map((evt, idx) => {
              const isMsg = evt.type === 'MESSAGE_SPOKEN' || evt.type === 'conversation';
              const isThought = evt.type === 'NEW_IDEA';
              let borderColor = 'border-green-400';
              if (isMsg) { borderColor = 'border-blue-400'; }
              if (isThought) { borderColor = 'border-purple-400'; }

              return (
                <div key={idx} className={`p-3 bg-white border-2 border-black shadow-[3px_3px_0_#000] border-l-8 ${borderColor} flex flex-col justify-between`}>
                  <div className="flex gap-2 items-center mb-2">
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">{evt.type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase">Day {evt.day} | {evt.time}</span>
                  </div>
                  <p className="text-sm font-bold text-black font-['Comic_Neue'] leading-relaxed">
                    {evt.summary || evt.content || JSON.stringify(evt.payload)}
                  </p>
                </div>
              )
            })}
            {events.filter(e => e.agent_id === selectedAgentId && e.type !== 'MOVEMENT').length === 0 && (
              <p className="text-gray-500 text-center italic mt-4 font-bold uppercase col-span-full">No tasks recorded yet...</p>
            )}
          </div>
        ) : (
          <div className={`space-y-3 ${isFullScreen ? 'grid grid-cols-2 lg:grid-cols-4 gap-4 space-y-0 p-4' : ''}`}>
            {agentDetail?.hypotheses?.map((h: any) => (
              <div key={h.id} className="p-3 bg-white border-2 border-black shadow-[3px_3px_0_#000] border-l-8 border-l-purple-500 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg text-black uppercase mb-1">{h.title}</h4>
                  <p className="text-sm font-bold text-gray-700 font-['Comic_Neue'] mb-4">{h.description}</p>
                </div>
                <div className="mt-auto pt-2 border-t-2 border-dashed border-gray-300">
                  <span className="bg-black text-white text-xs font-bold px-2 py-1 uppercase">{h.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
