import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clamp,
  sanitizeHexColor,
  hexToRgba,
  isValidCoordinate,
  findOverlappingPoints,
  prepareDelaunayCoordinates,
  drawVoronoi,
  PixelPoint,
} from "../lib/voronoi.ts";

// Minimal CanvasRenderingContext2D mock for pure headless verification
function createMockCanvasContext() {
  const calls: string[] = [];
  return {
    calls,
    clearRect: (x: number, y: number, w: number, h: number) => {
      calls.push(`clearRect(${x},${y},${w},${h})`);
    },
    fillRect: (x: number, y: number, w: number, h: number) => {
      calls.push(`fillRect(${x},${y},${w},${h})`);
    },
    strokeRect: (x: number, y: number, w: number, h: number) => {
      calls.push(`strokeRect(${x},${y},${w},${h})`);
    },
    beginPath: () => calls.push("beginPath"),
    moveTo: (x: number, y: number) => calls.push(`moveTo(${x.toFixed(1)},${y.toFixed(1)})`),
    lineTo: (x: number, y: number) => calls.push(`lineTo(${x.toFixed(1)},${y.toFixed(1)})`),
    closePath: () => calls.push("closePath"),
    fill: () => calls.push("fill"),
    stroke: () => calls.push("stroke"),
    arc: (x: number, y: number, r: number) => calls.push(`arc(${x.toFixed(1)},${y.toFixed(1)},${r})`),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D & { calls: string[] };
}

describe("Voronoi Engine Unit Tests", () => {
  describe("clamp() & color helpers", () => {
    it("clamps values between min and max", () => {
      assert.equal(clamp(0.5, 0, 1), 0.5);
      assert.equal(clamp(-0.2, 0, 1), 0);
      assert.equal(clamp(1.5, 0, 1), 1);
      assert.equal(clamp(NaN, 0, 1), 0);
    });

    it("sanitizes hex colors strictly", () => {
      assert.equal(sanitizeHexColor("#fff"), "#fff");
      assert.equal(sanitizeHexColor("#6366f1"), "#6366f1");
      assert.equal(sanitizeHexColor("invalid-color"), "#6366f1");
      assert.equal(sanitizeHexColor(""), "#6366f1");
    });

    it("converts hex to valid rgba with clamped opacity", () => {
      assert.equal(hexToRgba("#ffffff", 0.5), "rgba(255, 255, 255, 0.5)");
      assert.equal(hexToRgba("#000000", -1), "rgba(0, 0, 0, 0)");
      assert.equal(hexToRgba("#000000", 2), "rgba(0, 0, 0, 1)");
      assert.equal(hexToRgba("#fff", 0.8), "rgba(255, 255, 255, 0.8)");
    });
  });

  describe("Coordinate validation & overlapping detection", () => {
    it("validates coordinate finiteness", () => {
      assert.equal(isValidCoordinate(100, 200), true);
      assert.equal(isValidCoordinate(NaN, 200), false);
      assert.equal(isValidCoordinate(100, Infinity), false);
    });

    it("detects overlapping/identical points", () => {
      const points: PixelPoint[] = [
        { id: "p1", x: 100, y: 100, color: "#6366f1", name: "A" },
        { id: "p2", x: 100, y: 100.2, color: "#ef4444", name: "B" },
        { id: "p3", x: 300, y: 400, color: "#10b981", name: "C" },
      ];

      const overlapping = findOverlappingPoints(points, 0.5);
      assert.equal(overlapping.has("p1"), true);
      assert.equal(overlapping.has("p2"), true);
      assert.equal(overlapping.has("p3"), false);
    });

    it("prepares coordinates with microscopic jitter for identical sites", () => {
      const points: PixelPoint[] = [
        { id: "p1", x: 50, y: 50, color: "#6366f1", name: "A" },
        { id: "p2", x: 50, y: 50, color: "#ef4444", name: "B" },
      ];

      const coords = prepareDelaunayCoordinates(points);
      assert.equal(coords.length, 2);
      assert.equal(coords[0][0], 50);
      assert.equal(coords[0][1], 50);
      // Second point should be slightly offset so Delaunay does not collapse
      assert.notEqual(coords[1][0], 50);
    });
  });

  describe("drawVoronoi() deterministic rendering", () => {
    it("handles 0 points by clearing canvas", () => {
      const ctx = createMockCanvasContext();
      drawVoronoi(ctx, [], 500, 500, 0.5, null, null);
      assert.ok(ctx.calls.includes("clearRect(0,0,500,500)"));
      assert.equal(ctx.calls.filter((c) => c.startsWith("fill")).length, 0);
    });

    it("handles invalid canvas dimensions safely", () => {
      const ctx = createMockCanvasContext();
      drawVoronoi(ctx, [{ id: "1", x: 10, y: 10, color: "#fff", name: "A" }], 0, 500, 0.5, null, null);
      assert.equal(ctx.calls.length, 0);

      drawVoronoi(ctx, [{ id: "1", x: 10, y: 10, color: "#fff", name: "A" }], 500, -10, 0.5, null, null);
      assert.equal(ctx.calls.length, 0);
    });

    it("handles 1 point by filling entire viewport", () => {
      const ctx = createMockCanvasContext();
      const points: PixelPoint[] = [{ id: "single", x: 100, y: 100, color: "#6366f1", name: "Only" }];

      drawVoronoi(ctx, points, 800, 600, 0.4, null, null);
      assert.ok(ctx.calls.includes("clearRect(0,0,800,600)"));
      assert.ok(ctx.calls.includes("fillRect(0,0,800,600)"));
      assert.ok(ctx.calls.some((c) => c.startsWith("arc(")));
    });

    it("handles 2 points by partitioning the plane", () => {
      const ctx = createMockCanvasContext();
      const points: PixelPoint[] = [
        { id: "p1", x: 200, y: 300, color: "#6366f1", name: "P1" },
        { id: "p2", x: 400, y: 300, color: "#ef4444", name: "P2" },
      ];

      drawVoronoi(ctx, points, 800, 600, 0.4, null, null);
      assert.ok(ctx.calls.includes("clearRect(0,0,800,600)"));
      assert.ok(ctx.calls.filter((c) => c === "fill").length >= 2);
    });

    it("handles colineal points without crashing", () => {
      const ctx = createMockCanvasContext();
      const points: PixelPoint[] = [
        { id: "c1", x: 100, y: 100, color: "#6366f1", name: "C1" },
        { id: "c2", x: 200, y: 200, color: "#ef4444", name: "C2" },
        { id: "c3", x: 300, y: 300, color: "#10b981", name: "C3" },
      ];

      assert.doesNotThrow(() => {
        drawVoronoi(ctx, points, 800, 600, 0.4, null, null);
      });
      assert.ok(ctx.calls.includes("clearRect(0,0,800,600)"));
      assert.ok(ctx.calls.filter((c) => c.startsWith("arc")).length >= 3);
    });

    it("handles coincident/identical points gracefully", () => {
      const ctx = createMockCanvasContext();
      const points: PixelPoint[] = [
        { id: "d1", x: 250, y: 250, color: "#6366f1", name: "D1" },
        { id: "d2", x: 250, y: 250, color: "#ef4444", name: "D2" },
        { id: "d3", x: 400, y: 400, color: "#f59e0b", name: "D3" },
      ];

      assert.doesNotThrow(() => {
        drawVoronoi(ctx, points, 800, 600, 0.4, null, null);
      });
      assert.ok(ctx.calls.filter((c) => c.startsWith("arc")).length >= 3);
    });

    it("filters out invalid NaN/Infinity point coordinates", () => {
      const ctx = createMockCanvasContext();
      const points: PixelPoint[] = [
        { id: "corrupt1", x: NaN, y: 100, color: "#6366f1", name: "Corrupt" },
        { id: "corrupt2", x: 100, y: Infinity, color: "#ef4444", name: "Infinite" },
        { id: "valid", x: 300, y: 300, color: "#10b981", name: "Valid" },
      ];

      assert.doesNotThrow(() => {
        drawVoronoi(ctx, points, 800, 600, 0.4, null, null);
      });
      // Exactly 1 valid point -> executes 1 point branch (fillRect)
      assert.ok(ctx.calls.includes("fillRect(0,0,800,600)"));
    });
  });
});
