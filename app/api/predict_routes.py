import pandas as pd
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.risk_store import get_store, risk_level, LAND_COVER, MAX_MATCH_DEG

router = APIRouter(prefix="/predict", tags=["predict"])


class LatLonRequest(BaseModel):
    lat: float
    lon: float
    # optional what-if rainfall (mm); defaults to the scenario values
    rainfall_1d: Optional[float] = None
    rainfall_3d: Optional[float] = None
    rainfall_7d: Optional[float] = None


@router.post("/latlon")
def predict_latlon(data: LatLonRequest):
    s = get_store()
    dist, i = s.tree.query([data.lon, data.lat])
    if dist > MAX_MATCH_DEG:
        raise HTTPException(status_code=404, detail="Location is outside the prototype grid coverage")

    row = s.df.iloc[int(i)]
    vals = {f: float(row[f]) for f in s.features}
    overridden = False
    for k in ("rainfall_1d", "rainfall_3d", "rainfall_7d"):
        v = getattr(data, k)
        if v is not None:
            vals[k] = v
            overridden = True

    prob = float(s.model.predict_proba(pd.DataFrame([vals], columns=s.features))[0][1])
    return {
        "probability": round(prob, 4),
        "risk_level": risk_level(prob),
        "mode": "what-if rainfall" if overridden else "scenario",
        "matched_cell": {"lat": round(float(row["latitude"]), 5),
                         "lon": round(float(row["longitude"]), 5),
                         "distance_km": round(float(dist) * 111, 2)},
        "factors": {
            "rainfall_1d_mm": round(vals["rainfall_1d"], 1),
            "rainfall_3d_mm": round(vals["rainfall_3d"], 1),
            "rainfall_7d_mm": round(vals["rainfall_7d"], 1),
            "elevation_m": round(vals["elevation"]),
            "slope_deg": round(vals["slope"], 1),
            "land_cover": LAND_COVER.get(int(vals["land_cover"]), "Unknown"),
            "river_distance_km": round(vals["distance_to_river_m"] / 1000, 1),
            "mine_distance_km": round(vals["distance_to_mine_m"] / 1000, 1),
        },
    }