"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import PointList from "@/components/sidebar/PointList";
import ProjectControls from "@/components/sidebar/ProjectControls";
import { useState } from "react";

// MapContainer must be dynamically imported (no SSR) because it uses browser APIs
const MapContainer = dynamic(() => import("@/components/map/MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#0d1117]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Iniciando mapa...</p>
      </div>
    </div>
  ),
});

type SidebarTab = "points" | "controls";

export default function MapPage() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("points");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d1117]">
      {/* Top bar */}
      <header className="h-12 border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <Link
          href="/"
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          title="Inicio"
        >
          <Home size={15} />
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
            <MapPin size={11} className="text-white" />
          </div>
          <span className="text-white text-sm font-medium">VoronoiMap</span>
        </div>
        <div className="ml-auto text-xs text-gray-600">
          Hacé click en el mapa para agregar puntos
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer />
        </div>

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-white/5 bg-[#0d1117] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              id="tab-points"
              onClick={() => setActiveTab("points")}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === "points"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Puntos
            </button>
            <button
              id="tab-controls"
              onClick={() => setActiveTab("controls")}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === "controls"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Proyecto
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "points" ? <PointList /> : <ProjectControls />}
          </div>
        </aside>
      </div>
    </div>
  );
}
