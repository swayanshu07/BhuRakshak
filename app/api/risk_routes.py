from pathlib import Path
import pandas as pd
from typing import Optional
from fastapi import APIRouter
from app.risk_store import get_store

router = APIRouter(prefix="/risk", tags=["risk"])

BASE = Path(__file__).resolve().parents[2]
DATA_PATH = BASE / "data" / "dummy_landslide_points.csv"


@router.get("/points")
def get_landslide_points():
    if not DATA_PATH.exists():
        return {
            "type": "FeatureCollection",
            "features": []
        }

    df = pd.read_csv(DATA_PATH)
    features = []

    for _, row in df.iterrows():
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    row["longitude"],
                    row["latitude"]
                ]
            },
            "properties": {
                "event_id": row["event_id"],
                "event_date": row["event_date"],
                "category": row["landslide_category"],
                "trigger": row["landslide_trigger"],
                "size": row["landslide_size"],
                "admin_division": row["admin_division_name"],
                "state": row["state_clean"],
                "risk_level": row["risk_level"],
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/summary")
def risk_summary():
    s = get_store()

    return {
        "mode": "scenario",
        "note": "Risk predictions use the trained BhuRakshak 8-feature model with a fixed rainfall scenario.",
        "scenario_rainfall_mm": s.scenario,
        "model_features": s.features,
    }


@router.get("/heatmap")
def get_heatmap(
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
    limit: int = 50000
):
    path = BASE / "data" / "BhuRakshak_NER_Risk_Map.csv"
    df = pd.read_csv(path)

    lat_col = "latitude" if "latitude" in df.columns else "lat"
    lon_col = "longitude" if "longitude" in df.columns else "lon"

    prob_col = next(
        (c for c in ["risk_probability", "probability", "risk_score", "prob"]
         if c in df.columns),
        None
    )

    if prob_col is None:
        raise ValueError(
            f"No probability column found: {list(df.columns)}"
        )

    if min_lat is not None:
        df = df[df[lat_col] >= min_lat]
    if max_lat is not None:
        df = df[df[lat_col] <= max_lat]
    if min_lon is not None:
        df = df[df[lon_col] >= min_lon]
    if max_lon is not None:
        df = df[df[lon_col] <= max_lon]

    limit = max(1000, min(limit, 100000))

    if len(df) > limit:
        import numpy as np
        idx = np.linspace(0, len(df) - 1, limit).astype(int)
        df = df.iloc[idx]

    return df[[lat_col, lon_col, prob_col]].round(4).values.tolist()
