"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Search, X } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
}

/**
 * Search bar using Nominatim (OpenStreetMap geocoder).
 * Free, no API key required. Debounced at 500ms to respect rate limits.
 */
export default function SearchBar() {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=0`,
        { headers: { "Accept-Language": "es" } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 500);
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const bb = result.boundingbox;

    if (bb && bb.length === 4) {
      map.fitBounds([
        [parseFloat(bb[0]), parseFloat(bb[2])],
        [parseFloat(bb[1]), parseFloat(bb[3])],
      ]);
    } else {
      map.setView([lat, lon], 14);
    }

    setQuery(result.display_name.split(",").slice(0, 2).join(","));
    setShowResults(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 pointer-events-none">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
        </div>

        <input
          id="map-search-input"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Buscá una ciudad, barrio o dirección..."
          className="
            w-full pl-9 pr-9 py-3 rounded-xl
            bg-[#0d1117]/90 backdrop-blur-md
            border border-white/10
            text-white text-sm placeholder-gray-500
            outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30
            shadow-2xl transition-all duration-200
          "
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <ul className="absolute top-full mt-1 w-full bg-[#0d1117]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((r) => (
            <li
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer border-t border-white/5 first:border-t-0 transition-colors"
            >
              <span className="text-white font-medium">{r.display_name.split(",")[0]}</span>
              <span className="text-gray-500 text-xs block truncate">
                {r.display_name.split(",").slice(1).join(",").trim()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
