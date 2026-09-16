# 🗺️ VoronoiMap — Análisis de Zonas de Influencia

Aplicación web profesional para visualización y análisis territorial interactivo mediante **diagramas de Voronoi** renderizados sobre mapas geoespaciales. Permite a negocios, analistas comerciales y planificadores urbanos delimitar con exactitud matemática las celdas de proximidad de sucursales, competidores y puntos de interés.

---

## 🚀 Inicio Rápido

### Requisitos previos
- **Node.js**: v20 o v22+
- **npm**: v10+

### Instalación
```bash
git clone https://github.com/AgusRe/voronoi-diagrams.git
cd voronoi-diagrams
npm install
```

### Ejecución en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Comandos disponibles
- `npm run dev`: Inicia el servidor de desarrollo Next.js.
- `npm run build`: Compila la aplicación para producción con Turbopack.
- `npm run start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta el análisis estático de código con ESLint.
- `npm test`: Ejecuta la suite de pruebas unitarias automatizadas con `tsx`.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework** | Next.js 16.2.7 (App Router) | Renderizado óptimo, tipado estricto y enrutamiento nativo |
| **Biblioteca UI** | React 19.2.4 & TypeScript 5 | Componentes reactivos, tipado sólido y control de estado |
| **Estilos** | Tailwind CSS v4 | Estética dark moderna, diseño responsive y alto contraste |
| **Mapa Base** | Leaflet 1.9.4 & React-Leaflet 5 | Motor cartográfico open-source sin claves de API requeridas |
| **Tiles Cartográficos** | CartoDB Dark Matter / OSM | Cartografía oscura estética de alto contraste |
| **Geometría** | `d3-delaunay` 6.0.4 | Triangulación 2D basada en Delaunator y polígonos de Voronoi |
| **Capa Gráfica** | HTML5 Canvas HiDPI | Renderizado fluido acelerado por GPU escalado por `devicePixelRatio` |
| **Gestión de Estado** | Zustand 5.0.14 | Estado predecible y persistencia local versionada |
| **Geocodificación** | Nominatim (OpenStreetMap) | Búsqueda geográfica en español con rate-limiting estricto |
| **Testing** | Node Test Runner & `tsx` | Pruebas unitarias de geometría, exportación y store |

---

## 📐 Arquitectura del Sistema

```
voronoi-diagrams/
├── app/
│   ├── layout.tsx              # Layout raíz con metadatos y fuente Inter
│   ├── page.tsx                # Landing page explicativa
│   ├── globals.css             # Directivas Tailwind v4 y estilos de Leaflet
│   └── map/
│       └── page.tsx            # Vista principal con workspace y drawer responsive
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx    # Proveedor Leaflet, eventos de click y centrado
│   │   ├── VoronoiOverlay.tsx  # Capa Canvas sincronizada con RAF y ResizeObserver
│   │   ├── PointMarker.tsx     # Marcadores circulares arrastrables
│   │   └── SearchBar.tsx       # Buscador con control de cuota y navegación por teclado
│   └── sidebar/
│       ├── PointList.tsx       # Lista interactiva, edición y detección de solapamiento
│       └── ProjectControls.tsx # Gestión de proyectos y exportación (PNG/CSV)
├── lib/
│   ├── voronoi.ts              # Motor matemático determinista (0, 1, 2, colineales)
│   ├── nominatim.ts            # Cliente Nominatim con caché LRU y AbortController
│   └── export.ts               # Generador CSV RFC 4180 con BOM UTF-8 y PNG offscreen
├── store/
│   └── useMapStore.ts          # Store Zustand con schemaVersion: 1 y UUIDs nativos
├── types/
│   └── index.ts                # Definiciones de tipos, categorías y utilidades
└── tests/
    ├── voronoi.test.ts         # Tests unitarios del motor Voronoi
    ├── export.test.ts          # Tests de formateo CSV y filenames
    ├── store.test.ts           # Tests de acciones del store y persistencia
    └── nominatim.test.ts       # Tests de validación de búsquedas
