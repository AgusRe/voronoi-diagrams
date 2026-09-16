export type PointCategory = "own" | "competitor" | "interest" | "custom";

export interface VoronoiPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  color: string;
  category: PointCategory;
  createdAt: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Project {
  id: string;
  name: string;
  points: VoronoiPoint[];
  center: LatLng;
  zoom: number;
  createdAt: number;
  updatedAt: number;
  schemaVersion?: number;
}

export const CATEGORY_COLORS: Record<PointCategory, string> = {
  own: "#6366f1",
  competitor: "#ef4444",
  interest: "#f59e0b",
  custom: "#10b981",
};

export const CATEGORY_LABELS: Record<PointCategory, string> = {
  own: "Mi local",
  competitor: "Competidor",
  interest: "Punto de interés",
  custom: "Personalizado",
};

export const DEFAULT_COLOR_PALETTE = [
  "#6366f1", // Indigo
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#06b6d4", // Cyan
];

/**
 * Generates standard RFC 4122 v4 UUID using native browser crypto API.
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
