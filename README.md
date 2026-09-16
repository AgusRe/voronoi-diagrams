# 🗺️ VoronoiMap — Análisis de Zonas de Influencia

Aplicación web profesional para visualización y análisis territorial interactivo mediante **diagramas de Voronoi** renderizados sobre mapas geoespaciales. Permite a comercios, analistas de geomarketing y planificadores urbanos delimitar con exactitud matemática las celdas de proximidad de sucursales, competidores y puntos de interés.

100% gratuita, de código abierto y sin necesidad de claves de API de terceros.

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

### Comandos de gestión y verificación
- `npm run dev`: Inicia el servidor local de desarrollo con recarga en caliente.
- `npm run build`: Genera el build optimizado de producción con Turbopack y verificación de tipos TypeScript.
- `npm run start`: Inicia el servidor de producción.
- `npm run lint`: Ejecuta el análisis estático de código con ESLint (0 advertencias, 0 errores).
- `npm test`: Ejecuta la suite de pruebas unitarias automatizadas con `tsx` y el runner nativo de Node.js.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología | Justificación y Rol |
|---|---|---|
| **Framework** | Next.js 16.2.7 (App Router) | Renderizado óptimo, tipado estricto y Turbopack para compilaciones ultra rápidas |
| **Biblioteca UI** | React 19.2.4 & TypeScript 5 | Componentes reactivos, tipado sólido y control de estado |
| **Estilos** | Tailwind CSS v4 | Estética dark moderna, diseño responsive y tokens de alto contraste |
| **Motor Cartográfico** | Leaflet 1.9.4 & React-Leaflet 5 | Cartografía interactiva open-source sin dependencias propietarias |
| **Tiles Base** | OpenStreetMap (OSM) | Capa cartográfica libre y gratuita; estilizada mediante CSS dark mode (cero API keys) |
| **Geometría** | `d3-delaunay` 6.0.4 | Triangulación 2D basada en Delaunator y polígonos de Voronoi ($O(n \log n)$) |
| **Capa Gráfica** | HTML5 Canvas HiDPI | Renderizado fluido acelerado por GPU con compensación de `devicePixelRatio` |
| **Gestión de Estado** | Zustand 5.0.14 | Estado predecible y persistencia local versionada (`schemaVersion: 1`) |
| **Geocodificación** | Nominatim (OpenStreetMap) | Búsqueda geográfica en español con control de cuotas estricto y cancelación |
| **Testing** | Node Test Runner & `tsx` | Suite unitaria sin dependencias pesadas para geometría, exportación y store |

---

## 📐 Arquitectura del Repositorio

```
voronoi-diagrams/
├── app/
│   ├── layout.tsx              # Layout raíz con metadatos y fuente Inter
│   ├── page.tsx                # Landing page centrada y explicativa
│   ├── globals.css             # Directivas Tailwind v4, scrollbars y filtro .dark-mode-tiles
│   └── map/
│       └── page.tsx            # Espacio de trabajo del mapa con drawer responsive
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx    # Proveedor Leaflet con OSM y despachador de eventos
│   │   ├── VoronoiOverlay.tsx  # Capa Canvas sincronizada con RAF y ResizeObserver
│   │   ├── PointMarker.tsx     # Marcadores circulares arrastrables con estilos reactivos
│   │   └── SearchBar.tsx       # Buscador accesible con control de cuota y teclado
│   └── sidebar/
│       ├── PointList.tsx       # Lista de puntos, edición, centrado y alerta de solapamiento
│       └── ProjectControls.tsx # Gestión de proyectos y exportación (PNG/CSV)
├── lib/
│   ├── voronoi.ts              # Motor matemático determinista (0, 1, 2, colineales y coincidentes)
│   ├── nominatim.ts            # Cliente Nominatim con control de 1.1s, caché y AbortController
│   └── export.ts               # Generador CSV RFC 4180 con BOM UTF-8 y PNG offscreen en 2K
├── store/
│   └── useMapStore.ts          # Store Zustand con schemaVersion: 1, colores aleatorios y UUIDs
├── types/
│   └── index.ts                # Tipos TypeScript, paletas de colores y generador de UUIDs
└── tests/
    ├── voronoi.test.ts         # Tests unitarios del motor Voronoi
    ├── export.test.ts          # Tests de formateo CSV RFC 4180 y filenames
    ├── store.test.ts           # Tests de acciones del store y persistencia
    └── nominatim.test.ts       # Tests de validación del servicio de búsqueda
```

---

## ⚙️ Principios Técnicos y Características Clave

### 1. Motor de Voronoi Determinista (`lib/voronoi.ts`)
- **Triangulación dual:** Utiliza `d3-delaunay`, basada internamente en el algoritmo Delaunator (divide and conquer / radial sweep en $O(n \log n)$).
- **Casos límite controlados:**
  - **0 puntos:** Limpieza limpia del canvas sin cómputos innecesarios.
  - **1 punto:** Llena el viewport con el color del punto y la opacidad configurada, representando cobertura territorial total.
  - **2 puntos:** Divide el plano mediante la mediatriz ortogonal calculada por `d3-delaunay`.
  - **Colineales / Casos degenerados:** Se renderizan como celdas perpendiculares recortadas al bounding box exacto `[0, 0, width, height]`.
  - **Puntos superpuestos / duplicados:** Se preservan íntegramente los datos y coordenadas del usuario. Se aplica un micro-jitter determinista ($< 10^{-4}$ px) exclusivamente a los sitios de Delaunay para evitar singularidades matemáticas sin alterar las coordenadas reales. La interfaz notifica al usuario si existen marcadores superpuestos.

