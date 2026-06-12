import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VoronoiPoint, Project, PointCategory, LatLng } from "@/types";

interface MapStore {
  // Current session
  points: VoronoiPoint[];
  hoveredPointId: string | null;
  selectedPointId: string | null;
  mapCenter: LatLng;
  mapZoom: number;
  showVoronoi: boolean;
  voronoiOpacity: number;

  // Projects
  projects: Project[];
  currentProjectName: string;

  // Actions - Points
  addPoint: (lat: number, lng: number) => void;
  removePoint: (id: string) => void;
  updatePoint: (id: string, updates: Partial<VoronoiPoint>) => void;
  clearPoints: () => void;
  setHoveredPoint: (id: string | null) => void;
  setSelectedPoint: (id: string | null) => void;

  // Actions - Map
  setMapCenter: (center: LatLng) => void;
  setMapZoom: (zoom: number) => void;
  setShowVoronoi: (show: boolean) => void;
  setVoronoiOpacity: (opacity: number) => void;

  // Actions - Projects
  saveProject: () => void;
  loadProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  setCurrentProjectName: (name: string) => void;
}

const DEFAULT_COLOR_PALETTE = [
  "#6366f1", "#ef4444", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#f43f5e", "#14b8a6",
];

let colorIndex = 0;
const getNextColor = () => {
  const color = DEFAULT_COLOR_PALETTE[colorIndex % DEFAULT_COLOR_PALETTE.length];
  colorIndex++;
  return color;
};

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      points: [],
      hoveredPointId: null,
      selectedPointId: null,
      mapCenter: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires default
      mapZoom: 12,
      showVoronoi: true,
      voronoiOpacity: 0.35,
      projects: [],
      currentProjectName: "Mi Proyecto",

      addPoint: (lat, lng) => {
        const newPoint: VoronoiPoint = {
          id: `point-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          lat,
          lng,
          name: `Punto ${get().points.length + 1}`,
          color: getNextColor(),
          category: "own" as PointCategory,
          createdAt: Date.now(),
        };
        set((state) => ({ points: [...state.points, newPoint] }));
      },

      removePoint: (id) =>
        set((state) => ({
          points: state.points.filter((p) => p.id !== id),
          hoveredPointId: state.hoveredPointId === id ? null : state.hoveredPointId,
          selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
        })),

      updatePoint: (id, updates) =>
        set((state) => ({
          points: state.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      clearPoints: () => set({ points: [], hoveredPointId: null, selectedPointId: null }),

      setHoveredPoint: (id) => set({ hoveredPointId: id }),
      setSelectedPoint: (id) => set({ selectedPointId: id }),

      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      setShowVoronoi: (show) => set({ showVoronoi: show }),
      setVoronoiOpacity: (opacity) => set({ voronoiOpacity: opacity }),

      saveProject: () => {
        const state = get();
        const existing = state.projects.find(
          (p) => p.name === state.currentProjectName
        );
        const project: Project = {
          id: existing?.id ?? `project-${Date.now()}`,
          name: state.currentProjectName,
          points: state.points,
          center: state.mapCenter,
          zoom: state.mapZoom,
          createdAt: existing?.createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          projects: existing
            ? s.projects.map((p) => (p.id === project.id ? project : p))
            : [...s.projects, project],
        }));
      },

      loadProject: (project) => {
        set({
          points: project.points,
          mapCenter: project.center,
          mapZoom: project.zoom,
          currentProjectName: project.name,
        });
      },

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      setCurrentProjectName: (name) => set({ currentProjectName: name }),
    }),
    {
      name: "voronoi-store",
      partialize: (state) => ({
        projects: state.projects,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
        voronoiOpacity: state.voronoiOpacity,
        currentProjectName: state.currentProjectName,
      }),
    }
  )
);
