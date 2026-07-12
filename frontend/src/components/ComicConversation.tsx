import React from 'react';
import { useWorldStore } from '../store/worldStore';

interface ComicPanelProps {
  speakerName: string;
  speakerProfession: string;
  message: string;
  emotion?: string;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ speakerName, speakerProfession, message, emotion }) => {
  const getShirtColor = (profession: string) => {
    const colors: Record<string, string> = {
      farmer: '#8B5A2B', engineer: '#4F4F4F', teacher: '#4682B4', 
      doctor: '#E6E6FA', leader: '#FFD700', child: '#FFC0CB'
    };
    return colors[profession.toLowerCase()] || '#ccc';
  };

  const getEmotionEffect = (emo?: string) => {
    switch(emo?.toLowerCase()) {
      case 'angry': return 'bg-red-100 border-red-600';
      case 'happy': return 'bg-yellow-100 border-yellow-500';
      case 'sad': return 'bg-blue-100 border-blue-500';
      case 'thinking': return 'bg-purple-100 border-purple-500';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  return (
    <div className={`comic-panel relative p-4 w-full min-h-[160px] flex items-center justify-between mb-4 transform transition-transform hover:scale-[1.02] ${getEmotionEffect(emotion)} comic-halftone`}>
      {/* Speech Bubble */}
      <div className="comic-bubble w-2/3 text-lg font-bold tracking-wide z-10 animate-bounce-in">
        {message}
      </div>

      {/* Stylized Human Avatar (Close-up) */}
      <div className="w-1/3 flex justify-center items-end h-full">
        <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
           <circle cx="50" cy="30" r="20" fill="#FFCDB2" stroke="#000" strokeWidth="4" />
           {/* Eyes */}
           <circle cx="42" cy="25" r="3" fill="#000" />
           <circle cx="58" cy="25" r="3" fill="#000" />
           {/* Emotion details */}
           {emotion === 'angry' && <path d="M 38,20 L 46,23 M 62,20 L 54,23" stroke="#000" strokeWidth="3" />}
           {emotion === 'happy' && <path d="M 40,35 Q 50,45 60,35" fill="none" stroke="#000" strokeWidth="3" />}
           {(emotion === 'neutral' || !emotion) && <line x1="45" y1="38" x2="55" y2="38" stroke="#000" strokeWidth="3" />}
           {/* Body */}
           <path d="M 20,90 Q 50,60 80,90 Z" fill={getShirtColor(speakerProfession)} stroke="#000" strokeWidth="4" />
        </svg>
      </div>

      {/* Name Tag overlay */}
      <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-sm font-['Bangers'] transform -rotate-2 shadow-[2px_2px_0_#FFD700]">
        {speakerName.toUpperCase()}
      </div>
      
      {emotion && (
        <div className="absolute bottom-2 right-2 bg-white border-2 border-black px-2 py-1 text-xs font-bold uppercase shadow-[2px_2px_0_#000] transform rotate-3 text-red-600">
          * {emotion} *
        </div>
      )}
    </div>
  );
};

export default function ComicConversation() {
  const events = useWorldStore((s) => s.events) || [];
  
  // Filter events to find spoken messages
  const conversations = events.filter(e => e.type === 'MESSAGE_SPOKEN' || e.type === 'conversation');

  return (
    <div className="h-full flex flex-col p-4 bg-[#f8f9fa] border-l-4 border-black overflow-y-auto custom-scrollbar">
      <h2 className="text-4xl text-black mb-6 text-center transform -skew-x-6 drop-shadow-[3px_3px_0_#FFD700]">
        LATEST CHATTER!
      </h2>
      
      {conversations.length === 0 ? (
        <div className="comic-panel p-6 text-center text-black font-bold text-xl">
          <p>No one is talking right now...</p>
          <p className="text-gray-500 text-sm mt-2">WAITING FOR ACTION!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {conversations.map((msg, idx) => (
            <ComicPanel 
              key={idx}
              speakerName={msg.agent_name || 'Unknown'}
              speakerProfession={msg.agent_profession || 'Citizen'}
              message={msg.content || msg.payload || ''}
              emotion={msg.emotion || 'neutral'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
