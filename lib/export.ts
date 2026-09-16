import type { VoronoiPoint } from "../types/index";
import { CATEGORY_LABELS } from "../types/index";
import { drawVoronoi } from "./voronoi";
import type { PixelPoint } from "./voronoi";

/**
 * Sanitizes a string to make it safe for filenames across Windows, macOS and Linux.
 */
export function sanitizeFilename(name: string, fallback = "voronoi-proyecto"): string {
  if (!name || typeof name !== "string") return fallback;
  const clean = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return clean || fallback;
}

/**
 * Escapes a single cell for RFC 4180 CSV compliance.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string with UTF-8 BOM for full Excel compatibility.
 */
export function generatePointsCsv(points: VoronoiPoint[]): string {
  const headers = [
    "ID",
    "Nombre",
    "Categoría",
    "Etiqueta",
    "Latitud",
    "Longitud",
    "Color",
    "Fecha Creación",
  ];

  const rows = points.map((p) => [
    p.id,
    p.name,
    p.category,
    CATEGORY_LABELS[p.category] || p.category,
    p.lat.toFixed(6),
    p.lng.toFixed(6),
    p.color,
    new Date(p.createdAt).toISOString(),
  ]);

  const csvBody = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  // UTF-8 BOM (\uFEFF) ensures Excel automatically parses UTF-8 characters and accents
  return `\uFEFF${csvBody}`;
}

/**
 * Triggers a browser file download from text content.
 */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExportPngOptions {
  projectName: string;
  points: VoronoiPoint[];
  width?: number;
  height?: number;
  opacity?: number;
  includeLabels?: boolean;
}

/**
 * Generates and downloads a deterministic, high-resolution PNG of the Voronoi diagram.
 * Renders on an offscreen canvas with dark styling, points and clear typography.
 */
export async function exportDiagramAsPng({
  projectName,
  points,
  width = 1600,
  height = 1000,
  opacity = 0.45,
  includeLabels = true,
}: ExportPngOptions): Promise<void> {
  if (typeof document === "undefined" || points.length === 0) return;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Dark aesthetic background
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle architectural grid background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Normalize geographic coordinates to canvas pixel space
  const minLat = Math.min(...points.map((p) => p.lat));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const minLng = Math.min(...points.map((p) => p.lng));
  const maxLng = Math.max(...points.map((p) => p.lng));

  const padding = 100;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;

  const pixelPoints: PixelPoint[] = points.map((p) => {
    // Project with standard Mercator-like orientation (North up, East right)
    const normalizedX = (p.lng - minLng) / lngSpan;
    const normalizedY = 1 - (p.lat - minLat) / latSpan;

    return {
      x: padding + normalizedX * usableWidth,
      y: padding + normalizedY * usableHeight,
      id: p.id,
      color: p.color,
      name: p.name,
    };
  });

  // 4. Draw Voronoi diagram
  drawVoronoi(ctx, pixelPoints, width, height, opacity, null, null);

  // 5. Draw labels on high-res export if enabled
  if (includeLabels) {
    ctx.font = "bold 13px Inter, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const pt of pixelPoints) {
      // Pill badge behind text
      const textMetrics = ctx.measureText(pt.name);
      const textWidth = textMetrics.width;
      const textHeight = 18;
      const badgeY = pt.y + 18;

      ctx.fillStyle = "rgba(13, 17, 23, 0.85)";
      ctx.beginPath();
      ctx.roundRect(pt.x - textWidth / 2 - 8, badgeY - textHeight / 2, textWidth + 16, textHeight, 6);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(pt.name, pt.x, badgeY);
    }
  }

  // 6. Header / Watermark stamp
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "600 16px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(projectName, 30, 40);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "400 12px Inter, sans-serif";
  ctx.fillText(`VoronoiMap • ${points.length} puntos • ${new Date().toLocaleDateString()}`, 30, 62);

  // 7. Trigger download
  const safeName = sanitizeFilename(projectName, "voronoi-diagrama");
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
