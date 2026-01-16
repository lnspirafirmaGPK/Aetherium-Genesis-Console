import asyncio
import json
from logger import audit_logger

class AetherBus:
    def __init__(self):
        self.subscribers = []
        self.dead_letter_queue = []

    def subscribe(self, callback):
        self.subscribers.append(callback)

    async def publish(self, topic, payload, identity_header):
        """
        Publish a message to all subscribers.
        Topic: e.g., "intent.light"
        """
        # Construct MCP Payload
        mcp_payload = {
            "jsonrpc": "2.0",
            "method": f"tools/{topic}",
            "params": {
                "name": topic,
                "arguments": payload,
                "_identity": identity_header
            }
        }

        # Serialize
        try:
            message_text = json.dumps(mcp_payload)
        except Exception as e:
            self._handle_dead_letter(payload, f"Serialization Error: {e}")
            return

        # Broadcast
        active_subscribers = []
        for callback in self.subscribers:
            try:
                await callback(message_text)
                active_subscribers.append(callback)
            except Exception as e:
                # Subscriber failed (disconnected?)
                # We might remove them or just log
                audit_logger.log_event("AetherBus", "Publish", "SubscriberFailed", str(e))

        # Update subscribers list (remove disconnected ones if needed, but for now we keep simple)
        # Logging
        audit_logger.log_event(identity_header.get("source_id"), "Publish", "Success", {"topic": topic})

    def _handle_dead_letter(self, payload, reason):
        print(f"Dead Letter: {reason}")
        self.dead_letter_queue.append({
            "payload": payload,
            "reason": reason,
            "timestamp": "NOW" # TODO use time
        })
        audit_logger.log_event("AetherBus", "DeadLetter", "Error", reason)
