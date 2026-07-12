"""TransitOps — Smart Transport Operations Platform (FastAPI backend).

Serves the JSON API under /api and the single-page frontend at /.
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import APP_NAME
from .database import Base, engine
from .seed import seed
from .routers import (auth, vehicles, drivers, trips, maintenance, fuel,
                      expenses, dashboard, reports, documents, reminders,
                      incidents, ratings)

app = FastAPI(title=APP_NAME, version="1.0.0",
              description="Smart Transport Operations Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed()


# --- API routers ---
for r in (auth, vehicles, drivers, trips, maintenance, fuel, expenses,
          dashboard, reports, documents, reminders, incidents, ratings):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": APP_NAME}


# --- Frontend (served last so /api takes precedence) ---
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"


@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
