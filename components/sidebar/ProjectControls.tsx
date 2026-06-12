"use client";

import { useState, useRef } from "react";
import { useMapStore } from "@/store/useMapStore";
import {
  Save, Download, Trash2, FolderOpen, Eye, EyeOff,
  ImageDown, FileDown, SlidersHorizontal
} from "lucide-react";
import { Project } from "@/types";

export default function ProjectControls() {
  const {
    points,
    projects,
    currentProjectName,
    showVoronoi,
    voronoiOpacity,
    saveProject,
    loadProject,
    deleteProject,
    setCurrentProjectName,
    setShowVoronoi,
    setVoronoiOpacity,
    clearPoints,
  } = useMapStore();

  const [showProjects, setShowProjects] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const handleSave = () => {
    saveProject();
    setSaveMsg("Guardado ✓");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleExportImage = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `voronoi-${currentProjectName.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Categoría", "Latitud", "Longitud", "Color"];
    const rows = points.map((p) => [p.name, p.category, p.lat, p.lng, p.color]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProjectName.replace(/\s+/g, "-")}-puntos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Project name */}
      <div>
        <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">
          Nombre del proyecto
        </label>
        <input
          id="project-name-input"
          value={currentProjectName}
          onChange={(e) => setCurrentProjectName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
          placeholder="Mi Proyecto"
        />
      </div>

      {/* Save & Load */}
      <div className="flex gap-2">
        <button
          id="save-project-btn"
          onClick={handleSave}
          disabled={points.length === 0}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-all"
        >
          <Save size={14} />
          {saveMsg || "Guardar"}
        </button>
        <button
          id="load-project-btn"
          onClick={() => setShowProjects(!showProjects)}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm transition-all"
        >
          <FolderOpen size={14} />
          {projects.length > 0 && (
            <span className="text-xs bg-indigo-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {projects.length}
            </span>
          )}
        </button>
      </div>

      {/* Projects list */}
      {showProjects && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {projects.length === 0 ? (
            <p className="text-center text-gray-600 text-xs py-4">No hay proyectos guardados</p>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {projects.map((project: Project) => (
                <div key={project.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 border-b border-white/5 last:border-0">
                  <button
                    className="flex-1 text-left text-sm text-gray-300 hover:text-white transition-colors truncate"
                    onClick={() => { loadProject(project); setShowProjects(false); }}
                  >
                    {project.name}
                    <span className="block text-[10px] text-gray-600">
                      {project.points.length} puntos
                    </span>
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Voronoi controls */}
      <div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors w-full"
        >
          <SlidersHorizontal size={12} />
          Opciones del diagrama
        </button>

        {showSettings && (
          <div className="mt-2 space-y-3">
            {/* Toggle visibility */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Mostrar Voronoi</span>
              <button
                id="toggle-voronoi-btn"
                onClick={() => setShowVoronoi(!showVoronoi)}
                className={`p-1.5 rounded-lg transition-colors ${showVoronoi ? "text-indigo-400 bg-indigo-500/10" : "text-gray-600 bg-white/5"}`}
              >
                {showVoronoi ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            {/* Opacity slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Opacidad</span>
                <span className="text-xs text-gray-600">{Math.round(voronoiOpacity * 100)}%</span>
              </div>
              <input
                id="opacity-slider"
                type="range"
                min="0.05"
                max="0.9"
                step="0.05"
                value={voronoiOpacity}
                onChange={(e) => setVoronoiOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Export */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-500 uppercase tracking-wider">Exportar</label>
        <div className="flex gap-2">
          <button
            id="export-image-btn"
            onClick={handleExportImage}
            disabled={points.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ImageDown size={13} /> PNG
          </button>
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={points.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={13} /> CSV
          </button>
        </div>
      </div>
    </div>
  );
}
