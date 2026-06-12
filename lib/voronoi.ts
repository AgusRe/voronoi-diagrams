import { Delaunay } from "d3-delaunay";

export interface PixelPoint {
  x: number;
  y: number;
  id: string;
  color: string;
  name: string;
}

/**
 * Calculates and draws the Voronoi diagram on a canvas.
 * Points must already be in pixel coordinates.
 */
export function drawVoronoi(
  ctx: CanvasRenderingContext2D,
  points: PixelPoint[],
  width: number,
  height: number,
  opacity: number,
  hoveredId: string | null,
  selectedId: string | null
) {
  ctx.clearRect(0, 0, width, height);

  if (points.length < 2) return;

  const coords = points.map((p) => [p.x, p.y] as [number, number]);
  const delaunay = Delaunay.from(coords);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  // Draw filled cells
  for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell) continue;

    const pt = points[i];
    const isHovered = pt.id === hoveredId;
    const isSelected = pt.id === selectedId;

    ctx.beginPath();
    ctx.moveTo(cell[0][0], cell[0][1]);
    for (let j = 1; j < cell.length; j++) {
      ctx.lineTo(cell[j][0], cell[j][1]);
    }
    ctx.closePath();

    // Fill
    const fillOpacity = isHovered || isSelected ? Math.min(opacity + 0.25, 0.85) : opacity;
    ctx.fillStyle = hexToRgba(pt.color, fillOpacity);
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered || isSelected
      ? pt.color
      : hexToRgba(pt.color, opacity + 0.2);
    ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
    ctx.stroke();
  }

  // Draw point markers on canvas (small dot at center)
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isHovered = pt.id === hoveredId;
    const isSelected = pt.id === selectedId;
    const radius = isHovered || isSelected ? 8 : 6;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = pt.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(99,102,241,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}
