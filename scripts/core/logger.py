import json
import sys
from datetime import datetime, timezone


def emit_log(level: str, message: str, execution_id: str = "") -> None:
    entry = {
        "executionId": execution_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "message": message,
    }
    print(json.dumps(entry), flush=True)
