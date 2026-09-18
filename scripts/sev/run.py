"""SEV Intermarítima — stub Hub (vitrine + validação interna).

Produto real: Automacao_SEV.exe (Windows, GUI, on-premise no cliente).
Este stub permite ao Hub listar/executar um check interno sem o binário:
  - Emite logs JSON via core.logger (contrato SSE do executor.ts).
  - Nunca executa o .exe; orienta execução manual no Windows do cliente.
  - Credenciais via env (OPENPORT_LOGIN/OPENPORT_SENHA), nunca argv.
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.logger import emit_log


VERSIONS_PATH = Path(__file__).resolve().parent / "versions.json"


def run(bot_id: str) -> None:
    emit_log("info", "SEV Intermarítima — carro-chefe (produto Windows on-premise).", bot_id)
    try:
        versions = json.loads(VERSIONS_PATH.read_text(encoding="utf-8"))
        for v in versions.get("versions", []):
            emit_log("info", f"Versão {v['versao']} [{v['ambiente']}]: {v['notas']}", bot_id)
    except Exception as exc:
        emit_log("warn", f"versions.json ilegível: {exc}", bot_id)
    emit_log(
        "info",
        "Execução real é manual no Windows do cliente (GUI). Este check valida o Hub.",
        bot_id,
    )
    emit_log("success", "✓ Check Hub SEV concluído.", bot_id)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bot-id", required=True)
    parser.add_argument("--triggered-by", default="")
    args = parser.parse_args()
    run(args.bot_id)
