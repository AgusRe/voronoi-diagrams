"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Home, Layers, Sliders, ChevronRight, Menu, X } from "lucide-react";
import PointList from "@/components/sidebar/PointList";
import ProjectControls from "@/components/sidebar/ProjectControls";
import { useMapStore } from "@/store/useMapStore";

// MapContainer dynamically imported with SSR disabled due to Leaflet window requirements
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#0d1117]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-xs font-medium tracking-wide">Cargando visor geoespacial...</p>
      </div>
    </div>
  ),
});

type SidebarTab = "points" | "controls";

export default function MapPage() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("points");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const points = useMapStore((state) => state.points);
  const currentProjectName = useMapStore((state) => state.currentProjectName);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1117] text-white">
      {/* Top App Header */}
      <header className="h-13 border-b border-white/10 flex items-center px-4 gap-3 flex-shrink-0 z-20 bg-[#0d1117]/95 backdrop-blur-md">
        <Link
          href="/"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          aria-label="Volver al inicio"
          title="Página de inicio"
        >
          <Home size={16} />
        </Link>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
            <MapPin size={13} className="text-white" />
          </div>
          <div>
            <span className="text-white text-xs font-semibold tracking-tight block">VoronoiMap</span>
            <span className="text-[10px] text-gray-400 block truncate max-w-[140px] sm:max-w-xs font-normal">
              {currentProjectName}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Quick status badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-[11px] text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{points.length} {points.length === 1 ? "punto activo" : "puntos activos"}</span>
          </div>

          {/* Toggle sidebar button (always available, crucial on mobile) */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
            aria-expanded={isSidebarOpen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all"
          >
            {isSidebarOpen ? <X size={15} /> : <Menu size={15} />}
            <span className="hidden md:inline">{isSidebarOpen ? "Ocultar" : "Herramientas"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Map Viewport */}
        <main className="flex-1 relative w-full h-full" role="region" aria-label="Mapa interactivo de Voronoi">
          <MapContainer />
        </main>

        {/* Mobile floating toggle button when closed */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir panel de control"
            className="md:hidden absolute bottom-6 right-6 z-[1000] p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl flex items-center gap-2 border border-indigo-400/30"
          >
            <Layers size={18} />
            <span className="text-xs font-medium pr-1">{points.length}</span>
          </button>
        )}

        {/* Sidebar (Responsive: drawer in mobile, docked panel in desktop) */}
        <aside
          aria-label="Controles del mapa y puntos"
          className={`
            fixed md:relative top-13 bottom-0 right-0 z-30
            w-full sm:w-80 md:w-84
            border-l border-white/10 bg-[#0d1117]
            flex flex-col transition-transform duration-300 ease-in-out
            shadow-2xl md:shadow-none
            ${isSidebarOpen ? "translate-x-0" : "translate-x-full md:hidden"}
          `}
        >
          {/* Tabs bar */}
          <div className="flex border-b border-white/10 bg-white/[0.01]" role="tablist" aria-label="Secciones del panel">
            <button
              id="tab-points"
              role="tab"
              aria-selected={activeTab === "points"}
              aria-controls="panel-points"
              tabIndex={activeTab === "points" ? 0 : -1}
              onClick={() => setActiveTab("points")}
              className={`flex-1 py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === "points"
                  ? "text-white border-indigo-500 bg-white/[0.03]"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              <Layers size={14} />
              <span>Puntos</span>
              {points.length > 0 && (
                <span className="text-[10px] bg-white/10 text-gray-300 font-mono rounded-full px-1.5 py-0.2">
                  {points.length}
                </span>
              )}
            </button>

            <button
              id="tab-controls"
              role="tab"
              aria-selected={activeTab === "controls"}
              aria-controls="panel-controls"
              tabIndex={activeTab === "controls" ? 0 : -1}
              onClick={() => setActiveTab("controls")}
              className={`flex-1 py-3 px-3 text-xs font-medium flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === "controls"
                  ? "text-white border-indigo-500 bg-white/[0.03]"
                  : "text-gray-400 border-transparent hover:text-gray-200"
              }`}
            >
              <Sliders size={14} />
              <span>Proyecto</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div
              id="panel-points"
              role="tabpanel"
              aria-labelledby="tab-points"
              hidden={activeTab !== "points"}
            >
              {activeTab === "points" && <PointList />}
            </div>

            <div
              id="panel-controls"
              role="tabpanel"
              aria-labelledby="tab-controls"
              hidden={activeTab !== "controls"}
            >
              {activeTab === "controls" && <ProjectControls />}
            </div>
          </div>

          {/* Close drawer footer button for mobile */}
          <div className="md:hidden p-3 border-t border-white/10 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ver mapa</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
