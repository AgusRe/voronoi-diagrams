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
