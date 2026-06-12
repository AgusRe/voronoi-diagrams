"use client";

import { useEffect, useRef } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "@/store/useMapStore";
import { VoronoiPoint } from "@/types";

interface PointMarkerProps {
  point: VoronoiPoint;
}

/** Creates a custom circular Leaflet DivIcon for a given color and size */
function createIcon(color: string, size: number, isSelected: boolean): L.DivIcon {
  const border = isSelected ? "3px solid #fff" : "2px solid rgba(255,255,255,0.7)";
  const shadow = isSelected ? `0 0 0 3px ${color}55, 0 4px 12px rgba(0,0,0,0.5)` : "0 2px 6px rgba(0,0,0,0.4)";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:${border};
      box-shadow:${shadow};
      cursor:pointer;
      transition:transform 0.15s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function PointMarker({ point }: PointMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const { setHoveredPoint, setSelectedPoint, selectedPointId, updatePoint } = useMapStore();

  const isSelected = selectedPointId === point.id;
  const size = isSelected ? 20 : 14;
  const icon = createIcon(point.color, size, isSelected);

  // Sync icon when selection / color changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(createIcon(point.color, isSelected ? 20 : 14, isSelected));
    }
  }, [point.color, isSelected]);

  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={icon}
      draggable={true}
      title={point.name}
      ref={markerRef}
      eventHandlers={{
        click: () => setSelectedPoint(isSelected ? null : point.id),
        mouseover: () => setHoveredPoint(point.id),
        mouseout: () => setHoveredPoint(null),
        dragend: (e) => {
          const latlng = (e.target as L.Marker).getLatLng();
          updatePoint(point.id, { lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}
