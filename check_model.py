import warnings, joblib, pandas as pd, numpy as np
warnings.filterwarnings("ignore")

m = joblib.load("app/ml_models/bhurakshak_landslide_model_8feature.pkl")
feats = list(m.feature_names_in_)

df = pd.read_csv("data/BhuRakshak_NER_Risk_Map_Prototype_8Feature.csv", nrows=20000)
s = df.sample(2000, random_state=1)

p = m.predict_proba(s[feats])[:, 1]
diff = np.abs(p - s["risk_probability"].values)
print("rows:", len(s))
print("max diff:", diff.max())
print("mean diff:", diff.mean())
print("class match %:", (pd.cut(p, [-1, .25, .5, .75, 2], labels=["LOW","MODERATE","HIGH","VERY HIGH"]).astype(str) == s["risk_class"].values).mean() * 100)