### 2. Colores Dinámicos y Aleatorios por Punto
- Cada nuevo punto colocado sobre el mapa recibe automáticamente un color vibrante aleatorio de una paleta optimizada (`DEFAULT_COLOR_PALETTE`).
- El algoritmo evita repetir el color del último punto colocado, ofreciendo variedad visual inmediata sin requerir configuración manual.
- El usuario puede modificar el color y categoría de cualquier punto en cualquier momento desde el panel lateral.

### 3. Canvas HiDPI y Sincronización Cartográfica (`VoronoiOverlay.tsx`)
- **Nitidez en pantallas Retina:** Escala las dimensiones físicas del `<canvas>` por `window.devicePixelRatio` y ajusta la matriz de transformación 2D (`ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`).
- **Sincronización suave:** Escucha los eventos `move`, `zoom`, `viewreset` y `resize` de Leaflet coordinados mediante `requestAnimationFrame`, evitando parpadeos y renders duplicados.
- **Ciclo de vida integrado:** El canvas se monta dentro del árbol de componentes de React, eliminando manipulaciones manuales del DOM (`appendChild`).
- **`ResizeObserver`:** Reacciona instantáneamente a cambios de tamaño de ventana o al colapsar el panel lateral.

### 4. Cartografía Libre y Sin API Keys
- Utiliza **OpenStreetMap estándar** (`tile.openstreetmap.org`).
- Aplica el filtro CSS `.dark-mode-tiles` en [app/globals.css](file:///c:/Users/agust/OneDrive/Escritorio/Coderhouse/voronoi-diagrams/app/globals.css) para lograr una estética oscura de alto contraste (`#0d1117`) sin depender de servicios pagos ni requerir claves de API.
- Cero marcas de agua y disponibilidad permanente.

### 5. Buscador Geográfico Responsable (`lib/nominatim.ts`, `SearchBar.tsx`)
- Conexión con el servicio público Nominatim de OpenStreetMap.
- **Control estricto de cuota:** Garantiza un intervalo mínimo de 1.1 segundos entre peticiones de red para respetar estrictamente las directivas de OSM.
- **Caché en memoria:** Evita repetir llamadas para términos consultados recientemente.
- **`AbortController`:** Cancela inmediatamente peticiones en curso al iniciar una nueva.
- **Navegación por teclado y accesibilidad:** Soporte para flechas Arriba/Abajo, `Enter` para seleccionar, `Escape` para cerrar y roles ARIA (`combobox`, `listbox`, `option`).

### 6. Persistencia Segura y Migración (`store/useMapStore.ts`)
- Almacenamiento en `localStorage` con clave versionada (`schemaVersion: 1`).
- Migración y saneamiento automático ante datos corruptos o valores `NaN`.
- Generación de identificadores con `crypto.randomUUID()` nativo del navegador.
- Diálogos de confirmación explícita para acciones destructivas (borrar puntos o eliminar proyectos).

### 7. Exportación de Datos de Alta Fidelidad (`lib/export.ts`)
- **CSV (RFC 4180):** Escapado formal de comas, comillas (`""`) y saltos de línea, con prefijo BOM UTF-8 (`\uFEFF`) para compatibilidad directa con Microsoft Excel en español.
- **PNG de Alta Resolución:** Renderizado determinista en un canvas offscreen a resolución 1600×1000px, con fondo dark temático, grilla de referencia, polígonos coloreados y etiquetas legibles. Nombres de archivo sanitizados para Windows, macOS y Linux.

---

## 📱 Diseño Responsive y Accesibilidad (a11y)
- **Desktop y Ultra-Wide:** Layout centrado con visor cartográfico dominante y panel lateral de control acoplado.
- **Móvil / Tablet:** Panel deslizable (drawer) con botón flotante de acceso rápido y cabecera adaptable sin solapar controles.
- **Teclado y lectores de pantalla:** Atributos `aria-label`, roles de accesibilidad semánticos en pestañas (`tablist`, `tab`, `tabpanel`), combobox accesible en búsqueda y estados de foco visibles (`focus-visible`).

---

## 🧪 Pruebas Automatizadas

El proyecto incluye 27 pruebas unitarias que validan la lógica central sin requerir dependencias externas pesadas:

```bash
npm test
```

### Cobertura de pruebas:
- **Motor Voronoi (`tests/voronoi.test.ts`)**: Casos con 0, 1, 2 puntos, colineales, idénticos, coordenadas `NaN`/`Infinity`, clamp de opacidad y saneamiento de colores HEX/RGBA.
- **Exportación (`tests/export.test.ts`)**: Reglas RFC 4180, entrecomillado, BOM UTF-8 y sanitización de nombres de archivo.
- **Store Zustand (`tests/store.test.ts`)**: Identificadores UUID nativos, adición, actualización, eliminación, limpieza y saneamiento de proyectos corruptos.
- **Nominatim (`tests/nominatim.test.ts`)**: Descarte de consultas en blanco o menores a 3 caracteres para no consumir cuota de red.
