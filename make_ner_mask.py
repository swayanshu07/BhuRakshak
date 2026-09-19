import json, urllib.request
import numpy as np, pandas as pd, shapely
from shapely.geometry import shape

STATES = ["assam", "arunachal-pradesh", "manipur", "meghalaya",
          "mizoram", "nagaland", "tripura", "sikkim"]
URL = "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/states/{}.geojson"
CSV = "data/BhuRakshak_NER_Risk_Map_Prototype_8Feature.csv"

geoms = []
for s in STATES:
    with urllib.request.urlopen(URL.format(s)) as r:
        gj = json.load(r)
    feats = gj["features"] if gj.get("type") == "FeatureCollection" else [gj]
    for f in feats:
        geoms.append(shape(f["geometry"] if "geometry" in f else f).buffer(0))
    print("loaded", s)

ner = shapely.union_all(geoms).buffer(0.02)  # small margin so border cells aren't clipped

df = pd.read_csv(CSV, usecols=["longitude", "latitude"])
mask = shapely.contains_xy(ner, df["longitude"].to_numpy(), df["latitude"].to_numpy())
np.save("data/ner_inside.npy", mask)
print("cells total:", len(mask), "| inside NER:", int(mask.sum()))