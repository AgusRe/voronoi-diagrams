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
    <div className="relative w-full h-full select-none overflow-hidden" id="map-viewport-wrapper">
      {/*
        SearchBar placed in the outer relative container above Leaflet.
        This guarantees perfect responsive positioning without Leaflet layout interference.
      */}
      <div className="absolute top-4 left-0 right-0 z-[1000] px-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-md pointer-events-auto">
          <SearchBar />
        </div>
      </div>

      <LeafletMapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        style={{ width: "100%", height: "100%" }}
        zoomControl={true}
        attributionControl={true}
      >
        {/*
          OpenStreetMap tiles with dark-mode-tiles CSS filter.
          100% Free & Open-Source — NO API KEY REQUIRED, NO WATERMARKS.
        */}
        <TileLayer
          className="dark-mode-tiles"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Map event and fly-to coordinate handler */}
        <MapEventHandler />

        {/* HiDPI synchronized Voronoi canvas overlay */}
        <VoronoiOverlay />

        {/* Interactive Point markers */}
        {points.map((point) => (
          <PointMarker key={point.id} point={point} />
        ))}
      </LeafletMapContainer>

      {/* Onscreen contextual guide hints */}
      {points.length === 0 && (
        <div
          role="status"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d1117]/95 backdrop-blur-md text-gray-200 text-xs px-4 py-2 rounded-full border border-white/15 shadow-2xl pointer-events-none flex items-center gap-2 font-medium"
        >
          <span>📍</span> Hacé click en cualquier lugar del mapa para agregar puntos
        </div>
      )}
      {points.length === 1 && (
        <div
          role="status"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-[#0d1117]/95 backdrop-blur-md text-gray-200 text-xs px-4 py-2 rounded-full border border-white/15 shadow-2xl pointer-events-none flex items-center gap-2 font-medium"
        >
          <span>➕</span> Agregá más puntos para delimitar las celdas de Voronoi
        </div>
      )}
    </div>
  );
}
