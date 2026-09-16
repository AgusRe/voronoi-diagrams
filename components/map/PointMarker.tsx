"use client";

import { useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "@/store/useMapStore";
import { VoronoiPoint } from "@/types";

interface PointMarkerProps {
  point: VoronoiPoint;
}

/**
 * Creates a custom circular Leaflet DivIcon for a point.
 * Provides distinct styles for default, hover and selected states.
 */
function createIcon(color: string, size: number, isSelected: boolean): L.DivIcon {
  const border = isSelected ? "3px solid #ffffff" : "2px solid rgba(255,255,255,0.85)";
  const shadow = isSelected
    ? `0 0 0 4px ${color}66, 0 6px 16px rgba(0,0,0,0.6)`
    : "0 2px 8px rgba(0,0,0,0.45)";

  return L.divIcon({
    className: "custom-voronoi-marker",
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:${border};
      box-shadow:${shadow};
      cursor:pointer;
      transform:translate(-50%, -50%);
      transition:transform 0.15s ease, box-shadow 0.15s ease;
    "></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function PointMarker({ point }: PointMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  const selectedPointId = useMapStore((state) => state.selectedPointId);
  const hoveredPointId = useMapStore((state) => state.hoveredPointId);
  const setSelectedPoint = useMapStore((state) => state.setSelectedPoint);
  const setHoveredPoint = useMapStore((state) => state.setHoveredPoint);
  const updatePoint = useMapStore((state) => state.updatePoint);

  const isSelected = selectedPointId === point.id;
  const isHovered = hoveredPointId === point.id;

  const size = isSelected ? 22 : isHovered ? 18 : 14;

  // Update marker icon dynamically when point color, selection or hover changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createIcon(point.color, size, isSelected));
    }
  }, [point.color, size, isSelected]);

  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={createIcon(point.color, size, isSelected)}
      draggable={true}
      title={`${point.name} (${point.category})`}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          setSelectedPoint(isSelected ? null : point.id);
        },
        mouseover: () => {
          setHoveredPoint(point.id);
        },
        mouseout: () => {
          setHoveredPoint(null);
        },
        drag: (e) => {
          const latlng = (e.target as L.Marker).getLatLng();
          updatePoint(point.id, { lat: latlng.lat, lng: latlng.lng });
        },
        dragend: (e) => {
          const latlng = (e.target as L.Marker).getLatLng();
          updatePoint(point.id, { lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}
