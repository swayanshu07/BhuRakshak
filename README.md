# BhuRakshak

Landslide risk monitoring for Northeast India. A FastAPI backend serves risk points as GeoJSON, and a React map dashboard displays them with color-coded risk levels.

## Project structure

```
Desktop/
├── BhuRakshak/                 # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py             # App entry point
│   │   ├── risk_store.py       # Loads model + risk grid at startup
│   │   ├── api/risk_routes.py  # /risk/points endpoint
│   │   ├── auth/               # Citizen/official auth
│   │   ├── data_sources/       # Planned
│   │   ├── features/           # Planned
│   │   ├── grid/               # Planned
│   │   ├── models/             # Planned
│   │   ├── alerts/             # Planned
│   │   └── db/                 # Planned
│   ├── data/
│   ├── requirements.txt
│   └── .venv/
└── bhurakshak-frontend/
    └── bhurakshak-ui/          # Frontend (Vite + React + Tailwind)
```

## Backend setup

Run all commands from inside the `BhuRakshak` folder. Check that your terminal prompt ends in `BhuRakshak` before running anything.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Check it with `http://127.0.0.1:8000/risk/points`, which returns a GeoJSON FeatureCollection. Interactive docs are at `http://127.0.0.1:8000/docs`.

If PowerShell blocks activation, run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Frontend setup

Run from `bhurakshak-frontend\bhurakshak-ui`. Check that your prompt ends in `bhurakshak-ui`.

```powershell
npm install
npm run dev
```

The app opens at `http://localhost:5173`. The backend must be running first.

If the map loads but shows no markers, add `http://localhost:5173` to the CORS `allow_origins` list in `app/main.py`.

## Tech stack

- **Backend:** FastAPI, uvicorn, pandas, scikit-learn, joblib, python-jose, passlib
- **Frontend:** React, Vite, Tailwind CSS, shadcn, Leaflet / react-leaflet, axios

## Status

Done:
- Backend serves risk points as GeoJSON
- Frontend map with color-coded markers and popups
- Auth modules for citizens and officials

Pending:
- Report upload route for citizens
- Official-only admin routes
- Replace dummy data with a real feature dataset
- Retrain and validate the risk model on real data
- SMS/app alerts
- PostGIS database

## Troubleshooting

- **`uvicorn` not recognized:** use `python -m uvicorn ...` with the venv active.
- **`No module named X`:** run `python -m pip install -r requirements.txt` in the active venv.
- **scikit-learn version warning on startup:** the model was pickled under another version. Retrain it in this venv.
- **Wrong folder:** confirm your prompt path before every install, create, or delete command.
