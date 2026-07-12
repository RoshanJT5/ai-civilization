import React, { useMemo } from 'react';
import { useWorldStore } from '../store/worldStore';

const BACKGROUNDS: Record<string, string> = {
  town_hall: '/backgrounds/town_square.png',
  farm: '/backgrounds/farm_field.png',
  kitchen: '/backgrounds/cozy_house.png',
  workshop: '/backgrounds/town_square.png', // Fallback
  library: '/backgrounds/cozy_house.png', // Fallback
  clinic: '/backgrounds/cozy_house.png', // Fallback
  reservoir: '/backgrounds/farm_field.png', // Fallback
};

const getBackgroundImage = (locationId: string) => {
  const loc = locationId.toLowerCase();
  if (BACKGROUNDS[loc]) return BACKGROUNDS[loc];
  if (loc.includes('farm')) return BACKGROUNDS.farm;
  if (loc.includes('kitchen') || loc.includes('house') || loc.includes('clinic')) return BACKGROUNDS.kitchen;
  return BACKGROUNDS.town_hall;
};

const AVATAR_MAP: Record<string, string> = {
  farmer: '/avatars/avatar_farmer.png', engineer: '/avatars/avatar_engineer.png',
  teacher: '/avatars/avatar_teacher.png', doctor: '/avatars/avatar_doctor.png',
  leader: '/avatars/avatar_leader.png', cook: '/avatars/avatar_cook.png',
  artist: '/avatars/avatar_artist.png', logistics: '/avatars/avatar_logistics.png',
  naturalist: '/avatars/avatar_naturalist.png', child: '/avatars/avatar_child.png',
};

const CharacterSprite = ({ agent, isSpeaking }: { agent: any, isSpeaking: boolean }) => {
  return (
    <div className={`relative flex flex-col items-center justify-end h-full pointer-events-auto ${isSpeaking ? 'z-[100]' : 'z-10'}`} style={{ width: '300px' }}>
      <img 
        src={AVATAR_MAP[agent.profession.toLowerCase()] || '/avatars/avatar_farmer.png'}
        alt={agent.name}
        className={`w-full h-auto object-contain cursor-pointer transition-all duration-300 ${isSpeaking ? 'scale-110 drop-shadow-[12px_12px_0_rgba(255,215,0,0.8)]' : 'drop-shadow-[8px_8px_0_rgba(0,0,0,0.7)] hover:scale-105'}`}
        style={{ maxHeight: '70vh' }}
        onClick={() => useWorldStore.getState().selectAgent(agent.id)}
      />
      {/* Nametag */}
      <div className={`absolute bottom-4 px-3 py-1 font-['Bangers'] text-xl tracking-wider rounded-md border-2 shadow-[2px_2px_0_#000] transition-colors ${isSpeaking ? 'bg-yellow-400 text-black border-black' : 'bg-black text-white border-white'}`}>
        {agent.name}
      </div>
    </div>
  );
};

export default function SceneViewer() {
  const currentLocation = useWorldStore(s => s.currentViewLocation);
  const agents = useWorldStore(s => s.agents);
  const events = useWorldStore(s => s.events);
  const selectedAgentId = useWorldStore(s => s.selectedAgentId);

  // Find agents currently in this location
  const presentAgents = useMemo(() => {
    return Object.values(agents).filter(
      a => (a.location_id?.toLowerCase() || 'town_hall') === currentLocation.toLowerCase()
    );
  }, [agents, currentLocation]);

  // Find the most recent conversation event in this location
  const activeDialogue = useMemo(() => {
    const presentAgentIds = new Set(presentAgents.map(a => a.id));
    return events.find(e => 
      (e.type === 'MESSAGE_SPOKEN' || e.type === 'CONVERSATION') && 
      e.agent_id && 
      presentAgentIds.has(e.agent_id)
    );
  }, [events, presentAgents]);

  // Parse active speakers to highlight both characters in a conversation
  const activeSpeakers = useMemo(() => {
    if (!activeDialogue) return [];
    const contentStr = activeDialogue.content || activeDialogue.payload || activeDialogue.summary || "";
    if (activeDialogue.type === 'CONVERSATION' && contentStr.includes(':')) {
       return contentStr.split('\n').map(line => {
         const colonIdx = line.indexOf(':');
         return colonIdx > -1 ? line.substring(0, colonIdx).trim().toLowerCase() : '';
       }).filter(Boolean);
    }
    const agentName = agents[activeDialogue.agent_id!]?.name;
    return agentName ? [agentName.toLowerCase()] : [];
  }, [activeDialogue, agents]);

  const bgImage = getBackgroundImage(currentLocation);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')`, opacity: 0.8 }}
      />
      
      {/* Location Label (Top Left) */}
      <div className="absolute top-6 left-6 z-30">
        <div className="bg-black text-white px-6 py-2 font-display text-2xl uppercase transform -skew-x-6 border-4 border-white shadow-[4px_4px_0_#FFD700]">
          {currentLocation.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Characters Layer */}
      <div className="absolute bottom-32 left-0 right-0 h-2/3 flex items-end justify-center gap-8 px-12 z-10 pointer-events-none">
        {presentAgents.length === 0 ? (
          <div className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded">
            No one is here right now...
          </div>
        ) : (
          presentAgents.map(agent => (
            <CharacterSprite 
              key={agent.id} 
              agent={agent} 
              isSpeaking={activeSpeakers.includes(agent.name.toLowerCase())} 
            />
          ))
        )}
      </div>

      {/* Visual Novel Dialogue Box (Bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl z-30">
        {activeDialogue ? (
          <div className="bg-white/95 border-4 border-black p-6 shadow-[8px_8px_0_rgba(0,0,0,1)] rounded-xl relative">
            <div className="absolute -top-5 left-6 bg-yellow-400 border-4 border-black px-4 py-1 font-['Bangers'] text-2xl tracking-widest uppercase shadow-[4px_4px_0_#000]">
              {activeDialogue.type === 'CONVERSATION' ? 'CONVERSATION' : (agents[activeDialogue.agent_id!]?.name || 'Unknown')}
            </div>
            
            {(() => {
              const contentStr = activeDialogue.content || activeDialogue.payload || activeDialogue.summary;
              if (activeDialogue.type === 'CONVERSATION' && contentStr.includes(':')) {
                const lines = contentStr.split('\n');
                return (
                  <div className="flex flex-col gap-4 mt-2">
                    {lines.map((line, i) => {
                      const colonIdx = line.indexOf(':');
                      if (colonIdx > -1) {
                        const speaker = line.substring(0, colonIdx).trim();
                        const text = line.substring(colonIdx + 1).trim();
                        return (
                          <div key={i} className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">{speaker}</span>
                            <p className="text-2xl font-bold text-black font-['Comic_Neue'] leading-snug">
                              "{text}"
                            </p>
                          </div>
                        );
                      }
                      return <p key={i} className="text-2xl font-bold text-black font-['Comic_Neue'] mt-2 leading-relaxed">"{line}"</p>;
                    })}
                  </div>
                );
              }
              return (
                <p className="text-2xl font-bold text-black font-['Comic_Neue'] mt-2 leading-relaxed">
                  "{contentStr}"
                </p>
              );
            })()}
          </div>
        ) : (
          <div className="bg-black/80 border-2 border-white p-4 rounded-xl text-center">
            <p className="text-white/70 italic font-['Comic_Neue'] text-lg">Silence falls over the area...</p>
          </div>
        )}
      </div>
    </div>
  );
}
