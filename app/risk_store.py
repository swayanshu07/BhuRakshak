import warnings
from functools import lru_cache
from pathlib import Path

import joblib

from app.geospatial_engine import (
    initialize_geospatial_data,
    geospatial_health,
)

BASE = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE / "app" / "ml_models" / "bhurakshak_landslide_model_8feature.pkl"


LAND_COVER = {
    10: "Tree cover",
    20: "Shrubland",
    30: "Grassland",
    40: "Cropland",
    50: "Built-up",
    60: "Bare / sparse vegetation",
    80: "Permanent water",
    90: "Herbaceous wetland",
    100: "Moss / lichen",
}


def risk_level(p):
    if p < 0.25:
        return "LOW"
    if p < 0.50:
        return "MODERATE"
    if p < 0.75:
        return "HIGH"
    return "VERY HIGH"


class Store:
    pass


@lru_cache(maxsize=1)
def get_store():
    s = Store()

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        s.model = joblib.load(MODEL_PATH)

    s.features = list(s.model.feature_names_in_)

    print("BhuRakshak model loaded")
    print("Model:", MODEL_PATH)
    print("Features:", s.features)

    initialize_geospatial_data()

    print("Geospatial data:", geospatial_health())

    s.scenario = {
        "rainfall_1d": 19.24,
        "rainfall_3d": 61.33,
        "rainfall_7d": 138.32,
    }

    return s
