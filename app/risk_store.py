import warnings
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

BASE = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE / "app" / "ml_models" / "bhurakshak_landslide_model_8feature.pkl"
CSV_PATH = BASE / "data" / "BhuRakshak_NER_Risk_Map_Prototype_8Feature.csv"
MASK_PATH = BASE / "data" / "ner_inside.npy"

COLS = ["longitude", "latitude", "elevation", "slope", "land_cover",
        "distance_to_mine_m", "distance_to_river_m",
        "rainfall_1d", "rainfall_3d", "rainfall_7d",
        "risk_probability", "risk_class"]

LAND_COVER = {10: "Tree cover", 20: "Shrubland", 30: "Grassland", 40: "Cropland",
              50: "Built-up", 60: "Bare / sparse vegetation", 80: "Permanent water",
              90: "Herbaceous wetland", 100: "Moss / lichen"}

MAX_MATCH_DEG = 0.02  # ~2 km; beyond this we say "outside coverage"


def risk_level(p: float) -> str:
    if p < 0.25: return "LOW"
    if p < 0.50: return "MODERATE"
    if p < 0.75: return "HIGH"
    return "VERY HIGH"


class Store:
    pass


@lru_cache(maxsize=1)
def get_store() -> Store:
    s = Store()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        s.model = joblib.load(MODEL_PATH)
    s.features = list(s.model.feature_names_in_)

    num = [c for c in COLS if c != "risk_class"]
    s.df = pd.read_csv(CSV_PATH, usecols=COLS,
                       dtype={**{c: "float32" for c in num}, "risk_class": "category"})

    # Keep only cells inside the 8 NER states (removes the bounding-box rectangle)
    if MASK_PATH.exists():
        m = np.load(MASK_PATH)
        if len(m) == len(s.df):
            s.df = s.df[m].reset_index(drop=True)
            s.df["risk_class"] = s.df["risk_class"].cat.remove_unused_categories()

    s.lon = s.df["longitude"].to_numpy()
    s.lat = s.df["latitude"].to_numpy()
    s.prob = s.df["risk_probability"].to_numpy()
    s.tree = cKDTree(np.column_stack([s.lon, s.lat]).astype("float64"))

    s.scenario = {k: round(float(s.df[k].iloc[0]), 2)
                  for k in ("rainfall_1d", "rainfall_3d", "rainfall_7d")}
    s.counts = s.df["risk_class"].value_counts().to_dict()
    return s