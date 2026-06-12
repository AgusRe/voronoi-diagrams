import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VoronoiMap — Análisis de Zonas de Influencia",
  description:
    "Herramienta interactiva para visualizar diagramas de Voronoi sobre mapas reales. Ideal para negocios que quieren analizar sus zonas de influencia y optimizar su publicidad.",
  keywords: ["voronoi", "mapa", "zonas de influencia", "análisis geográfico", "marketing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-[#0d1117] text-white antialiased">{children}</body>
    </html>
  );
}
