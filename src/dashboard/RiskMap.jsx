import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const NER_BOUNDS = [[21.5, 88.0], [29.5, 97.5]];

const NER_STATES = [
  "assam", "arunachal-pradesh", "manipur", "meghalaya",
  "mizoram", "nagaland", "tripura", "sikkim",
];
const GEOJSON_URL = (s) =>
  `https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/states/${s}.geojson`;

const RISK_COLOR = {
  LOW: "#2ecc71",
  MODERATE: "#f1c40f",
  HIGH: "#e67e22",
  "VERY HIGH": "#e74c3c",
};

function riskLevelFromProb(p) {
  if (p < 0.25) return "LOW";
  if (p < 0.5) return "MODERATE";
  if (p < 0.75) return "HIGH";
  return "VERY HIGH";
}

function FixSize() {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(NER_BOUNDS, { animate: false });
    };
    const t1 = setTimeout(fit, 0);
    const t2 = setTimeout(fit, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);
  return null;
}

function RiskCellsLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!points || points.length === 0) return;

    const renderer = L.canvas({ padding: 0.5 });
    const group = L.layerGroup();

    points.forEach(([lat, lon, prob]) => {
      const level = riskLevelFromProb(prob);
      L.circleMarker([lat, lon], {
        renderer,
        radius: 3,
        color: RISK_COLOR[level],
        fillColor: RISK_COLOR[level],
        fillOpacity: 0.6,
        stroke: false,
      }).addTo(group);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [points, map]);

  return null;
}

function HeatmapFetcher({ onData }) {
  const fetchForBounds = useCallback((map) => {
    const b = map.getBounds();
    axios
      .get(`${API}/risk/heatmap`, {
        params: {
          min_lat: b.getSouth(),
          max_lat: b.getNorth(),
          min_lon: b.getWest(),
          max_lon: b.getEast(),
          limit: 20000,
        },
      })
      .then((res) => onData(res.data))
      .catch((err) => console.error("heatmap fetch failed", err));
  }, [onData]);

  const map = useMapEvents({
    moveend: () => fetchForBounds(map),
  });

  useEffect(() => {
    fetchForBounds(map);
  }, [map, fetchForBounds]);

  return null;
}

function ClickHandler({ onResult }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      axios
        .post(`${API}/predict/latlon`, { lat, lon: lng })
        .then((res) => onResult({ lat, lon: lng, ...res.data }))
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            onResult({ lat, lon: lng, error: "Outside prototype grid coverage." });
          } else {
            onResult({ lat, lon: lng, error: "Prediction failed." });
          }
        });
    },
  });
  return null;
}

function Legend() {
  return (
    <div
      style={{
        position: "absolute", bottom: 20, left: 10, zIndex: 1000,
        background: "white", padding: "10px 14px", borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)", fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Risk level</div>
      {Object.entries(RISK_COLOR).map(([label, color]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
          <span style={{
            width: 12, height: 12, background: color, display: "inline-block",
            marginRight: 6, borderRadius: 3,
          }} />
          {label}
        </div>
      ))}
    </div>
  );
}

function ScenarioNotice() {
  return (
    <div
      style={{
        position: "absolute", top: 10, left: 60, zIndex: 1000,
        background: "rgba(255,255,255,0.95)", padding: "8px 12px", borderRadius: 6,
        fontSize: 12, maxWidth: 320, boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}
    >
      Prototype scenario map — 75th-percentile rainfall applied uniformly. Not a live warning system.
    </div>
  );
}

function ClickCard({ result, onClose }) {
  if (!result) return null;
  return (
    <div
      style={{
        position: "absolute", top: 10, right: 10, zIndex: 1000,
        background: "white", padding: "14px 16px", borderRadius: 8,
        boxShadow: "0 1px 6px rgba(0,0,0,0.35)", fontSize: 13, width: 260,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Selected location</strong>
        <span style={{ cursor: "pointer" }} onClick={onClose}>X</span>
      </div>
      <div>Lat: {result.lat.toFixed(4)}, Lon: {result.lon.toFixed(4)}</div>
      {result.error ? (
        <div style={{ color: "#c0392b", marginTop: 8 }}>{result.error}</div>
      ) : (
        <>
          <div style={{ marginTop: 8 }}>
            <span style={{
              background: RISK_COLOR[result.risk_level], color: "white",
              padding: "2px 8px", borderRadius: 4, fontWeight: 600,
            }}>
              {result.risk_level}
            </span>{" "}
            {(result.probability * 100).toFixed(1)}%
          </div>
          <div style={{ marginTop: 8, lineHeight: 1.5 }}>
            Rainfall 1d/3d/7d: {result.factors.rainfall_1d_mm} / {result.factors.rainfall_3d_mm} / {result.factors.rainfall_7d_mm} mm<br />
            Elevation: {result.factors.elevation_m} m<br />
            Slope: {result.factors.slope_deg} deg<br />
            Land cover: {result.factors.land_cover}<br />
            River distance: {result.factors.river_distance_km} km<br />
            Mine distance: {result.factors.mine_distance_km} km
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#777" }}>
            Matched grid cell {result.matched_cell.distance_km} km away.
          </div>
        </>
      )}
    </div>
  );
}

function StateOutlines() {
  const [geojsons, setGeojsons] = useState([]);
  useEffect(() => {
    Promise.all(NER_STATES.map((s) => axios.get(GEOJSON_URL(s)).then((r) => r.data)))
      .then(setGeojsons)
      .catch((err) => console.error("state outline load failed", err));
  }, []);
  return geojsons.map((gj, i) => (
    <GeoJSON key={i} data={gj} style={{ color: "#333", weight: 1, fillOpacity: 0 }} />
  ));
}

function RiskMap({ height = "100%" }) {
  const [heatPoints, setHeatPoints] = useState([]);
  const [clickResult, setClickResult] = useState(null);

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <MapContainer bounds={NER_BOUNDS} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FixSize />
        <StateOutlines />
        <HeatmapFetcher onData={setHeatPoints} />
        <RiskCellsLayer points={heatPoints} />
        <ClickHandler onResult={setClickResult} />
      </MapContainer>
      <ScenarioNotice />
      <Legend />
      <ClickCard result={clickResult} onClose={() => setClickResult(null)} />
    </div>
  );
}

export default RiskMap;