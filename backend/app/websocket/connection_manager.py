import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger("websocket")

class ConnectionManager:
    def __init__(self):
        # active_connections: dict mapping branch_id or "global" to list of WebSockets
        self.branch_connections: Dict[str, Set[WebSocket]] = {}
        self.order_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_branch(self, websocket: WebSocket, branch_id: str):
        await websocket.accept()
        if branch_id not in self.branch_connections:
            self.branch_connections[branch_id] = set()
        self.branch_connections[branch_id].add(websocket)
        logger.info(f"WebSocket client connected to branch: {branch_id}")

    def disconnect_branch(self, websocket: WebSocket, branch_id: str):
        if branch_id in self.branch_connections and websocket in self.branch_connections[branch_id]:
            self.branch_connections[branch_id].remove(websocket)
            logger.info(f"WebSocket client disconnected from branch: {branch_id}")

    async def connect_order_tracker(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.order_connections:
            self.order_connections[order_id] = set()
        self.order_connections[order_id].add(websocket)

    def disconnect_order_tracker(self, websocket: WebSocket, order_id: str):
        if order_id in self.order_connections and websocket in self.order_connections[order_id]:
            self.order_connections[order_id].remove(websocket)

    async def broadcast_to_branch(self, branch_id: str, message: dict):
        # Broadcast to specific branch listeners AND global listeners ("ALL")
        targets = set()
        if branch_id in self.branch_connections:
            targets.update(self.branch_connections[branch_id])
        if "ALL" in self.branch_connections:
            targets.update(self.branch_connections["ALL"])

        payload = json.dumps(message)
        disconnected = set()
        for connection in targets:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.error(f"Failed sending WS message: {e}")
                disconnected.add(connection)
        
        for conn in disconnected:
            for b_id in self.branch_connections:
                self.branch_connections[b_id].discard(conn)

    async def broadcast_order_update(self, order_id: str, message: dict):
        if order_id in self.order_connections:
            payload = json.dumps(message)
            disconnected = set()
            for connection in self.order_connections[order_id]:
                try:
                    await connection.send_text(payload)
                except Exception:
                    disconnected.add(connection)
            for conn in disconnected:
                self.order_connections[order_id].discard(conn)

manager = ConnectionManager()
