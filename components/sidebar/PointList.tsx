"use client";

import { useState } from "react";
import { useMapStore } from "@/store/useMapStore";
import { VoronoiPoint, CATEGORY_COLORS, CATEGORY_LABELS, PointCategory } from "@/types";
import { Trash2, Edit2, Check, X, MapPin, ChevronDown, ChevronUp } from "lucide-react";

interface PointItemProps {
  point: VoronoiPoint;
}

const PRESET_COLORS = [
  "#6366f1", "#ef4444", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#f43f5e", "#14b8a6",
  "#f97316", "#ec4899", "#84cc16", "#06b6d4",
];

function PointItem({ point }: PointItemProps) {
  const { updatePoint, removePoint, setHoveredPoint, setSelectedPoint, selectedPointId, hoveredPointId } = useMapStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(point.name);
  const [expanded, setExpanded] = useState(false);

  const isSelected = selectedPointId === point.id;
  const isHovered = hoveredPointId === point.id;

  const handleSave = () => {
    updatePoint(point.id, { name: editName.trim() || point.name });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setEditName(point.name); }
  };

  return (
    <div
      className={`
        rounded-xl border transition-all duration-200 overflow-hidden
        ${isSelected || isHovered
          ? "border-white/20 bg-white/5"
          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
        }
      `}
      onMouseEnter={() => setHoveredPoint(point.id)}
      onMouseLeave={() => setHoveredPoint(null)}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/20"
          style={{ backgroundColor: point.color }}
        />

        {/* Name / Edit */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/10 text-white text-sm px-2 py-0.5 rounded border border-indigo-500/50 outline-none"
            />
          ) : (
            <button
              className="text-left w-full text-sm text-white/90 truncate hover:text-white transition-colors"
              onClick={() => setSelectedPoint(isSelected ? null : point.id)}
            >
              {point.name}
            </button>
          )}
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            {CATEGORY_LABELS[point.category]}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="p-1 text-green-400 hover:text-green-300 transition-colors">
                <Check size={13} />
              </button>
              <button onClick={() => { setEditing(false); setEditName(point.name); }} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <button onClick={() => removePoint(point.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3">
          {/* Category */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Categoría</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {(Object.entries(CATEGORY_LABELS) as [PointCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => updatePoint(point.id, { category: key, color: CATEGORY_COLORS[key] })}
                  className={`
                    text-[11px] px-2.5 py-1 rounded-full border transition-all
                    ${point.category === key
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Color</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updatePoint(point.id, { color })}
                  className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${point.color === color ? "ring-2 ring-white ring-offset-1 ring-offset-[#0d1117]" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Coords */}
          <div className="text-[10px] text-gray-600 font-mono">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PointList() {
  const { points, clearPoints } = useMapStore();

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MapPin className="text-gray-700 mb-3" size={32} />
        <p className="text-gray-500 text-sm">Todavía no hay puntos</p>
        <p className="text-gray-600 text-xs mt-1">Hacé click en el mapa para agregar</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{points.length} punto{points.length !== 1 ? "s" : ""}</span>
        <button
          onClick={clearPoints}
          className="text-[11px] text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <Trash2 size={11} /> Limpiar todo
        </button>
      </div>
      {points.map((point) => (
        <PointItem key={point.id} point={point} />
      ))}
    </div>
  );
}