```

---

## ⚙️ Funcionamiento Técnico

### 1. Motor de Voronoi (`lib/voronoi.ts`)
- **Triangulación dual:** Utiliza `d3-delaunay`, basada internamente en el algoritmo Delaunator (divide and conquer / radial sweep en $O(n \log n)$).
- **Casos límite deterministas:**
  - **0 puntos:** Limpieza completa del canvas sin cómputos innecesarios.
  - **1 punto:** Llena el viewport con el color del punto y opacidad configurada, representando cobertura total.
  - **2 puntos:** Divide el plano mediante la mediatriz ortogonal calculada por `d3-delaunay`.
  - **Colineales / Degenerados:** Se renderizan como celdas perpendiculares recortadas exactamente al bounding box `[0, 0, width, height]`.
  - **Puntos coincidentes / duplicados:** Se preservan íntegramente los datos y coordenadas del usuario. Internamente, se aplica una perturbación infinitesimal ($< 10^{-4}$ px) exclusivamente a los sitios de Delaunay para evitar singularidades matemáticas sin alterar las coordenadas reales. La interfaz advierte al usuario si existen marcadores superpuestos.

### 2. Canvas HiDPI y Sincronización Cartográfica (`VoronoiOverlay.tsx`)
- **Nitidez en pantallas Retina:** Escala las dimensiones físicas del `<canvas>` por `window.devicePixelRatio` y ajusta la matriz de transformación 2D (`ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`).
- **Sincronización fluida:** Escucha los eventos `move`, `zoom`, `viewreset` y `resize` de Leaflet coordinados mediante `requestAnimationFrame`, evitando parpadeos y renders duplicados.
- **Ciclo de vida no destructivo:** El elemento canvas se mantiene bajo el control de React, eliminando manipulaciones manuales del DOM (`appendChild`).
- **`ResizeObserver`:** Reacciona instantáneamente a cambios de tamaño de ventana o al colapsar el panel lateral.

### 3. Marcadores e Interacción de Puntos
- Marcadores basados en `L.divIcon` estilizados sin assets externos.
- Arrastre (`draggable`) que actualiza la geometría tanto durante el movimiento como al soltar el cursor.
- Selección bidireccional: seleccionar o pasar el cursor por un punto resalta su celda de Voronoi y su elemento en el sidebar.
- Botón para centrar suavemente el mapa en el punto seleccionado.

### 4. Buscador Geográfico Responsable (`lib/nominatim.ts`, `SearchBar.tsx`)
- Conexión con el servicio público Nominatim de OpenStreetMap.
- **Control estricto de cuota:** Garantiza un intervalo mínimo de 1.1 segundos entre peticiones de red para respetar estrictamente las directivas de OSM.
- **Caché en memoria:** Evita repetir llamadas para términos consultados recientemente.
- **`AbortController`:** Cancela inmediatamente peticiones en curso al iniciar una nueva.
- **Navegación accesible por teclado:** Soporte para flechas Arriba/Abajo, `Enter` para seleccionar y `Escape` para cerrar.

### 5. Persistencia Segura (`store/useMapStore.ts`)
- Almacenamiento en `localStorage` con clave versionada (`schemaVersion: 1`).
- Migración y saneamiento automático ante datos corruptos o valores `NaN`.
- Generación de identificadores con `crypto.randomUUID()` nativo del navegador.
- Confirmación explícita para acciones destructivas (borrar puntos o eliminar proyectos).

### 6. Exportación de Datos (`lib/export.ts`)
- **CSV (RFC 4180):** Escapado formal de comas, comillas (`""`) y saltos de línea, con prefijo BOM UTF-8 (`\uFEFF`) para compatibilidad directa con Microsoft Excel en español.
- **PNG de Alta Resolución:** Renderizado determinista en un canvas offscreen a resolución 1600×1000px, con fondo dark temático, grilla de referencia, polígonos coloreados y etiquetas legibles. Nombres de archivo sanitizados para Windows, macOS y Linux.

---

## 📱 Diseño Responsive y Accesibilidad (a11y)
- **Desktop:** Layout de pantalla completa con visor cartográfico dominante y panel lateral de control.
- **Móvil / Tablet:** Panel deslizable (drawer) con botón flotante de acceso rápido y cabecera adaptable sin solapar controles.
- **Teclado y lectores de pantalla:** Atributos `aria-label`, roles de accesibilidad semánticos en pestañas (`tablist`, `tab`, `tabpanel`), combobox accesible en búsqueda y estados de foco visibles (`focus-visible`).

---

## 🔒 Limitaciones Conocidas y Alcance
- **Modo Offline:** El cálculo de Voronoi, la gestión de proyectos y la exportación funcionan 100% offline. La descarga de nuevos tiles del mapa base y las búsquedas con Nominatim requieren conexión a Internet.
- **Políticas de Tiles:** El mapa utiliza tiles de CartoDB/OpenStreetMap bajo términos de uso abiertos y atribución correspondiente visible en el visor.
