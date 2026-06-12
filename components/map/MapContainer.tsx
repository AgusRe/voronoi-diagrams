"use client";

import { useCallback } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from "@/store/useMapStore";
import VoronoiOverlay from "./VoronoiOverlay";
import PointMarker from "./PointMarker";
import SearchBar from "./SearchBar";

/**
 * Inner component: handles map click and moveend events.
 * Must live inside <LeafletMapContainer> to access the Leaflet context.
 */
function MapEventHandler() {
  const { addPoint, setMapCenter, setMapZoom } = useMapStore();

  useMapEvents({
    click(e: LeafletMouseEvent) {
      addPoint(e.latlng.lat, e.latlng.lng);
    },
    moveend(e) {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapZoom(zoom);
    },
  });

  return null;
}

export default function MapContainer() {
  const { mapCenter, mapZoom, points } = useMapStore();

  return (
    <div className="relative w-full h-full">
      <LeafletMapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark map tiles — CartoDB Dark Matter, no API key needed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />

        {/* Map event handler (click → add point, moveend → sync store) */}
        <MapEventHandler />

        {/* Voronoi canvas rendered into Leaflet's overlayPane */}
        <VoronoiOverlay />

        {/* Point markers */}
        {points.map((point) => (
          <PointMarker key={point.id} point={point} />
        ))}

        {/*
          SearchBar uses useMap() so it MUST be rendered inside
          <LeafletMapContainer>. We use absolute positioning via CSS
          to float it over the top-center of the map.
        */}
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "100%",
            maxWidth: "28rem",
            padding: "0 1rem",
          }}
        >
          <SearchBar />
        </div>
      </LeafletMapContainer>

      {/* Hints — outside the Leaflet provider, so no useMap() here */}
      {points.length === 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/10 pointer-events-none">
          💡 Hacé click en el mapa para agregar puntos
        </div>
      )}
      {points.length === 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full border border-white/10 pointer-events-none">
          ➕ Agregá al menos 2 puntos para ver el diagrama
        </div>
      )}
    </div>
  );
}
