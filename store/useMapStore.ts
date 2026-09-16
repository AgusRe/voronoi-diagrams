import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VoronoiPoint, Project, PointCategory, LatLng } from "../types/index";
import { generateUUID, DEFAULT_COLOR_PALETTE, CATEGORY_COLORS } from "../types/index";
import { sanitizeHexColor } from "../lib/voronoi";

export const CURRENT_SCHEMA_VERSION = 1;

interface MapStore {
  // Points & Selection
  points: VoronoiPoint[];
  hoveredPointId: string | null;
  selectedPointId: string | null;

  // Map viewport
  mapCenter: LatLng;
  mapZoom: number;

  // Voronoi visual settings
  showVoronoi: boolean;
  voronoiOpacity: number;

  // Project management
  currentProjectId: string | null;
  currentProjectName: string;
  isDirty: boolean;
  projects: Project[];

  // Actions - Points
  addPoint: (lat: number, lng: number, name?: string, category?: PointCategory, color?: string) => string;
  removePoint: (id: string) => void;
  updatePoint: (id: string, updates: Partial<Omit<VoronoiPoint, "id" | "createdAt">>) => void;
  clearPoints: () => void;
  setHoveredPoint: (id: string | null) => void;
  setSelectedPoint: (id: string | null) => void;

  // Actions - Map
  setMapCenter: (center: LatLng) => void;
  setMapZoom: (zoom: number) => void;
  setShowVoronoi: (show: boolean) => void;
  setVoronoiOpacity: (opacity: number) => void;

  // Actions - Projects
  setCurrentProjectName: (name: string) => void;
  saveProject: (overwriteExistingId?: string) => { success: boolean; projectId: string; overwritten: boolean };
  loadProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  createNewProject: (name?: string) => void;
}

let colorIndex = 0;
const getNextColor = () => {
  const color = DEFAULT_COLOR_PALETTE[colorIndex % DEFAULT_COLOR_PALETTE.length];
  colorIndex++;
  return color;
};

/**
 * Validates and sanitizes a list of VoronoiPoint objects to prevent corrupt data crashes.
 */
