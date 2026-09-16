"use client";

import { useState } from "react";
import { useMapStore } from "@/store/useMapStore";
import {
  Save,
  Trash2,
  FolderOpen,
  Eye,
  EyeOff,
  ImageDown,
  FileDown,
  SlidersHorizontal,
  PlusCircle,
  AlertCircle,
  Check,
} from "lucide-react";
import { Project } from "@/types";
import {
  generatePointsCsv,
  downloadTextFile,
  sanitizeFilename,
  exportDiagramAsPng,
} from "@/lib/export";

export default function ProjectControls() {
  const points = useMapStore((state) => state.points);
  const projects = useMapStore((state) => state.projects);
  const currentProjectId = useMapStore((state) => state.currentProjectId);
  const currentProjectName = useMapStore((state) => state.currentProjectName);
  const isDirty = useMapStore((state) => state.isDirty);
  const showVoronoi = useMapStore((state) => state.showVoronoi);
  const voronoiOpacity = useMapStore((state) => state.voronoiOpacity);

  const saveProject = useMapStore((state) => state.saveProject);
  const loadProject = useMapStore((state) => state.loadProject);
  const deleteProject = useMapStore((state) => state.deleteProject);
  const setCurrentProjectName = useMapStore((state) => state.setCurrentProjectName);
  const createNewProject = useMapStore((state) => state.createNewProject);
  const setShowVoronoi = useMapStore((state) => state.setShowVoronoi);
  const setVoronoiOpacity = useMapStore((state) => state.setVoronoiOpacity);

  const [showProjectsList, setShowProjectsList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleSave = () => {
    const result = saveProject();
    if (result.success) {
      setFeedbackMsg(result.overwritten ? "Proyecto actualizado ✓" : "Proyecto guardado ✓");
      setTimeout(() => setFeedbackMsg(null), 2500);
    }
  };

  const handleExportCSV = () => {
    if (points.length === 0) return;
    const csvContent = generatePointsCsv(points);
    const safeName = sanitizeFilename(currentProjectName, "puntos-voronoi");
    downloadTextFile(csvContent, `${safeName}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportPNG = async () => {
    if (points.length === 0) return;
    setIsExportingPng(true);
    try {
      await exportDiagramAsPng({
        projectName: currentProjectName,
        points,
        opacity: voronoiOpacity,
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Project name and status */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="project-name-input"
            className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold"
          >
            Nombre del proyecto
          </label>
          {isDirty && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium">
              Cambios sin guardar
            </span>
          )}
        </div>
        <input
          id="project-name-input"
          type="text"
          value={currentProjectName}
          onChange={(e) => setCurrentProjectName(e.target.value)}
          aria-label="Nombre del proyecto"
          placeholder="Mi Proyecto"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder-gray-500"
        />
      </div>

      {/* Save, New & Projects catalog */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            id="save-project-btn"
            type="button"
            onClick={handleSave}
            disabled={points.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
          >
            {feedbackMsg ? (
              <>
                <Check size={14} className="text-emerald-300" />
                <span>{feedbackMsg}</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Guardar</span>
              </>
            )}
          </button>

          <button
            id="new-project-btn"
            type="button"
            onClick={() => createNewProject()}
            aria-label="Crear nuevo proyecto"
            title="Nuevo proyecto en blanco"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <PlusCircle size={15} />
          </button>

          <button
            id="load-project-btn"
            type="button"
            onClick={() => setShowProjectsList(!showProjectsList)}
            aria-label="Proyectos guardados"
            aria-expanded={showProjectsList}
            title="Ver proyectos guardados"
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs transition-all"
          >
            <FolderOpen size={14} />
            {projects.length > 0 && (
              <span className="text-[10px] bg-indigo-500/80 text-white font-medium rounded-full px-1.5 py-0.2">
                {projects.length}
              </span>
            )}
          </button>
        </div>

        {/* Projects dropdown list */}
        {showProjectsList && (
          <div
            role="region"
            aria-label="Lista de proyectos guardados"
            className="rounded-xl border border-white/10 bg-[#0d1117]/95 shadow-2xl overflow-hidden p-1 space-y-1"
          >
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-semibold border-b border-white/5 flex items-center justify-between">
              <span>Proyectos guardados</span>
              <span>{projects.length} total</span>
            </div>

            {projects.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-4">No hay proyectos guardados aún</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {projects.map((proj: Project) => (
                  <div
                    key={proj.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      currentProjectId === proj.id
                        ? "bg-indigo-500/20 border border-indigo-500/40 text-white"
                        : "hover:bg-white/5 text-gray-300 border border-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadProject(proj);
                        setShowProjectsList(false);
                      }}
                      className="flex-1 text-left truncate mr-2"
                    >
                      <span className="font-medium block truncate">{proj.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {proj.points.length} puntos • {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>
                    </button>

                    {projectToDelete === proj.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteProject(proj.id);
                            setProjectToDelete(null);
                          }}
                          className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-medium"
                        >
                          Borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(null)}
                          className="text-[10px] text-gray-400 px-1"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setProjectToDelete(proj.id)}
                        aria-label={`Eliminar proyecto ${proj.name}`}
                        className="p-1 text-gray-500 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Voronoi display options */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          aria-expanded={showSettings}
          className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <SlidersHorizontal size={13} />
            Ajustes del diagrama
          </span>
          <span className="text-[10px] text-gray-500">{showSettings ? "Ocultar" : "Mostrar"}</span>
        </button>

        {showSettings && (
          <div className="space-y-3 pt-2 bg-white/[0.02] border border-white/5 rounded-xl p-3">
            {/* Toggle visibility */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Mostrar polígonos</span>
              <button
                id="toggle-voronoi-btn"
                type="button"
                onClick={() => setShowVoronoi(!showVoronoi)}
                aria-label={showVoronoi ? "Ocultar Voronoi" : "Mostrar Voronoi"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  showVoronoi
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                {showVoronoi ? (
                  <>
                    <Eye size={13} /> Visible
                  </>
                ) : (
                  <>
                    <EyeOff size={13} /> Oculto
                  </>
                )}
              </button>
            </div>

            {/* Opacity slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="opacity-slider" className="text-xs text-gray-400">
                  Opacidad del relleno
                </label>
                <span className="text-[11px] font-mono text-gray-300 font-medium">
                  {Math.round(voronoiOpacity * 100)}%
                </span>
              </div>
              <input
                id="opacity-slider"
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={voronoiOpacity}
                onChange={(e) => setVoronoiOpacity(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Export section */}
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">
          Exportar datos
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="export-image-btn"
            type="button"
            onClick={handleExportPNG}
            disabled={points.length === 0 || isExportingPng}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-white/20"
          >
            <ImageDown size={14} className="text-indigo-400" />
            <span>{isExportingPng ? "Generando..." : "Imagen PNG"}</span>
          </button>

          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            disabled={points.length === 0}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-white/20"
          >
            <FileDown size={14} className="text-emerald-400" />
            <span>Datos CSV</span>
          </button>
        </div>

        {points.length === 0 && (
          <p className="text-[10px] text-gray-500 flex items-center gap-1 pt-1">
            <AlertCircle size={12} /> Agregá puntos al mapa para poder exportar.
          </p>
        )}
      </div>
    </div>
  );
}
