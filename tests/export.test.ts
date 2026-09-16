import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeCsvCell,
  sanitizeFilename,
  generatePointsCsv,
} from "../lib/export.ts";
import { VoronoiPoint } from "../types/index.ts";

describe("Export Helpers Unit Tests", () => {
  describe("sanitizeFilename()", () => {
    it("strips illegal file system characters", () => {
      assert.equal(sanitizeFilename("Mi: Proyecto / Nuevo * 2026?"), "Mi-Proyecto-Nuevo-2026");
      assert.equal(sanitizeFilename(""), "voronoi-proyecto");
      assert.equal(sanitizeFilename("   "), "voronoi-proyecto");
    });
  });

  describe("escapeCsvCell() RFC 4180", () => {
    it("leaves simple text unchanged", () => {
      assert.equal(escapeCsvCell("Simple"), "Simple");
      assert.equal(escapeCsvCell(123.45), "123.45");
    });

    it("wraps cells containing commas in double quotes", () => {
      assert.equal(escapeCsvCell("Buenos Aires, Argentina"), '"Buenos Aires, Argentina"');
    });

    it("escapes internal quotes by doubling them", () => {
      assert.equal(escapeCsvCell('Local "El Trébol"'), '"Local ""El Trébol"""');
    });

    it("wraps cells containing line breaks in double quotes", () => {
      assert.equal(escapeCsvCell("Línea 1\nLínea 2"), '"Línea 1\nLínea 2"');
    });
  });

  describe("generatePointsCsv()", () => {
    it("generates valid CSV with UTF-8 BOM and headers", () => {
      const mockPoints: VoronoiPoint[] = [
        {
          id: "pt-1",
          name: 'Sucursal "Centro", CABA',
          lat: -34.6037,
          lng: -58.3816,
          color: "#6366f1",
          category: "own",
          createdAt: 1700000000000,
        },
      ];

      const csv = generatePointsCsv(mockPoints);

      // Verify UTF-8 BOM
      assert.equal(csv.charCodeAt(0), 0xfeff);

      // Verify headers
      assert.ok(csv.includes("ID,Nombre,Categoría,Etiqueta,Latitud,Longitud,Color,Fecha Creación"));

      // Verify RFC 4180 escaped content
      assert.ok(csv.includes('"Sucursal ""Centro"", CABA"'));
      assert.ok(csv.includes("-34.603700"));
      assert.ok(csv.includes("-58.381600"));
    });
  });
});
