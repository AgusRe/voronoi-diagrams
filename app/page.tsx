import Link from "next/link";
import { MapPin, Zap, Target, Share2, ArrowRight, ShieldCheck, Compass } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Interacción directa y táctil",
    desc: "Hacé click o tocá cualquier punto del mapa para colocar un marcador. Arrastralo con fluidez para reposicionarlo en tiempo real.",
  },
  {
    icon: Zap,
    title: "Motor Voronoi determinista",
    desc: "Cálculo instantáneo con d3-delaunay recortado al viewport. Manejo robusto para 0, 1, 2, colineales y casos degenerados.",
  },
  {
    icon: Target,
    title: "Análisis de cobertura",
    desc: "Cada polígono delimita el área más cercana a cada punto. Esencial para estudios de geomarketing, sucursales y zonificación.",
  },
  {
    icon: Share2,
    title: "Exportación profesional",
    desc: "Descargá diagramas en PNG de alta resolución con fondo limpio y exportá tus puntos a CSV compatible con Excel (RFC 4180).",
  },
  {
    icon: ShieldCheck,
    title: "Persistencia sin riesgo",
    desc: "Proyectos guardados en tu navegador con versionado de esquema, protección ante datos corruptos y detección de duplicados.",
  },
  {
    icon: Compass,
    title: "Geocodificación responsable",
    desc: "Buscador integrado con OpenStreetMap Nominatim, control estricto de cuota, navegación por teclado y resultados en español.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen w-full bg-[#0d1117] text-white flex flex-col items-center selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="w-full border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
              <MapPin size={15} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">VoronoiMap</span>
          </div>
          <Link
            id="nav-map-btn"
            href="/map"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40"
          >
            <span>Abrir visor</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero Section — Centered across all screens */}
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <section className="w-full max-w-4xl px-6 py-20 flex flex-col items-center justify-center text-center mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3.5 py-1.5 rounded-full mb-8 font-medium">
            <Zap size={13} />
            <span>Geometría computacional interactiva</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
            Diagramas de Voronoi para{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              análisis territorial
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed font-normal">
            Definí puntos en el mapa y visualizá polígonos de proximidad en tiempo real. Analizá
            áreas de influencia, competencia y cobertura de sucursales con precisión matemática.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto justify-center items-center">
            <Link
              id="start-btn"
              href="/map"
              className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <span>Comenzar análisis</span>
              <ArrowRight size={15} />
            </Link>
            <a
              href="https://es.wikipedia.org/wiki/Pol%C3%ADgonos_de_Voronoi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto"
            >
              ¿Cómo funciona Voronoi?
            </a>
          </div>
        </section>

        {/* Feature Grid — Centered */}
        <section className="w-full max-w-5xl px-6 pb-24 mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.04] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-3.5">
                    <Icon size={16} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white text-sm font-semibold mb-1.5">{title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 px-6 py-5 text-center text-gray-500 text-xs mt-auto">
        <div className="max-w-6xl mx-auto">
          VoronoiMap • Desarrollado con Next.js, OpenStreetMap, Leaflet y d3-delaunay.
        </div>
      </footer>
    </main>
  );
}
