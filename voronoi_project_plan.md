# 🗺️ Voronoi Diagrams — Planificación y Especificación Técnica del Proyecto

## Visión General

Aplicación web interactiva de alto rendimiento que permite analizar y visualizar **diagramas de Voronoi** sobre un mapa geoespacial real para optimizar cobertura comercial, zonas de influencia y análisis territorial.

---

## 🎯 Objetivo del Producto

Permitir a comercios y analistas territoriales:
1. Buscar ubicaciones mediante geocodificación abierta con Nominatim.
2. Colocar y arrastrar puntos interactivos (locales propios, competencia, zonas de interés).
3. Obtener el diagrama de Voronoi recalculado en tiempo real sobre un Canvas HiDPI acelerado.
4. Identificar visualmente las células de proximidad más cercanas a cada punto.
5. Guardar proyectos localmente con versionado y exportar informes en CSV (RFC 4180) e imágenes PNG de alta resolución.

---

## 🧱 Stack Tecnológico Real

### Frontend & Core
| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.2.7 | Framework web React con Turbopack y App Router |
| **React** | 19.2.4 | Renderizado reactivo y ciclo de vida de componentes |
| **TypeScript** | 5.x | Tipado estático y contratos estrictos de datos |
| **Tailwind CSS** | 4.x | Sistema de estilos moderno y diseño responsive dark |

### Cartografía y Geometría
| Tecnología | Versión | Rol |
|---|---|---|
| **Leaflet** | 1.9.4 | Motor de mapa interactivo |
| **react-leaflet** | 5.0.0 | Integración declarativa de Leaflet en React 19 |
| **Tiles Base** | CartoDB Dark Matter | Mapas oscuros de alto contraste basados en datos de OpenStreetMap |
| **`d3-delaunay`** | 6.0.4 | Triangulación 2D y polígonos de Voronoi basada en el algoritmo Delaunator |
| **HTML5 Canvas** | Nativo | Renderizado gráfico sincronizado con escalado `devicePixelRatio` |

### Estado, Persistencia y Red
| Tecnología | Versión | Rol |
|---|---|---|
| **Zustand** | 5.0.14 | Store global con middleware `persist` y `schemaVersion: 1` |
| **Web Crypto API** | Nativa | Generación de identificadores únicos con `crypto.randomUUID()` |
| **Nominatim API** | OpenStreetMap | Geocodificador con rate limit mínimo de 1.1s y caché en memoria |
| **Testing** | Node 22 + `tsx` | Pruebas unitarias de geometría, exportación y store |

---

## 🏗️ Estructura del Código

```
voronoi-diagrams/
├── app/
│   ├── layout.tsx              # Estructura HTML base y fuente Inter
│   ├── page.tsx                # Landing page de presentación
│   ├── globals.css             # Estilos globales y overrides de Leaflet
│   └── map/
│       └── page.tsx            # Página de la aplicación con layout responsive
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx    # Contenedor Leaflet y despachador de eventos
│   │   ├── VoronoiOverlay.tsx  # Capa Canvas con soporte HiDPI y RAF
│   │   ├── PointMarker.tsx     # Marcadores circulares interactivos
│   │   └── SearchBar.tsx       # Buscador con control de cuota y navegación por teclado
│   └── sidebar/
│       ├── PointList.tsx       # Gestión y edición de puntos con alerta de superposición
│       └── ProjectControls.tsx # Guardado, carga y exportación de proyectos
├── lib/
│   ├── voronoi.ts              # Algoritmo de Voronoi determinista (0, 1, 2, colineales)
│   ├── nominatim.ts            # Cliente Nominatim con control de cuotas y cancelación
│   └── export.ts               # Exportación RFC 4180 CSV con UTF-8 BOM y PNG offscreen
├── store/
│   └── useMapStore.ts          # Store de Zustand con validación y schema versionado
├── types/
│   └── index.ts                # Interfaces de puntos, proyectos y categorías
└── tests/
    ├── voronoi.test.ts         # Tests unitarios del motor Voronoi
    ├── export.test.ts          # Tests de generación CSV y nombres de archivo
    ├── store.test.ts           # Tests de mutación y persistencia de Zustand
    └── nominatim.test.ts       # Tests del cliente de búsqueda
```

---

## 📐 Algoritmo de Voronoi y Comportamiento Matemático

1. **Triangulación dual:** Basada en **Delaunator**, que calcula la triangulación de Delaunay en $O(n \log n)$ mediante divide y vencerás / radial sweep.
2. **Casos especiales resueltos:**
   - **0 puntos:** Limpieza limpia del canvas.
   - **1 punto:** Rectángulo que ocupa la totalidad del viewport con el color asignado.
   - **2 puntos:** Semiplanos separados por la mediatriz perpendicular.
   - **Colineales:** Franjas ortogonales a la recta directriz recortadas al bounding box.
   - **Puntos duplicados o coincidentes:** Se mantiene cada punto del usuario de forma íntegra. Para el cómputo de Delaunay se aplica un micro-jitter determinista ($< 10^{-4}$ px) que previene singularidades sin alterar las coordenadas del usuario, y la UI notifica la existencia de puntos superpuestos.

---

## 🚀 Verificación y Validación

Comandos automatizados de verificación:
- **Lint**: `npm run lint` (0 errores, 0 warnings).
- **Pruebas Unitarias**: `npm test` (27 pruebas en verde).
- **Compilación de Producción**: `npm run build` (Turbopack + TypeScript exitoso).
