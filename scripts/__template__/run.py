"""
Entry point for backend execution via child_process.spawn().

Standard interface for all RPAs in Torre RPA:
  - Parse --bot-id, --openport-token, --triggered-by from backend
  - Emit JSON logs to stdout for SSE streaming via core.logger
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.logger import emit_log
from core.models import BotConfig


def run(config: BotConfig) -> None:
    eid = config.bot_id
    emit_log("info", f"Iniciando automação '{config.name}'...", eid)

    # Criar diretórios de saída se necessário
    output_dir = Path(__file__).resolve().parent / "output"
    output_dir.mkdir(exist_ok=True)

    emit_log("success", "✓ Rotina concluída com sucesso.", eid)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bot-id", required=True)
    parser.add_argument("--openport-token", required=True)
    parser.add_argument("--triggered-by", default="")
    args = parser.parse_args()

    config = BotConfig(
        bot_id=args.bot_id,
        name="Novo RPA",
        openport_token=args.openport_token,
    )

    run(config)
