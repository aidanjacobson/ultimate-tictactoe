from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from database.schema import SessionLocal
import uvicorn
import os

class Server:
    def __init__(self):
        self.app = FastAPI()
        self.db = SessionLocal()

        self._setup_routes()
        self._ensure_www()
        self._setup_static()

    def _ensure_www(self):
        os.makedirs("www", exist_ok=True)

    def _setup_static(self):
        self.app.mount("/", StaticFiles(directory="www", html=True), name="static")

    def _setup_routes(self):
        """Setup all API routes"""
        @self.app.get("/api/health")
        async def health_check():
            return JSONResponse(content={"status": "ok"})

    def run(self):
        port = int(os.environ.get("PORT", 8080))

        uvicorn.run(
            self.app,
            host="0.0.0.0",
            port=port,
            log_level="info",
        )