function sanitizePointsList(rawPoints: unknown[]): VoronoiPoint[] {
  if (!Array.isArray(rawPoints)) return [];

  return rawPoints
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p, idx): VoronoiPoint | null => {
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const category: PointCategory =
        p.category === "competitor" || p.category === "interest" || p.category === "custom"
          ? p.category
          : "own";

      const defaultColor = CATEGORY_COLORS[category] || "#6366f1";
      const color = typeof p.color === "string" ? sanitizeHexColor(p.color, defaultColor) : defaultColor;
      const name = typeof p.name === "string" && p.name.trim() ? p.name.trim() : `Punto ${idx + 1}`;
      const id = typeof p.id === "string" && p.id.trim() ? p.id : generateUUID();
      const createdAt = typeof p.createdAt === "number" && !Number.isNaN(p.createdAt) ? p.createdAt : Date.now();

      return { id, lat, lng, name, color, category, createdAt };
    })
    .filter((p): p is VoronoiPoint => p !== null);
}

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      points: [],
      hoveredPointId: null,
      selectedPointId: null,
      mapCenter: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires default
      mapZoom: 13,
      showVoronoi: true,
      voronoiOpacity: 0.35,

      currentProjectId: null,
      currentProjectName: "Mi Proyecto",
      isDirty: false,
      projects: [],

      addPoint: (lat, lng, name, category = "own", color) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return "";
        }

        const pointColor = color ? sanitizeHexColor(color) : CATEGORY_COLORS[category] || getNextColor();
        const pointId = generateUUID();
        const pointName = name?.trim() || `Punto ${get().points.length + 1}`;

        const newPoint: VoronoiPoint = {
          id: pointId,
          lat,
          lng,
          name: pointName,
          color: pointColor,
          category,
          createdAt: Date.now(),
        };

        set((state) => ({
          points: [...state.points, newPoint],
          selectedPointId: pointId,
          isDirty: true,
        }));

        return pointId;
      },

      removePoint: (id) =>
        set((state) => ({
          points: state.points.filter((p) => p.id !== id),
          hoveredPointId: state.hoveredPointId === id ? null : state.hoveredPointId,
          selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
          isDirty: true,
        })),

      updatePoint: (id, updates) =>
        set((state) => ({
          points: state.points.map((p) => {
            if (p.id !== id) return p;
            const updatedColor = updates.color ? sanitizeHexColor(updates.color, p.color) : p.color;
            return {
              ...p,
              ...updates,
              color: updatedColor,
            };
          }),
          isDirty: true,
        })),

      clearPoints: () =>
        set({
          points: [],
          hoveredPointId: null,
          selectedPointId: null,
          isDirty: true,
        }),

      setHoveredPoint: (id) => set({ hoveredPointId: id }),
      setSelectedPoint: (id) => set({ selectedPointId: id }),

      setMapCenter: (center) => {
        if (Number.isFinite(center.lat) && Number.isFinite(center.lng)) {
          set({ mapCenter: center });
        }
      },

      setMapZoom: (zoom) => {
        if (Number.isFinite(zoom)) {
          set({ mapZoom: zoom });
        }
      },

      setShowVoronoi: (show) => set({ showVoronoi: Boolean(show) }),

      setVoronoiOpacity: (opacity) => {
        const safe = Math.max(0.05, Math.min(0.95, Number(opacity) || 0.35));
        set({ voronoiOpacity: safe });
      },

      setCurrentProjectName: (name) => {
        set({ currentProjectName: name, isDirty: true });
      },

      createNewProject: (name = "Nuevo Proyecto") => {
        set({
          currentProjectId: null,
          currentProjectName: name,
          points: [],
          hoveredPointId: null,
          selectedPointId: null,
          isDirty: false,
        });
      },

      saveProject: (overwriteExistingId) => {
        const state = get();
        const trimmedName = state.currentProjectName.trim() || "Proyecto Sin Título";

        // Determine target project ID
        let targetId = overwriteExistingId || state.currentProjectId;
        let isOverwriting = false;

        if (targetId) {
          const existing = state.projects.find((p) => p.id === targetId);
          if (existing) {
            isOverwriting = true;
          } else {
            targetId = null;
          }
        }

        if (!targetId) {
          // Check if there's a project with the identical name
          const existingByName = state.projects.find((p) => p.name.toLowerCase() === trimmedName.toLowerCase());
          if (existingByName) {
            targetId = existingByName.id;
            isOverwriting = true;
          } else {
            targetId = generateUUID();
          }
        }

        const project: Project = {
          id: targetId,
          name: trimmedName,
          points: state.points,
          center: state.mapCenter,
          zoom: state.mapZoom,
          createdAt: isOverwriting
            ? state.projects.find((p) => p.id === targetId)?.createdAt || Date.now()
            : Date.now(),
          updatedAt: Date.now(),
          schemaVersion: CURRENT_SCHEMA_VERSION,
        };

        set((s) => ({
          projects: isOverwriting
            ? s.projects.map((p) => (p.id === targetId ? project : p))
            : [project, ...s.projects],
          currentProjectId: targetId,
          currentProjectName: trimmedName,
          isDirty: false,
        }));

        return { success: true, projectId: targetId, overwritten: isOverwriting };
      },

      loadProject: (project) => {
        const safePoints = sanitizePointsList(project.points);
        const center =
          project.center && Number.isFinite(project.center.lat) && Number.isFinite(project.center.lng)
            ? project.center
            : { lat: -34.6037, lng: -58.3816 };
        const zoom = Number.isFinite(project.zoom) ? project.zoom : 13;

        set({
          currentProjectId: project.id,
          currentProjectName: project.name,
          points: safePoints,
          mapCenter: center,
          mapZoom: zoom,
          hoveredPointId: null,
          selectedPointId: null,
          isDirty: false,
        });
      },

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        })),
    }),
    {
      name: "voronoi-store-v1",
      version: CURRENT_SCHEMA_VERSION,
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }

        const state = persistedState as Partial<MapStore>;

        // Migrate older schema versions if needed
        if (version < 1) {
          if (Array.isArray(state.projects)) {
            state.projects = state.projects.map((p) => ({
              ...p,
              id: p.id || generateUUID(),
              schemaVersion: 1,
            }));
          }
        }

        return state;
      },
      partialize: (state) => ({
        projects: state.projects,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
        voronoiOpacity: state.voronoiOpacity,
        currentProjectName: state.currentProjectName,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
