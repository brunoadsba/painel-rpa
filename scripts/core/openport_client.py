import httpx
from .logger import emit_log

BASE_URL = "https://api.openport.example.com"  # TODO: configurar URL real


async def authenticate(username: str, password: str) -> str:
    emit_log("info", f"Autenticando no OpenPort como {username}...")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BASE_URL}/auth",
            json={"username": username, "password": password},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

    emit_log("success", "Sessão OpenPort validada com sucesso.")
    return data["token"]


async def fetch_data(endpoint: str, token: str) -> dict:
    emit_log("info", f"Buscando dados de {endpoint}...")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BASE_URL}{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=60,
        )
        resp.raise_for_status()

    emit_log("success", f"Dados de {endpoint} recebidos.")
    return resp.json()
