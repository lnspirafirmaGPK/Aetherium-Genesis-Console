import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from aether_bus import AetherBus
from bio_driver import MockBioDriver
from intent_processor import IntentProcessor
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
# driver = MockBioDriver(bus) # Disable background driver for this phase to focus on Interaction
intent_core = IntentProcessor(bus)

@app.on_event("startup")
async def startup_event():
    # Start the BioDriver loop in background (Optional now)
    # asyncio.create_task(driver.start_loop())
    pass

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to AetherBus Gateway")

    async def send_to_client(message: str):
        try:
            payload = json.loads(message)
            # PRGX1 Validation
            valid, reason = PRGX1.validate_payload(payload)
            if not valid:
                print(f"PRGX1 Blocked Outgoing: {reason}")
                return
            await websocket.send_text(message)
        except Exception as e:
            print(f"WS Send Error: {e}")
            raise e

    bus.subscribe(send_to_client)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                # Handle Incoming Body Signals
                message = json.loads(data)
                method = message.get("method")

                if method == "input/voice_data":
                    print("Brain: Received Voice Data. Entering MANANA (Processing)...")
                    # Trigger Intent Processing
                    await intent_core.process_voice_input(message.get("params", {}).get("text", "UNKNOWN"))

                elif method == "input/confirm_intent":
                    print("Brain: Received Intent Confirmation. Manifesting...")
                    await intent_core.confirm_intent()

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        print("Client disconnected")
        if send_to_client in bus.subscribers:
            bus.subscribers.remove(send_to_client)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
