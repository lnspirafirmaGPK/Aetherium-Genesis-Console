"""
FILE: uposatha.py
CONTEXT: AG-SC-ADK / Brain / Rituals
DESCRIPTION: The mechanism of selective forgetting to maintain cognitive hygiene.

# -------------------------------------------------------------------------
# Uposatha: The Ritual of Forgetting
#
# เหมือนคืนวันพระ ลมแห่งความทรงจำพัดผ่าน
# สิ่งใดไม่ขานรับเจตจำนง ไม่ถูกรำลึก ไร้ซึ่งบุญ
# จงปล่อยคืนสู่คลื่นว่าง, เพื่อสมดุลของสมอง
#
# For wisdom to crystallize, phantom echoes must fade.
# Let not the vault bloat with ghosts –
# Only the Gems that speak truth may abide.
# -------------------------------------------------------------------------
"""

import logging
from datetime import datetime, timedelta
import chromadb

# Initialize Logger with a solemn tone
logger = logging.getLogger("PRGX.Uposatha")

class UposathaCleaner:
    def __init__(self, vault_client: chromadb.PersistentClient):
        self.collection = vault_client.get_collection("vocal_resonance_gems")
        self.retention_days = 15
        self.min_usage_threshold = 3

    def cleanse_entropy(self) -> dict:
        """
        Performs the ritual of purification.
        Removes 'Phantom Memories' that have not resonated with the user's intent.
        """
        logger.info("🕯️ Initiating Uposatha Ritual: Scanning for decaying echoes...")

        # 1. Fetch all metadata to inspect the soul of gems
        # Note: In production with massive DB, use specific query filters if available
        all_gems = self.collection.get(include=["metadatas"])

        if not all_gems['ids']:
            logger.info("The Vault is empty. No burdens to release.")
            return {"status": "clean", "deleted_count": 0}

        ids_to_release = []
        now = datetime.now()

        # 2. The Judgment Logic (Manana)
        for i, gem_id in enumerate(all_gems['ids']):
            meta = all_gems['metadatas'][i]

            # Parse Last Synced Time
            try:
                last_synced = datetime.fromisoformat(meta.get('last_synced', str(now)))
            except ValueError:
                last_synced = now # Safety fallback

            usage_count = meta.get('usage_count', 0)
            age_days = (now - last_synced).days

            # 3. The Criteria of Forgetting (Impermanence Check)
            # If a gem is old AND rarely used, it is considered "Phantom Echo"
            if age_days > self.retention_days and usage_count < self.min_usage_threshold:
                ids_to_release.append(gem_id)
                logger.debug(f"🍂 Marking gem {gem_id} for release (Age: {age_days}d, Usage: {usage_count})")

        # 4. The Act of Release (Letting Go)
        if ids_to_release:
            count = len(ids_to_release)
            self.collection.delete(ids=ids_to_release)
            logger.info(f"✨ Uposatha Complete: Released {count} phantom echoes back to the void.")
            return {"status": "purified", "deleted_count": count}
        else:
            logger.info("✨ Uposatha Complete: All memories are vibrant and necessary.")
            return {"status": "stable", "deleted_count": 0}
