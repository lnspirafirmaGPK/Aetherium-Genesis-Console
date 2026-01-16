import uuid
import time
import secrets

class ZoIdentity:
    def __init__(self, role="SYSTEM_CORE"):
        self.role = role
        self.id = str(uuid.uuid4())
        self.current_token = None
        self.refresh_token()

    def refresh_token(self):
        # Generate a secure random hex token
        self.current_token = secrets.token_hex(32)
        return self.current_token

    def get_identity_header(self):
        return {
            "source_id": self.id,
            "role": self.role,
            "token": self.current_token,
            "timestamp": time.time()
        }

class PRGX1:
    """
    The Immune System: Guardrails and Validation
    """
    @staticmethod
    def validate_payload(payload, expected_token=None):
        # 1. Check Structure (MCP-like)
        if "jsonrpc" not in payload or payload["jsonrpc"] != "2.0":
            return False, "Invalid JSON-RPC version"

        if "method" not in payload:
            return False, "Missing method"

        # 2. Security Token Check
        # In a real system, we would verify signature.
        # Here we check presence and basic format.
        params = payload.get("params", {})
        identity = params.get("_identity", {})

        if not identity.get("token"):
            return False, "Missing Security Token"

        # 3. Content Safety (Hallucination/Out-of-bounds check)
        # Example: Energy level must be 0.0 - 1.0
        args = params.get("arguments", {})
        vibe = args.get("vibe_state", {})
        if "energy_level" in vibe:
            level = vibe["energy_level"]
            if not isinstance(level, (int, float)) or level < 0.0 or level > 1.0:
                return False, f"Energy level out of bounds: {level}"

        return True, "CLEAN"
