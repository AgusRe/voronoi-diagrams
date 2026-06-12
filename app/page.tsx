import Link from "next/link";
import { MapPin, Zap, Target, Share2, ArrowRight } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Click para agregar",
    desc: "Hacé click en cualquier punto del mapa para agregar un marcador. Arrastralo para reposicionarlo.",
  },
  {
    icon: Zap,
    title: "Voronoi instantáneo",
    desc: "El diagrama se recalcula en tiempo real a medida que agregás, movés o eliminás puntos.",
  },
  {
    icon: Target,
    title: "Zonas de influencia",
    desc: "Cada celda representa el área geográfica más cercana a ese punto. Ideal para análisis de cobertura.",
  },
  {
    icon: Share2,
    title: "Exportá tu análisis",
    desc: "Descargá el mapa como imagen PNG o exportá los puntos en CSV para usar en otros análisis.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <MapPin size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">VoronoiMap</span>
        </div>
        <Link
          href="/map"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Abrir mapa <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <Zap size={11} />
          Análisis geográfico interactivo
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
          Visualizá zonas de{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            influencia
          </span>{" "}
          en el mapa
        </h1>

        <p className="text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          Colocá puntos sobre el mapa y obtené un diagrama de Voronoi en tiempo real.
          Perfecto para negocios que quieren analizar cobertura y optimizar publicidad.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            id="start-btn"
            href="/map"
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            Comenzar ahora <ArrowRight size={16} />
          </Link>
          <a
            href="https://en.wikipedia.org/wiki/Voronoi_diagram"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-8 py-3.5 rounded-xl font-medium transition-all"
          >
            ¿Qué es Voronoi?
          </a>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all"
            >
              <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                <Icon size={18} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-4 text-center text-gray-700 text-xs">
        VoronoiMap — Powered by Google Maps & d3-delaunay
      </footer>
    </main>
  );
}
