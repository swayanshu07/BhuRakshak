import pandas as pd

from typing import Optional

from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from app.risk_store import (
    get_store,
    risk_level,
    LAND_COVER,
)

from app.geospatial_engine import (
    extract_location_features,
)


router = APIRouter(
    prefix="/predict",
    tags=["predict"]
)


class LatLonRequest(BaseModel):

    lat: float
    lon: float

    # Optional what-if rainfall.
    # If omitted, the prototype scenario values are used.
    rainfall_1d: Optional[float] = None
    rainfall_3d: Optional[float] = None
    rainfall_7d: Optional[float] = None


@router.post("/latlon")
def predict_latlon(
    data: LatLonRequest
):

    # ========================================================
    # LOAD MODEL STORE
    # ========================================================

    s = get_store()


    # ========================================================
    # EXTRACT REAL LOCATION FEATURES
    # ========================================================

    try:

        geo = extract_location_features(
            lat=data.lat,
            lon=data.lon,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to extract geospatial "
                f"features: {exc}"
            ),
        )


    # ========================================================
    # RAINFALL
    # ========================================================

    rainfall_1d = (
        data.rainfall_1d
        if data.rainfall_1d is not None
        else s.scenario["rainfall_1d"]
    )

    rainfall_3d = (
        data.rainfall_3d
        if data.rainfall_3d is not None
        else s.scenario["rainfall_3d"]
    )

    rainfall_7d = (
        data.rainfall_7d
        if data.rainfall_7d is not None
        else s.scenario["rainfall_7d"]
    )


    overridden = any([
        data.rainfall_1d is not None,
        data.rainfall_3d is not None,
        data.rainfall_7d is not None,
    ])


    # ========================================================
    # BUILD EXACT 8 MODEL FEATURES
    # ========================================================

    vals = {

        "rainfall_1d":
            float(rainfall_1d),

        "rainfall_3d":
            float(rainfall_3d),

        "rainfall_7d":
            float(rainfall_7d),

        "elevation":
            float(geo["elevation"]),

        "slope":
            float(geo["slope"]),

        "land_cover":
            float(geo["land_cover"]),

        "distance_to_mine_m":
            float(geo["distance_to_mine_m"]),

        "distance_to_river_m":
            float(geo["distance_to_river_m"]),
    }


    # ========================================================
    # VERIFY FEATURE ORDER
    # ========================================================

    missing = [
        feature
        for feature in s.features
        if feature not in vals
    ]

    if missing:

        raise HTTPException(
            status_code=500,
            detail=(
                "Model features missing: "
                + ", ".join(missing)
            ),
        )


    model_input = pd.DataFrame(
        [
            {
                feature: vals[feature]
                for feature in s.features
            }
        ]
    )


    # ========================================================
    # MODEL PREDICTION
    # ========================================================

    try:

        prob = float(
            s.model.predict_proba(
                model_input
            )[0][1]
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Model prediction failed: "
                f"{exc}"
            ),
        )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "latitude":
            round(float(data.lat), 6),

        "longitude":
            round(float(data.lon), 6),

        "probability":
            round(prob, 4),

        "risk_level":
            risk_level(prob),

        "mode":
            (
                "what-if rainfall"
                if overridden
                else "scenario"
            ),

        "factors": {

            "rainfall_1d_mm":
                round(
                    float(rainfall_1d),
                    2
                ),

            "rainfall_3d_mm":
                round(
                    float(rainfall_3d),
                    2
                ),

            "rainfall_7d_mm":
                round(
                    float(rainfall_7d),
                    2
                ),

            "elevation_m":
                round(
                    float(geo["elevation"]),
                    2
                ),

            "slope_deg":
                round(
                    float(geo["slope"]),
                    2
                ),

            "land_cover":
                LAND_COVER.get(
                    int(geo["land_cover"]),
                    "Unknown"
                ),

            "land_cover_code":
                int(
                    geo["land_cover"]
                ),

            "river_distance_km":
                round(
                    float(
                        geo[
                            "distance_to_river_m"
                        ]
                    ) / 1000,
                    2
                ),

            "mine_distance_km":
                round(
                    float(
                        geo[
                            "distance_to_mine_m"
                        ]
                    ) / 1000,
                    2
                ),
        },
    }
