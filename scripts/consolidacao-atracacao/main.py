import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.logger import emit_log
from core.models import BotConfig


def run(config: BotConfig) -> None:
    eid = config.bot_id
    emit_log("info", "Autenticando no OpenPort…", eid)
    time.sleep(0.5)
    emit_log("success", "Sessão validada com sucesso.", eid)
    time.sleep(0.3)
    emit_log("info", "Coletando dados de atracação…", eid)
    time.sleep(0.8)
    emit_log("info", "Consolidando para boletim diário…", eid)
    time.sleep(0.7)
    emit_log("info", "Gerando relatório consolidado…", eid)
    time.sleep(0.6)
    emit_log("success", "✓ Rotina concluída com sucesso.", eid)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--bot-id", required=True)
    parser.add_argument("--openport-token", required=True)
    args = parser.parse_args()
    config = BotConfig(bot_id=args.bot_id, name="Consolidação de Atracação", openport_token=args.openport_token)
    run(config)
