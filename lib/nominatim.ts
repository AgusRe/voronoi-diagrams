export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
  type?: string;
  importance?: number;
}

export interface GeocodeResult {
  data: NominatimPlace[];
  error?: string;
  isRateLimited?: boolean;
}

// In-memory cache for recent queries to save bandwidth and strictly respect OSM quotas
const queryCache = new Map<string, NominatimPlace[]>();

// Rate-limiting timestamp: Ensure strictly >= 1000ms between network hits to the public OSM server
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100;

let activeAbortController: AbortController | null = null;

/**
 * Searches locations using the public OpenStreetMap Nominatim service.
 * Respects usage policies: rate limiting, caching, aborts, and clear error states.
 */
export async function searchLocation(query: string): Promise<GeocodeResult> {
  const cleanQuery = query.trim();

  if (cleanQuery.length < 3) {
    return { data: [] };
  }

  const cacheKey = cleanQuery.toLowerCase();
  if (queryCache.has(cacheKey)) {
    return { data: queryCache.get(cacheKey)! };
  }

  // Cancel any prior in-flight search request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();

  // Enforce the 1 request/second rule for the free Nominatim service
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLast));
  }

  lastRequestTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cleanQuery
    )}&format=json&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      signal: activeAbortController.signal,
      headers: {
        "Accept-Language": "es",
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      return {
        data: [],
        error: "Límite de consultas excedido. Por favor aguardá unos segundos antes de buscar de nuevo.",
        isRateLimited: true,
      };
    }

    if (!res.ok) {
      return {
        data: [],
        error: `Error del servicio de mapas (${res.status}). Intentá nuevamente más tarde.`,
      };
    }

    const data: NominatimPlace[] = await res.json();

    if (Array.isArray(data)) {
      queryCache.set(cacheKey, data);
      return { data };
    }

    return { data: [] };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Ignored: new search replaced this request
      return { data: [] };
    }

    return {
      data: [],
      error: "No fue posible conectar con el servicio de búsqueda. Comprobá tu conexión.",
    };
  } finally {
    activeAbortController = null;
  }
}
