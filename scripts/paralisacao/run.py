"""Entry point for backend execution via child_process.spawn().

Integrates the paralisacao RPA with the Painel RPA monorepo:
  - Parses --bot-id and --openport-token from the backend
  - Sets up JSON logging to stdout for SSE streaming
  - Delegates to the existing paralisacao core logic
"""
import argparse
import json
import logging
import os
import sys
from pathlib import Path

# --- Path setup -----------------------------------------------------------
PARALISACAO_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = PARALISACAO_DIR.parent
PARALISACAO_SRC = PARALISACAO_DIR / "src"

sys.path.insert(0, str(SCRIPTS_DIR))       # for from core.logger import emit_log
sys.path.insert(0, str(PARALISACAO_SRC))   # for from paralisacao.main import ...

os.environ["PARALISACAO_ROOT"] = str(PARALISACAO_DIR)

# Force headless mode for backend execution (overrides .env)
os.environ["HEADLESS"] = "true"
os.environ["PRIMEIRO_PLANO"] = "false"

# --- Parse backend arguments ----------------------------------------------
# NOTA: --openport-token é recebido do backend mas NÃO é usado aqui.
# Este RPA autentica via Playwright (navegador) com credenciais do .env.
# RPAs baseados em API devem usar openport_client.py com este token.
parser = argparse.ArgumentParser()
parser.add_argument("--bot-id", required=True)
parser.add_argument("--openport-token", required=True)
parser.add_argument("--triggered-by", default="")
args, _ = parser.parse_known_args()
execution_id = args.bot_id
openport_token = args.openport_token

# --- JSON logging handler for backend SSE streaming -----------------------
class JsonLogHandler(logging.Handler):
    def __init__(self, execution_id: str = "") -> None:
        super().__init__()
        self.execution_id = execution_id

    def emit(self, record: logging.LogRecord) -> None:
        entry = {
            "executionId": self.execution_id,
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "timestamp": self.format(record),
        }
        sys.stdout.write(json.dumps(entry, ensure_ascii=False) + "\n")
        sys.stdout.flush()

json_handler = JsonLogHandler(execution_id=execution_id)
json_handler.setFormatter(logging.Formatter("%(asctime)s"))
logging.basicConfig(level=logging.INFO, handlers=[json_handler])

# --- Import and run -------------------------------------------------------
from paralisacao.main import executar
from paralisacao.config import Config
from paralisacao.planilha import ler_planilha
from paralisacao.relatorio import Relatorio, obter_proxima_rodada
from paralisacao import status

config = Config.from_env(dotenv_path=str(PARALISACAO_DIR / ".env"))

planilha_path = str(PARALISACAO_DIR / config.planilha)

if not Path(planilha_path).exists():
    logging.error(f"Planilha nao encontrada: {planilha_path}")
    sys.exit(1)

dados = ler_planilha(planilha_path)

relatorios_dir = PARALISACAO_DIR / "relatorios"
status_file = PARALISACAO_DIR / "data" / "status.json"
num_rodada = obter_proxima_rodada(relatorios_dir)

# File handler for local log files (alongside JSON streaming)
logs_dir = PARALISACAO_DIR / "logs"
logs_dir.mkdir(exist_ok=True)
file_handler = logging.FileHandler(logs_dir / f"rodada_{num_rodada:03d}.log", encoding="utf-8")
file_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s", datefmt="%H:%M:%S")
)
logging.getLogger().addHandler(file_handler)

relatorio = Relatorio(relatorios_dir, num_rodada)

try:
    executar(dados, config, relatorio, status_file, planilha_path=planilha_path)
    logging.info("Rotina concluida com sucesso.")
except Exception as e:
    logging.exception(f"Erro fatal: {e}")
    sys.exit(1)
