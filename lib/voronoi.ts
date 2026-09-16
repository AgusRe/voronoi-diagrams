import { Delaunay } from "d3-delaunay";

export interface PixelPoint {
  x: number;
  y: number;
  id: string;
  color: string;
  name: string;
}

export interface DrawVoronoiOptions {
  ctx: CanvasRenderingContext2D;
  points: PixelPoint[];
  width: number;
  height: number;
  opacity: number;
  hoveredId: string | null;
  selectedId: string | null;
}

/**
 * Clamps a numeric value between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Validates a HEX color string (#RGB, #RGBA, #RRGGBB, #RRGGBBAA).
 * Returns safe fallback if invalid.
 */
export function sanitizeHexColor(hex: string, fallback = "#6366f1"): string {
  if (typeof hex !== "string") return fallback;
  const clean = hex.trim();
  if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(clean)) {
    return clean;
  }
  return fallback;
}

/**
 * Converts a hex color and alpha (0 to 1) into a valid CSS rgba string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const safeHex = sanitizeHexColor(hex);
  const safeAlpha = clamp(alpha, 0, 1);

  let clean = safeHex.slice(1);
  if (clean.length === 3 || clean.length === 4) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

/**
 * Validates whether a pixel coordinate is finite and valid.
 */
export function isValidCoordinate(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y);
}

/**
 * Detects if any points in the set are geographically or visually overlapping (distance < 1px).
 * Returns a Set containing the IDs of overlapping points.
 */
export function findOverlappingPoints(points: PixelPoint[], thresholdPx = 1): Set<string> {
  const overlappingIds = new Set<string>();
  const thresholdSq = thresholdPx * thresholdPx;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    if (!isValidCoordinate(p1.x, p1.y)) continue;

    for (let j = i + 1; j < points.length; j++) {
      const p2 = points[j];
      if (!isValidCoordinate(p2.x, p2.y)) continue;

      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      if (dx * dx + dy * dy <= thresholdSq) {
        overlappingIds.add(p1.id);
        overlappingIds.add(p2.id);
      }
    }
  }

  return overlappingIds;
}

/**
 * Prepares coordinates for d3-delaunay without mutating or discarding user points.
 * Applies a micro-jitter (< 0.001px) to identical coordinates solely for triangulation stability.
 */
export function prepareDelaunayCoordinates(points: PixelPoint[]): Array<[number, number]> {
  const seen = new Map<string, number>();

  return points.map((p, idx) => {
    const key = `${p.x.toFixed(4)},${p.y.toFixed(4)}`;
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);

    if (count === 0) {
      return [p.x, p.y];
    }

    // Deterministic microscopic perturbation for duplicate sites so Delaunay does not collapse
    const angle = (idx * 1.6180339887) * Math.PI * 2;
    const distance = count * 0.0001;
    return [p.x + Math.cos(angle) * distance, p.y + Math.sin(angle) * distance];
  });
}

/**
 * Draws the Voronoi diagram deterministically on a canvas.
 * Handles 0, 1, 2, colineals, coincident points and any valid canvas dimensions.
 */
export function drawVoronoi(
  ctx: CanvasRenderingContext2D,
  points: PixelPoint[],
  width: number,
  height: number,
  opacity: number,
  hoveredId: string | null,
  selectedId: string | null
): void {
  // Validate dimensions
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return;
  }

  ctx.clearRect(0, 0, width, height);

  // Filter out any corrupt coordinates with NaN or Infinity (preserving legitimate user points)
  const validPoints = points.filter((p) => isValidCoordinate(p.x, p.y));
  if (validPoints.length === 0) return;

  const safeOpacity = clamp(opacity, 0.05, 0.95);

  // Case 1: Exactly 1 point -> Single cell covers entire viewport
  if (validPoints.length === 1) {
    const pt = validPoints[0];
    const isHovered = pt.id === hoveredId;
    const isSelected = pt.id === selectedId;
    const fillOpacity = isHovered || isSelected ? Math.min(safeOpacity + 0.25, 0.95) : safeOpacity;

    ctx.fillStyle = hexToRgba(pt.color, fillOpacity);
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isHovered || isSelected ? pt.color : hexToRgba(pt.color, safeOpacity + 0.2);
    ctx.lineWidth = isHovered || isSelected ? 3 : 1.5;
    ctx.strokeRect(0, 0, width, height);

    renderPointDot(ctx, pt, isHovered, isSelected);
    return;
  }

  // Case 2+: 2 or more points (handled natively with d3-delaunay)
  try {
    const coords = prepareDelaunayCoordinates(validPoints);
    const delaunay = Delaunay.from(coords);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Draw polygons
    for (let i = 0; i < validPoints.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell || cell.length < 3) continue;

      const pt = validPoints[i];
      const isHovered = pt.id === hoveredId;
      const isSelected = pt.id === selectedId;

      ctx.beginPath();
      ctx.moveTo(cell[0][0], cell[0][1]);
      for (let j = 1; j < cell.length; j++) {
        ctx.lineTo(cell[j][0], cell[j][1]);
      }
      ctx.closePath();

      const fillOpacity = isHovered || isSelected ? Math.min(safeOpacity + 0.25, 0.95) : safeOpacity;
      ctx.fillStyle = hexToRgba(pt.color, fillOpacity);
      ctx.fill();

      ctx.strokeStyle = isHovered || isSelected ? pt.color : hexToRgba(pt.color, safeOpacity + 0.2);
      ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
      ctx.stroke();
    }
  } catch (err) {
    // If d3-delaunay encounters any rare degenerate case, render gracefully without crashing
    console.error("Voronoi computation warning:", err);
  }

  // Render dots for each point
  for (let i = 0; i < validPoints.length; i++) {
    const pt = validPoints[i];
    renderPointDot(ctx, pt, pt.id === hoveredId, pt.id === selectedId);
  }
}

/**
 * Helper to render an indicator circle for a point on the canvas.
 */
function renderPointDot(
  ctx: CanvasRenderingContext2D,
  pt: PixelPoint,
  isHovered: boolean,
  isSelected: boolean
): void {
  const radius = isHovered || isSelected ? 7 : 5;

  ctx.beginPath();
  ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = pt.color;
  ctx.fill();
  ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.stroke();
}
