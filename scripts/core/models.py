from pydantic import BaseModel


class LogEntry(BaseModel):
    execution_id: str
    level: str  # info | success | warn | error
    message: str
    timestamp: str | None = None


class BotConfig(BaseModel):
    bot_id: str
    name: str
    openport_token: str


class ExecutionResult(BaseModel):
    success: bool
    execution_id: str
    message: str
