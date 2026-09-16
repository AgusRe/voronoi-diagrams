import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchLocation } from "../lib/nominatim.ts";

describe("Nominatim Geocoding Service Unit Tests", () => {
  it("rejects queries shorter than 3 characters without network requests", async () => {
    const res = await searchLocation("ab");
    assert.deepEqual(res.data, []);
    assert.equal(res.error, undefined);
  });

  it("handles blank whitespace queries without network requests", async () => {
    const res = await searchLocation("   ");
    assert.deepEqual(res.data, []);
  });
});
