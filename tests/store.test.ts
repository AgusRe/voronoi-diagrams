import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { useMapStore } from "../store/useMapStore.ts";
import { Project } from "../types/index.ts";

describe("useMapStore Unit Tests", () => {
  beforeEach(() => {
    useMapStore.getState().clearPoints();
    useMapStore.getState().createNewProject("Test Project");
  });

  it("adds valid points with stable UUIDs", () => {
    const store = useMapStore.getState();
    const id1 = store.addPoint(-34.6037, -58.3816, "Punto 1", "own", "#6366f1");
    assert.ok(id1.length > 0);

    const updated = useMapStore.getState();
    assert.equal(updated.points.length, 1);
    assert.equal(updated.points[0].id, id1);
    assert.equal(updated.points[0].name, "Punto 1");
    assert.equal(updated.selectedPointId, id1);
  });

  it("ignores points with invalid NaN or non-finite coordinates", () => {
    const store = useMapStore.getState();
    const id = store.addPoint(NaN, -58.3816);
    assert.equal(id, "");
    assert.equal(useMapStore.getState().points.length, 0);
  });

  it("updates point attributes preserving ID and createdAt", () => {
    const store = useMapStore.getState();
    const id = store.addPoint(-34.6, -58.3, "Original", "own");
    const originalCreatedAt = useMapStore.getState().points[0].createdAt;

    store.updatePoint(id, { name: "Renombrado", color: "#10b981" });

    const updated = useMapStore.getState().points[0];
    assert.equal(updated.name, "Renombrado");
    assert.equal(updated.color, "#10b981");
    assert.equal(updated.id, id);
    assert.equal(updated.createdAt, originalCreatedAt);
  });

  it("removes points and clears selection/hover references", () => {
    const store = useMapStore.getState();
    const id1 = store.addPoint(-34.6, -58.3, "P1");
    const id2 = store.addPoint(-34.7, -58.4, "P2");

    store.setSelectedPoint(id1);
    store.setHoveredPoint(id1);

    store.removePoint(id1);

    const updated = useMapStore.getState();
    assert.equal(updated.points.length, 1);
    assert.equal(updated.points[0].id, id2);
    assert.equal(updated.selectedPointId, null);
    assert.equal(updated.hoveredPointId, null);
  });

  it("saves, loads and sanitizes projects without data loss", () => {
    const store = useMapStore.getState();
    store.setCurrentProjectName("Mi Análisis Comercial");
    store.addPoint(-34.6037, -58.3816, "Sucursal 1");
    store.addPoint(-34.6100, -58.3900, "Sucursal 2");

    const saveResult = store.saveProject();
    assert.equal(saveResult.success, true);
    assert.ok(saveResult.projectId);

    const savedState = useMapStore.getState();
    assert.equal(savedState.projects.length, 1);
    assert.equal(savedState.projects[0].name, "Mi Análisis Comercial");
    assert.equal(savedState.projects[0].points.length, 2);

    // Create a new clean project
    store.createNewProject("Nuevo");
    assert.equal(useMapStore.getState().points.length, 0);

    // Load previously saved project
    store.loadProject(savedState.projects[0]);
    const loadedState = useMapStore.getState();
    assert.equal(loadedState.currentProjectName, "Mi Análisis Comercial");
    assert.equal(loadedState.points.length, 2);
  });

  it("handles loading corrupt project points gracefully", () => {
    const store = useMapStore.getState();
    const corruptProject: Project = {
      id: "corrupt-proj-1",
      name: "Proyecto Roto",
      points: [
        { id: "valid", name: "Valido", lat: -34.6, lng: -58.3, color: "#fff", category: "own", createdAt: 123 },
        { id: "broken", name: "Invalido", lat: NaN, lng: -58.3, color: "#fff", category: "own", createdAt: 123 },
      ] as unknown as Project["points"],
      center: { lat: -34.6, lng: -58.3 },
      zoom: 12,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    store.loadProject(corruptProject);
    const state = useMapStore.getState();
    // Only the valid point must be retained
    assert.equal(state.points.length, 1);
    assert.equal(state.points[0].id, "valid");
  });
});
