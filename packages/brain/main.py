import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from aether_bus import AetherBus
from bio_driver import MockBioDriver
from identity import PRGX1

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Systems
bus = AetherBus()
driver = MockBioDriver(bus)

@app.on_event("startup")
async def startup_event():
    # Start the BioDriver loop in background
    asyncio.create_task(driver.start_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to AetherBus Gateway")

    # Callback to send message to this specific websocket
    async def send_to_client(message: str):
        try:
            # Validate Outgoing? (Optional, PRGX1 typically validates Incoming from LLM,
            # but here we can validate before sending to Body)
            payload = json.loads(message)
            valid, reason = PRGX1.validate_payload(payload)
            if not valid:
                print(f"PRGX1 Blocked Outgoing: {reason}")
                return

            await websocket.send_text(message)
        except Exception as e:
            print(f"WS Send Error: {e}")
            raise e # Trigger disconnect handling

    # Subscribe this client to the bus
    bus.subscribe(send_to_client)

    try:
        while True:
            # Keep connection open and listen for client messages (Heartbeats/Interactions)
            # In a full system, the Body might send "Touched" events back.
            data = await websocket.receive_text()
            # We could process client intents here...

    except WebSocketDisconnect:
        print("Client disconnected")
        # In a real Pub/Sub, we would unsubscribe.
        # For this prototype, the send_to_client closure might leak or fail,
        # but AetherBus handles exception in publish loop.
        if send_to_client in bus.subscribers:
            bus.subscribers.remove(send_to_client)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
