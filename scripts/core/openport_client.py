import os
from .logger import emit_log

BASE_URL = os.getenv("OPENPORT_API_URL", "")


def authenticate(username: str, password: str) -> str:
    import httpx

    if not BASE_URL:
        emit_log("warn", "OPENPORT_API_URL não configurada — usando mock.")
        return "mock-token"

    url = f"{BASE_URL.rstrip('/')}/auth"
    emit_log("info", f"Autenticando no OpenPort como {username}...")

    try:
        resp = httpx.post(
            url,
            json={"username": username, "password": password},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        emit_log("success", "Sessão OpenPort validada.")
        return data["token"]
    except httpx.HTTPStatusError as e:
        emit_log("error", f"Falha na autenticação OpenPort: HTTP {e.response.status_code}")
        raise
    except httpx.TimeoutException:
        emit_log("error", "Timeout ao conectar no OpenPort.")
        raise
    except Exception as e:
        emit_log("error", f"Erro inesperado na autenticação: {e}")
        raise


def fetch_data(endpoint: str, token: str) -> dict:
    import httpx

    if not BASE_URL:
        emit_log("warn", "OPENPORT_API_URL não configurada — retornando dados vazios.")
        return {}

    url = f"{BASE_URL.rstrip('/')}{endpoint}"
    emit_log("info", f"Buscando {endpoint}...")

    try:
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=60,
        )
        resp.raise_for_status()
        emit_log("success", f"Dados de {endpoint} recebidos.")
        return resp.json()
    except httpx.HTTPStatusError as e:
        emit_log("error", f"Erro HTTP {e.response.status_code} em {endpoint}")
        raise
    except httpx.TimeoutException:
        emit_log("error", f"Timeout ao buscar {endpoint}")
        raise
    except Exception as e:
        emit_log("error", f"Erro ao buscar {endpoint}: {e}")
        raise
