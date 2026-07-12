import { useWorldStore } from '../store/worldStore'
import { Activity, ChevronUp, ChevronDown } from 'lucide-react'

export default function ProvenanceGraph({ isExpanded, onToggle }: { isExpanded: boolean, onToggle: () => void }) {
  const events = useWorldStore((s) => s.events)

  const containerClass = "h-full w-full flex flex-col p-4 bg-[#f8f9fa] comic-halftone relative overflow-hidden"

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl text-black font-display uppercase transform -skew-x-6 drop-shadow-[2px_2px_0_#4682B4]">
            CAUSAL PROVENANCE
          </h2>
          <span className="bg-black text-white px-2 py-1 text-sm font-bold uppercase transform rotate-2">
            LIVE FEED
          </span>
        </div>
        <button 
          onClick={onToggle}
          className="bg-yellow-400 text-black border-4 border-black p-1 hover:bg-yellow-300 hover:-translate-y-1 transition-transform shadow-[4px_4px_0_#000]"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown size={24} strokeWidth={3} /> : <ChevronUp size={24} strokeWidth={3} />}
        </button>
      </div>

      <div className={`flex-1 flex gap-8 relative z-10 custom-scrollbar px-2 pb-2 ${
        isExpanded ? 'overflow-y-auto flex-wrap content-start items-start pt-4' : 'overflow-x-auto items-center'
      }`}>
        {events.length === 0 ? (
          <div className="text-center w-full">
            <Activity size={48} className="mx-auto mb-2 text-gray-800 drop-shadow-[2px_2px_0_#ccc]" />
            <p className="text-black font-bold uppercase text-xl transform -rotate-2">AWAITING SYSTEM EVENTS...</p>
          </div>
        ) : (
          events
            .filter((evt, index, arr) => {
              if (index === 0) return true;
              const prev = arr[index - 1];
              return !(evt.agent_id === prev.agent_id && evt.type === prev.type && evt.summary === prev.summary);
            })
            .slice(0, 30)
            .map((evt, idx) => (
            <div key={idx} className="flex-shrink-0 flex items-center gap-4 w-[650px] p-4 bg-white border-4 border-black shadow-[4px_4px_0_#000]">
              <div className="w-1/3 p-3 bg-yellow-100 border-2 border-black relative">
                <span className="absolute -top-3 -left-3 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase transform -rotate-6">TRIGGER</span>
                <p className="text-sm font-bold text-black font-['Comic_Neue']">{evt.trigger || 'Spontaneous Action'}</p>
              </div>
              
              <div className="flex-1 p-3 bg-blue-100 border-2 border-black relative text-center">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 text-xs font-bold uppercase transform rotate-2">ACTION</span>
                <h3 className="font-bold text-sm text-black uppercase">{evt.type.replace(/_/g, ' ')}</h3>
                <p className="text-xs font-bold text-gray-800 font-['Comic_Neue'] mt-1 line-clamp-2">
                  {evt.summary || evt.content || JSON.stringify(evt.payload)}
                </p>
              </div>

              <div className="w-1/3 p-3 bg-purple-100 border-2 border-black relative">
                <span className="absolute -top-3 -right-3 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase transform rotate-6">IMPACT</span>
                <p className="text-sm font-bold text-black font-['Comic_Neue']">{evt.impact || 'State Updated'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
