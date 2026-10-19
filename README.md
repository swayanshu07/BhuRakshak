# BhuRakshak

Landslide risk monitoring for Northeast India. A FastAPI backend scores locations with a trained 8-feature model and serves risk points as GeoJSON. A React dashboard shows them on a map with color-coded risk levels.

## Project structure

```
BhuRakshak/
├── app/
│   ├── main.py                 # App entry point
│   ├── risk_store.py           # Loads model + risk grid at startup
│   ├── geospatial_engine.py    # Terrain / land cover / mining / river features
│   ├── api/                    # risk_routes.py, predict_routes.py
│   ├── auth/                   # Citizen / official auth
│   └── ml_models/              # bhurakshak_landslide_model_8feature.pkl
├── data/
│   ├── geodata/                # NOT in the repo (too large), see Data setup
│   └── BhuRakshak_NER_Risk_Map_Prototype_8Feature.csv   # NOT in the repo
├── frontend/                   # Vite + React + Tailwind dashboard
├── requirements.txt
└── README.md
```

## Backend setup

Run from the repo root (the folder containing `app/`).

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000`. Test it at `/risk/points`. Interactive docs are at `/docs`.

If PowerShell blocks activation, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Frontend setup

Run from the `frontend` folder, with the backend already running.

```powershell
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173`. If the map loads without markers, add `http://localhost:5173` to the CORS `allow_origins` list in `app/main.py`.

## Data setup

The geospatial data is too large for GitHub (several GB), so it is not in this repo. Without it, `geospatial_engine.py` cannot build features.

Place these under `data/geodata/`:

| File | Content |
|---|---|
| `NER_SRTM_DEM.tif` | SRTM elevation |
| `NER_SRTM_SLOPE.tif` | Slope derived from the DEM |
| `NER_mining_features.gpkg` | Mining features |
| `NER_river_features.gpkg` | River features |
| `worldcover/ESA_WorldCover_10m_2021_v200_*_Map.tif` | ESA WorldCover 2021 land cover tiles (N21/N24/N27 x E087/E090/E093/E096) |

Also place `BhuRakshak_NER_Risk_Map_Prototype_8Feature.csv` in `data/`.

Download link: TODO (add shared-drive link or contact the project team).

## Tech stack

- **Backend:** FastAPI, uvicorn, pandas, numpy, scikit-learn, joblib, python-jose, passlib
- **Frontend:** React, Vite, Tailwind CSS, shadcn, Leaflet / react-leaflet, axios

## Status

Done:
- Trained 8-feature model served through the API
- GeoJSON risk points endpoint and prediction routes
- Map dashboard with citizen and official views

Pending:
- Report upload route for citizens
- Official-only admin routes
- SMS/app alerts
- PostGIS database

## Troubleshooting

- **`uvicorn` not recognized:** use `python -m uvicorn ...` with the venv active.
- **`No module named X`:** run `python -m pip install -r requirements.txt` in the active venv.
- **scikit-learn version warning on startup:** the model was pickled under another version. Retrain it or install the matching version.
- **Wrong folder:** confirm your prompt path before every install, create, or delete command.
