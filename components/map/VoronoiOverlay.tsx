"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import { useMapStore } from "@/store/useMapStore";
import { drawVoronoi, PixelPoint } from "@/lib/voronoi";

/**
 * Canvas overlay that draws the Voronoi diagram on top of the Leaflet map.
 * Must be rendered as a child of <MapContainer> to access the Leaflet instance.
 *
 * Implements:
 * - Proper HiDPI / Retina devicePixelRatio scaling.
 * - Non-destructive DOM integration.
 * - Smooth synchronized rendering with requestAnimationFrame on pan/zoom/resize.
 * - Clean teardown preventing leaks.
 */
export default function VoronoiOverlay() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const points = useMapStore((state) => state.points);
  const showVoronoi = useMapStore((state) => state.showVoronoi);
  const voronoiOpacity = useMapStore((state) => state.voronoiOpacity);
  const hoveredPointId = useMapStore((state) => state.hoveredPointId);
  const selectedPointId = useMapStore((state) => state.selectedPointId);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = map.getSize();
    const width = size.x;
    const height = size.y;

    if (width <= 0 || height <= 0) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // Set physical resolution for crisp rendering on HiDPI displays
    const physicalWidth = Math.round(width * dpr);
    const physicalHeight = Math.round(height * dpr);

    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
    }

    // Set CSS display dimensions
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset transform matrix and scale for device pixel ratio
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!showVoronoi || points.length === 0) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // Project geographic points to logical container pixel coordinates
    const pixelPoints: PixelPoint[] = points.map((pt) => {
      const pixel = map.latLngToContainerPoint([pt.lat, pt.lng]);
      return {
        x: pixel.x,
        y: pixel.y,
        id: pt.id,
        color: pt.color,
        name: pt.name,
      };
    });

    drawVoronoi(
      ctx,
      pixelPoints,
      width,
      height,
      voronoiOpacity,
      hoveredPointId,
      selectedPointId
    );
  }, [map, points, showVoronoi, voronoiOpacity, hoveredPointId, selectedPointId]);

  const scheduleRedraw = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(() => {
      animFrameRef.current = null;
      redraw();
    });
  }, [redraw]);

  // Synchronize on Leaflet map events (pan, zoom, resize)
  useEffect(() => {
    map.on("move", scheduleRedraw);
    map.on("moveend", scheduleRedraw);
    map.on("zoom", scheduleRedraw);
    map.on("zoomend", scheduleRedraw);
    map.on("viewreset", scheduleRedraw);
    map.on("resize", scheduleRedraw);

    // Initial render
    scheduleRedraw();

    return () => {
      map.off("move", scheduleRedraw);
      map.off("moveend", scheduleRedraw);
      map.off("zoom", scheduleRedraw);
      map.off("zoomend", scheduleRedraw);
      map.off("viewreset", scheduleRedraw);
      map.off("resize", scheduleRedraw);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [map, scheduleRedraw]);

  // React to state changes (points, opacity, selection, hover)
  useEffect(() => {
    scheduleRedraw();
  }, [scheduleRedraw]);

  // Observe container resize for responsive layout changes
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      scheduleRedraw();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [map, scheduleRedraw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 400, // Above map tiles, below Leaflet UI controls and markers
      }}
    />
  );
}
