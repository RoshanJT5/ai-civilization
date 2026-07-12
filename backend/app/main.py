import asyncio
import json
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import init_db, SessionLocal
from app.db.seeding import seed_database
from app.simulation.engine import SimulationEngine
from app.api.routers import world, agents, timeline, admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connected_websockets: set[WebSocket] = set()
simulation_engine: SimulationEngine | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global simulation_engine
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    simulation_engine = SimulationEngine(on_state_change=broadcast_state)
    simulation_engine.load_state(SessionLocal())
    task = asyncio.create_task(simulation_engine.start())
    yield
    simulation_engine.stop()
    task.cancel()


app = FastAPI(title="AI Civilization", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(world.router)
app.include_router(agents.router)
app.include_router(timeline.router)
app.include_router(admin.router)


def broadcast_state(state_diff: dict):
    for ws in connected_websockets.copy():
        try:
            asyncio.create_task(ws.send_json(state_diff))
        except Exception:
            connected_websockets.discard(ws)


@app.websocket("/api/v1/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    logger.info("WebSocket connected")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data.startswith("speed:"):
                speed = data.split(":")[1]
                if simulation_engine:
                    simulation_engine.set_speed(speed)
                    db = SessionLocal()
                    try:
                        simulation_engine.save_state(db)
                    finally:
                        db.close()
    except WebSocketDisconnect:
        pass
    finally:
        connected_websockets.discard(websocket)
        logger.info("WebSocket disconnected")


@app.get("/health")
def health():
    return {"status": "ok"}
