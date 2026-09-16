"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Search, X, Loader2, AlertCircle, MapPin } from "lucide-react";
import { searchLocation, NominatimPlace } from "@/lib/nominatim";

export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setResults([]);
      setShowDropdown(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedIndex(-1);

    const res = await searchLocation(q);

    setIsLoading(false);
    if (res.error) {
      setErrorMessage(res.error);
      setResults([]);
      setShowDropdown(true);
    } else {
      setResults(res.data);
      setShowDropdown(true);
    }
  }, []);

  const handleSelect = useCallback(
    (place: NominatimPlace) => {
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);
      const bb = place.boundingbox;

      if (bb && bb.length === 4) {
        const south = parseFloat(bb[0]);
        const north = parseFloat(bb[1]);
        const west = parseFloat(bb[2]);
        const east = parseFloat(bb[3]);
        map.fitBounds([
          [south, west],
          [north, east],
        ]);
      } else {
        map.setView([lat, lon], 14);
      }

      setQuery(place.display_name.split(",")[0]);
      setShowDropdown(false);
      setResults([]);
      setErrorMessage(null);
      setSelectedIndex(-1);
    },
    [map]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      } else {
        executeSearch(query);
      }
      return;
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setErrorMessage(null);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        {/* Search icon / loader button */}
        <button
          type="button"
          onClick={() => executeSearch(query)}
          aria-label="Buscar ubicación"
          className="absolute left-3.5 z-10 text-gray-400 hover:text-white transition-colors"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-indigo-400" />
          ) : (
            <Search size={16} />
          )}
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          id="map-search-input"
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="search-results-list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0 || errorMessage) setShowDropdown(true);
          }}
          placeholder="Buscá una ciudad, barrio o dirección y presioná Enter..."
          className="
            w-full pl-10 pr-16 py-2.5 rounded-xl
            bg-[#0d1117]/95 backdrop-blur-md
            border border-white/10
            text-white text-xs placeholder-gray-500
            outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40
            shadow-2xl transition-all duration-200
          "
        />

        {/* Clear & Submit buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="p-1 text-gray-400 hover:text-white transition-colors rounded"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => executeSearch(query)}
            disabled={isLoading || query.trim().length < 3}
            className="px-2 py-1 bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium text-white rounded-md transition-colors"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div
          id="search-results-list"
          role="listbox"
          className="absolute top-full mt-1.5 w-full bg-[#0d1117]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
        >
          {errorMessage && (
            <div className="p-3 text-xs text-rose-300 flex items-start gap-2 bg-rose-500/10">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!errorMessage && results.length === 0 && !isLoading && (
            <div className="p-4 text-center text-xs text-gray-400">
              No se encontraron resultados para &ldquo;{query}&rdquo;.
            </div>
          )}

          {!errorMessage &&
            results.map((r, idx) => {
              const isSelected = idx === selectedIndex;
              const primary = r.display_name.split(",")[0];
              const secondary = r.display_name.split(",").slice(1).join(",").trim();

              return (
                <div
                  key={r.place_id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(r)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`
                    px-3.5 py-2.5 cursor-pointer border-t border-white/5 first:border-t-0 transition-colors flex items-start gap-2.5
                    ${isSelected ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"}
                  `}
                >
                  <MapPin size={14} className="flex-shrink-0 mt-0.5 text-indigo-400" />
                  <div className="min-w-0 flex-1">
                    <span className="text-white text-xs font-medium block truncate">
                      {primary}
                    </span>
                    {secondary && (
                      <span className="text-gray-400 text-[10px] block truncate mt-0.5">
                        {secondary}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
