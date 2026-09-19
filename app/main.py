from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.citizen_auth import router as citizen_router
from app.auth.official_auth import router as official_router
from app.api.risk_routes import router as risk_router
from app.api.predict_routes import router as predict_router
from app.api.reports_routes import router as reports_router
from app.api.alerts_routes import router as alerts_router
from app.risk_store import get_store
from app.db.database import engine, Base
from app.db import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_store()  # load model + risk grid once, so the first request isn't slow
    yield


app = FastAPI(title="BhuRakshak API", lifespan=lifespan)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(citizen_router)
app.include_router(official_router)
app.include_router(risk_router)
app.include_router(predict_router)
app.include_router(reports_router)
app.include_router(alerts_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "BhuRakshak"}