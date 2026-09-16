"use client";

import { useEffect } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapStore } from "@/store/useMapStore";
import VoronoiOverlay from "./VoronoiOverlay";
import PointMarker from "./PointMarker";
import SearchBar from "./SearchBar";

/**
 * Inner component handling map click, viewport sync and external fly-to events.
 * Must live inside <LeafletMapContainer> to access the Leaflet context via useMap.
 */
function MapEventHandler() {
  const map = useMap();
  const addPoint = useMapStore((state) => state.addPoint);
  const setMapCenter = useMapStore((state) => state.setMapCenter);
  const setMapZoom = useMapStore((state) => state.setMapZoom);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      // Add point at clicked geographic coordinates
      addPoint(e.latlng.lat, e.latlng.lng);
    },
    moveend(e) {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapZoom(zoom);
    },
  });

  // Listen for programmatic fly-to requests from PointList or SearchBar
  useEffect(() => {
    const handleFlyTo = (event: Event) => {
      const customEvent = event as CustomEvent<{ lat: number; lng: number; zoom?: number }>;
      if (customEvent.detail) {
        const targetZoom = customEvent.detail.zoom ?? Math.max(map.getZoom(), 14);
        map.flyTo([customEvent.detail.lat, customEvent.detail.lng], targetZoom, {
          duration: 1.2,
        });
      }
    };

    window.addEventListener("voronoi:fly-to", handleFlyTo);
    return () => {
      window.removeEventListener("voronoi:fly-to", handleFlyTo);
    };
  }, [map]);

  return null;
}

export default function MapContainer() {
  const mapCenter = useMapStore((state) => state.mapCenter);
  const mapZoom = useMapStore((state) => state.mapZoom);
  const points = useMapStore((state) => state.points);

  return (
    <div className="relative w-full h-full select-none" id="map-viewport-wrapper">
      <LeafletMapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark map tiles — CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'
          maxZoom={20}
        />

        {/* Map event and fly-to coordinate handler */}
        <MapEventHandler />

        {/* HiDPI synchronized Voronoi canvas overlay */}
        <VoronoiOverlay />

        {/* Interactive Point markers */}
        {points.map((point) => (
          <PointMarker key={point.id} point={point} />
        ))}

        {/* Floating Search Bar */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 pointer-events-none"
        >
          <div className="pointer-events-auto">
            <SearchBar />
          </div>
        </div>
      </LeafletMapContainer>

      {/* Onscreen contextual guide hints */}
      {points.length === 0 && (
        <div
          role="status"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d1117]/90 backdrop-blur-md text-gray-200 text-xs px-4 py-2 rounded-full border border-white/10 shadow-2xl pointer-events-none flex items-center gap-2"
        >
          <span>📍</span> Hacé click en cualquier lugar del mapa para agregar puntos
        </div>
      )}
      {points.length === 1 && (
        <div
          role="status"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d1117]/90 backdrop-blur-md text-gray-200 text-xs px-4 py-2 rounded-full border border-white/10 shadow-2xl pointer-events-none flex items-center gap-2"
        >
          <span>➕</span> Agregá más puntos para delimitar las celdas de Voronoi
        </div>
      )}
    </div>
  );
}
