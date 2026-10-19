import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const riskColor = {
  high: "red",
  medium: "orange",
  low: "green"
};

const nerStates = ["assam","arunachal-pradesh","manipur","meghalaya","mizoram","nagaland","tripura","sikkim"];

const NER_BOUNDS = [[21.5, 88.0], [29.5, 97.5]];

function FixSize() {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize();
      map.fitBounds(NER_BOUNDS, { animate: false });
      console.log("MAP", { zoom: map.getZoom(), center: map.getCenter(), size: map.getSize() });
    };
    const t1 = setTimeout(fit, 0);
    const t2 = setTimeout(fit, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [map]);
  return null;
}

function HeatLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const heat = L.heatLayer(points, { radius: 15, blur: 20, maxZoom: 10 }).addTo(map);
    return () => map.removeLayer(heat);
  }, [points, map]);
  return null;
}

function ClickHandler({ onResult, cfg }) {
  useMapEvents({
    click(e) {
      axios.post("http://127.0.0.1:8000/predict/latlon", {
        lat: e.latlng.lat,
        lon: e.latlng.lng,
      }, cfg).then((res) => onResult({ ...res.data, lat: e.latlng.lat, lon: e.latlng.lng }))
        .catch((err) => console.error(err));
    },
  });
  return null;
}

function RiskMap({ token, height = "100%" }) {
  const [points, setPoints] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [heatPoints, setHeatPoints] = useState([]);
  const [clickResult, setClickResult] = useState(null);

  const cfg = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/risk/points", cfg)
      .then((res) => setPoints(res.data.features))
      .catch((err) => console.error(err));

    axios.get("http://127.0.0.1:8000/risk/heatmap", cfg)
      .then((res) => { console.log("HEATPOINTS:", res.data.length); setHeatPoints(res.data); })
      .catch((err) => console.error("HEATMAP FETCH FAIL", err));

    Promise.all(
      nerStates.map((s) =>
        fetch(`https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/states/${s}.geojson`)
          .then((r) => r.json())
      )
    ).then(setBoundaries).catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <MapContainer
        bounds={NER_BOUNDS}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FixSize />

        {boundaries.map((geo, i) => (
          <GeoJSON key={i} data={geo} style={{ color: "#444", weight: 1, fillOpacity: 0 }} />
        ))}

        <HeatLayer points={heatPoints} />
        <ClickHandler onResult={setClickResult} cfg={cfg} />

        {points.map((f) => (
          <CircleMarker
            key={f.properties.event_id}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={8}
            color={riskColor[f.properties.risk_level] || "gray"}
          >
            <Popup>
              <b>{f.properties.category}</b><br />
              State: {f.properties.state}<br />
              District: {f.properties.admin_division}<br />
              Risk: {f.properties.risk_level}<br />
              Date: {f.properties.event_date}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {clickResult && (
        <div style={{ position: "absolute", top: 10, right: 10, background: "white", padding: "10px", borderRadius: "6px", zIndex: 1000 }}>
          <b>Clicked point</b><br />
          Lat: {clickResult.lat.toFixed(4)}, Lon: {clickResult.lon.toFixed(4)}<br />
          Probability: {clickResult.probability}<br />
          Risk: {clickResult.risk_level}
        </div>
      )}
    </div>
  );
}

export default RiskMap;
