import logging
import json
import os

class RSILogger:
    def __init__(self, log_file="audit_gate.log"):
        self.log_file = log_file

        # Setup logger
        self.logger = logging.getLogger("RSI_Audit")
        self.logger.setLevel(logging.INFO)

        # File handler
        handler = logging.FileHandler(self.log_file)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def log_event(self, source, action, status, payload_summary=None):
        """
        Log an event for Reinforcement Learning / Audit.
        """
        entry = {
            "source": source,
            "action": action,
            "status": status,
            "payload_summary": payload_summary
        }
        self.logger.info(json.dumps(entry))

# Global instance
audit_logger = RSILogger()
