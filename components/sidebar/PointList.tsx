"use client";

import { useState, useMemo } from "react";
import { useMapStore } from "@/store/useMapStore";
import { VoronoiPoint, CATEGORY_COLORS, CATEGORY_LABELS, PointCategory, DEFAULT_COLOR_PALETTE } from "@/types";
import { findOverlappingPoints, PixelPoint } from "@/lib/voronoi";
import {
  Trash2,
  Edit2,
  Check,
  X,
  MapPin,
  ChevronDown,
  ChevronUp,
  Crosshair,
  AlertTriangle,
} from "lucide-react";

interface PointItemProps {
  point: VoronoiPoint;
  isOverlapping: boolean;
}

function PointItem({ point, isOverlapping }: PointItemProps) {
  const updatePoint = useMapStore((state) => state.updatePoint);
  const removePoint = useMapStore((state) => state.removePoint);
  const setHoveredPoint = useMapStore((state) => state.setHoveredPoint);
  const setSelectedPoint = useMapStore((state) => state.setSelectedPoint);
  const selectedPointId = useMapStore((state) => state.selectedPointId);
  const hoveredPointId = useMapStore((state) => state.hoveredPointId);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(point.name);
  const [expanded, setExpanded] = useState(false);

  const isSelected = selectedPointId === point.id;
  const isHovered = hoveredPointId === point.id;

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      updatePoint(point.id, { name: trimmed });
    } else {
      setEditName(point.name);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setEditName(point.name);
    }
  };

  const handleCenterOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("voronoi:fly-to", {
          detail: { lat: point.lat, lng: point.lng },
        })
      );
    }
  };

  return (
    <div
      role="listitem"
      className={`
        rounded-xl border transition-all duration-200 overflow-hidden
        ${
          isSelected
            ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
            : isHovered
            ? "border-white/20 bg-white/5"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
        }
      `}
      onMouseEnter={() => setHoveredPoint(point.id)}
      onMouseLeave={() => setHoveredPoint(null)}
    >
      {/* Main row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Color dot */}
        <div
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white/20 shadow-sm"
          style={{ backgroundColor: point.color }}
          title={`Color: ${point.color}`}
        />

        {/* Name / Edit */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Editar nombre del punto"
              className="w-full bg-black/40 text-white text-xs px-2 py-1 rounded border border-indigo-500/60 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            <button
              type="button"
              className="text-left w-full text-xs font-medium text-white/90 truncate hover:text-white transition-colors block"
              onClick={() => setSelectedPoint(isSelected ? null : point.id)}
            >
              {point.name}
            </button>
          )}

          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-gray-400">
              {CATEGORY_LABELS[point.category]}
            </span>
            {isOverlapping && (
              <span
                className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 font-medium bg-amber-400/10 px-1.5 py-0.2 rounded"
                title="Este punto comparte coordenadas con otro marcador"
              >
                <AlertTriangle size={9} /> Superpuesto
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                aria-label="Guardar nombre"
                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-white/5 rounded transition-colors"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setEditName(point.name);
                }}
                aria-label="Cancelar edición"
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCenterOnMap}
                aria-label="Centrar en mapa"
                title="Centrar en el mapa"
                className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
              >
                <Crosshair size={13} />
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="Renombrar punto"
                title="Renombrar"
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
              >
                <Edit2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "Colapsar detalles" : "Expandir detalles"}
                aria-expanded={expanded}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <button
                type="button"
                onClick={() => removePoint(point.id)}
                aria-label={`Eliminar ${point.name}`}
                title="Eliminar punto"
                className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-2 border-t border-white/5 space-y-2.5 bg-black/20">
          {/* Category */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">
              Categoría
            </label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Categoría del punto">
              {(Object.entries(CATEGORY_LABELS) as [PointCategory, string][]).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  role="radio"
                  aria-checked={point.category === key}
                  onClick={() => updatePoint(point.id, { category: key, color: CATEGORY_COLORS[key] })}
                  className={`
                    text-[10px] px-2.5 py-1 rounded-md border transition-all font-medium
                    ${
                      point.category === key
                        ? "border-indigo-500/60 bg-indigo-500/20 text-white"
                        : "border-white/10 text-gray-400 hover:text-gray-200 hover:border-white/20"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">
              Color del punto
            </label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color del punto">
              {DEFAULT_COLOR_PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  role="radio"
                  aria-checked={point.color === c}
                  aria-label={`Color ${c}`}
                  onClick={() => updatePoint(point.id, { color: c })}
                  className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border ${
                    point.color === c ? "border-white scale-110 shadow-md" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Geographic Coordinates */}
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono pt-1 border-t border-white/5">
            <span>Lat: {point.lat.toFixed(5)}</span>
            <span>Lng: {point.lng.toFixed(5)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PointList() {
  const points = useMapStore((state) => state.points);
  const clearPoints = useMapStore((state) => state.clearPoints);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Identify overlapping points without mutating user coordinates
  const overlappingIds = useMemo(() => {
    const pixelLikePoints: PixelPoint[] = points.map((p) => ({
      x: p.lat * 1000,
      y: p.lng * 1000,
      id: p.id,
      color: p.color,
      name: p.name,
    }));
    return findOverlappingPoints(pixelLikePoints, 0.05);
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
          <MapPin className="text-gray-500" size={24} />
        </div>
        <p className="text-gray-300 text-sm font-medium">No hay puntos colocados</p>
        <p className="text-gray-500 text-xs mt-1 max-w-[200px] leading-relaxed">
          Hacé click en cualquier lugar del mapa para agregar tus primeros puntos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with counter and clear action */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">{points.length}</span>
          <span className="text-xs text-gray-400">
            {points.length === 1 ? "punto registrado" : "puntos registrados"}
          </span>
        </div>

        {showConfirmClear ? (
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
            <span className="text-[10px] text-rose-300">¿Borrar todos?</span>
            <button
              type="button"
              onClick={() => {
                clearPoints();
                setShowConfirmClear(false);
              }}
              className="text-[10px] text-rose-400 hover:text-white font-medium px-1"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="text-[10px] text-gray-400 hover:text-white px-1"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmClear(true)}
            className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5"
            aria-label="Limpiar todos los puntos"
          >
            <Trash2 size={11} /> Limpiar todo
          </button>
        )}
      </div>

      {/* Notice if overlapping points are detected */}
      {overlappingIds.size > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-300"
        >
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-amber-400" />
          <div>
            <p className="font-medium">Puntos superpuestos detectados</p>
            <p className="text-[10px] text-amber-300/80 mt-0.5 leading-snug">
              Hay {overlappingIds.size} puntos compartiendo la misma ubicación. Se mantienen intactos y calculados
              sin colisiones.
            </p>
          </div>
        </div>
      )}

      {/* List of items */}
      <div role="list" className="space-y-2">
        {points.map((point) => (
          <PointItem
            key={point.id}
            point={point}
            isOverlapping={overlappingIds.has(point.id)}
          />
        ))}
      </div>
    </div>
  );
}
