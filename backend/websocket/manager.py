from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"✅ WebSocket connected. Active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        print(f"❌ WebSocket disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        print(f"📡 Broadcasting to {len(self.active_connections)} clients")
        print("Message:", message)

        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                print("✅ Message sent to client")
            except Exception as e:
                print("❌ Failed to send message:", e)
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


manager = ConnectionManager()