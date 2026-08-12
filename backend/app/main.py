from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import async_engine, Base
from app.api.v1.api import api_router
from app.websocket.connection_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup for instant development/testing readiness
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Restaurant Management & Ordering System API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# WebSockets Endpoint for Branch Kitchen & Cashier
@app.websocket("/ws/branch/{branch_id}")
async def websocket_branch_endpoint(websocket: WebSocket, branch_id: str):
    await manager.connect_branch(websocket, branch_id)
    try:
        while True:
            # Keep connection alive & receive client pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_branch(websocket, branch_id)

# WebSockets Endpoint for Customer Order Tracking
@app.websocket("/ws/order/{order_id}")
async def websocket_order_endpoint(websocket: WebSocket, order_id: str):
    await manager.connect_order_tracker(websocket, order_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_order_tracker(websocket, order_id)
