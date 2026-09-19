import pandas as pd
import numpy as np
from typing import Optional
from fastapi import APIRouter
from app.risk_store import get_store

router = APIRouter(prefix="/risk", tags=["risk"])

DATA_PATH = "data/dummy_landslide_points.csv"


@router.get("/points")
def get_landslide_points():
    df = pd.read_csv(DATA_PATH)
    features = []
    for _, row in df.iterrows():
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [row["longitude"], row["latitude"]]},
            "properties": {
                "event_id": row["event_id"], "event_date": row["event_date"],
                "category": row["landslide_category"], "trigger": row["landslide_trigger"],
                "size": row["landslide_size"], "admin_division": row["admin_division_name"],
                "state": row["state_clean"], "risk_level": row["risk_level"],
            },
        })
    return {"type": "FeatureCollection", "features": features}


@router.get("/summary")
def risk_summary():
    s = get_store()
    total = int(sum(s.counts.values()))
    order = ["LOW", "MODERATE", "HIGH", "VERY HIGH"]
    return {
        "mode": "scenario",
        "note": "Prototype scenario map: one fixed rainfall scenario (75th percentile) applied to all cells. Not live.",
        "scenario_rainfall_mm": s.scenario,
        "total_cells": total,
        "classes": [{"level": k, "cells": int(s.counts.get(k, 0)),
                     "percent": round(100 * s.counts.get(k, 0) / total, 2)} for k in order],
    }


@router.get("/heatmap")
def get_heatmap(min_lat: Optional[float] = None, max_lat: Optional[float] = None,
                min_lon: Optional[float] = None, max_lon: Optional[float] = None,
                limit: int = 50000):
    s = get_store()
    limit = max(1000, min(limit, 100000))
    mask = np.ones(len(s.lat), dtype=bool)
    if min_lat is not None: mask &= s.lat >= min_lat
    if max_lat is not None: mask &= s.lat <= max_lat
    if min_lon is not None: mask &= s.lon >= min_lon
    if max_lon is not None: mask &= s.lon <= max_lon
    idx = np.flatnonzero(mask)
    if len(idx) > limit:
        idx = idx[np.linspace(0, len(idx) - 1, limit).astype(int)]
    out = np.column_stack([s.lat[idx], s.lon[idx], s.prob[idx]]).round(4)
    return out.tolist()  # [[lat, lon, probability], ...] same format as before