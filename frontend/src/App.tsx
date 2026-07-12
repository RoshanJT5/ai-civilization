import { useEffect, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Roster from './components/Roster'
import Map from './components/Map'
import Inspector from './components/Inspector'
import ComicConversation from './components/ComicConversation'
import SceneViewer from './components/SceneViewer'
import ProvenanceGraph from './components/ProvenanceGraph'
import { useWorldStore } from './store/worldStore'

const WS_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? `ws://${window.location.hostname}:8000/api/v1/stream` 
  : `wss://ai-civilization.onrender.com/api/v1/stream`;

export default function App() {
  const wsRef = useRef<WebSocket | null>(null)
  const handleStateDiff = useWorldStore((s) => s.handleStateDiff)
  const setConnected = useWorldStore((s) => s.setConnected)
  const setWorld = useWorldStore((s) => s.setWorld)
  const speed = useWorldStore((s) => s.speed)
  const uiMode = useWorldStore((s) => s.uiMode)
  const isRosterOpen = useWorldStore((s) => s.isRosterOpen)
  const [isProvenanceExpanded, setIsProvenanceExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/v1/world')
      .then((r) => r.json())
      .then((data) => setWorld(data))
      .catch(console.error)

    fetch('/api/v1/agents')
      .then((r) => r.json())
      .then((agents) => {
        for (const agent of agents) {
          useWorldStore.getState().updateAgent(agent.id, agent)
        }
      })
      .catch(console.error)
  }, [setWorld])

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (speed !== 'paused') {
          ws.send(`speed:${speed}`)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleStateDiff(data)
        } catch {
          // ping/pong or text commands
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [handleStateDiff, setConnected, speed])

  return (
    <div className="h-screen w-screen flex flex-col gap-3 p-3 bg-[#111111] overflow-hidden">
      <TopBar />

      <div className="flex-1 flex gap-3 min-h-0 relative">
        <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${isRosterOpen ? 'w-64' : 'w-16'}`}>
          <Roster />
        </div>

        {uiMode === 'visual_novel' ? (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex-1 rounded-sm overflow-hidden">
              <SceneViewer />
            </div>
          </div>
        ) : (
          <div className="flex-1 border-4 border-black rounded-sm shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden">
            <Map />
          </div>
        )}

        <div className="w-96 flex-shrink-0 flex flex-col gap-3">
          <div className="flex-1 overflow-hidden">
            <Inspector />
          </div>
          {uiMode === 'comic_map' && (
            <div className="flex-1 overflow-hidden border-4 border-black bg-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
              <ComicConversation />
            </div>
          )}
        </div>
      </div>

      <div className={`${isProvenanceExpanded ? 'h-[60vh]' : 'h-40'} transition-all duration-300 ease-in-out flex-shrink-0 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-white relative z-[9999]`}>
        <ProvenanceGraph isExpanded={isProvenanceExpanded} onToggle={() => setIsProvenanceExpanded(!isProvenanceExpanded)} />
      </div>
    </div>
  )
}
