"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import { useMapStore } from "@/store/useMapStore";
import { drawVoronoi, PixelPoint } from "@/lib/voronoi";

/**
 * Canvas overlay that draws the Voronoi diagram on top of the Leaflet map.
 * Must be rendered as a child of <MapContainer> to access the map instance.
 */
export default function VoronoiOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const { points, showVoronoi, voronoiOpacity, hoveredPointId, selectedPointId } = useMapStore();

  const redraw = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = map.getContainer();
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!showVoronoi || points.length < 2) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // Convert lat/lng to pixel coordinates relative to the map container
    const pixelPoints: PixelPoint[] = points.map((pt) => {
      const pixel = map.latLngToContainerPoint([pt.lat, pt.lng]);
      return { x: pixel.x, y: pixel.y, id: pt.id, color: pt.color, name: pt.name };
    });

    drawVoronoi(ctx, pixelPoints, width, height, voronoiOpacity, hoveredPointId, selectedPointId);
  }, [map, points, showVoronoi, voronoiOpacity, hoveredPointId, selectedPointId]);

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(redraw);
  }, [redraw]);

  // Attach Leaflet map events
  useEffect(() => {
    map.on("moveend", scheduleRedraw);
    map.on("zoomend", scheduleRedraw);
    map.on("resize", scheduleRedraw);
    scheduleRedraw();

    return () => {
      map.off("moveend", scheduleRedraw);
      map.off("zoomend", scheduleRedraw);
      map.off("resize", scheduleRedraw);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [map, scheduleRedraw]);

  // Redraw when points / settings change
  useEffect(() => {
    scheduleRedraw();
  }, [scheduleRedraw]);

  // Position the canvas absolutely inside the Leaflet container pane
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    return () => {
      if (canvas.parentNode === pane) pane.removeChild(canvas);
    };
  }, [map]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 400,
      }}
    />
  );
}
