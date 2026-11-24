import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFilmRecipe } from "./filmRecipe.js";

test("keeps a partial recipe, zero and signed settings without inventing defaults", () => {
  assert.deepEqual(normalizeFilmRecipe({ filmSimulation: " Classic Chrome ", color: "0", shadowTone: "-2", wbShift: "R +2, B -3" }), {
    filmSimulation: "Classic Chrome", color: "0", shadowTone: "-2", wbShift: "R +2, B -3", source: "manual",
  });
});

test("empty recipes are removed rather than saved as an attributed empty record", () => {
  assert.equal(normalizeFilmRecipe({}), null);
  assert.equal(normalizeFilmRecipe({ name: "  ", color: null, source: "manual" }), null);
});

test("cannot claim EXIF provenance or overwrite other photo data", () => {
  const input = { name: " My recipe ", source: "exif", metadata: { iso: 400 }, journal: { title: "Photo" }, notes: "Original\nEdited later" };
  assert.deepEqual(normalizeFilmRecipe(input), { name: "My recipe", notes: "Original\nEdited later", source: "manual" });
  assert.equal(input.name, " My recipe ");
  assert.deepEqual(input.metadata, { iso: 400 });
});

test("rejects malformed input and overly long fields without truncation", () => {
  for (const value of [null, undefined, [], "recipe", 1]) assert.throws(() => normalizeFilmRecipe(value));
  for (const value of [0, false, {}, []]) assert.throws(() => normalizeFilmRecipe({ color: value }));
  assert.throws(() => normalizeFilmRecipe({ filmSimulation: "a".repeat(81) }));
  assert.throws(() => normalizeFilmRecipe({ name: "a".repeat(161) }));
  assert.throws(() => normalizeFilmRecipe({ notes: "a".repeat(2001) }));
  assert.equal(normalizeFilmRecipe({ notes: "a".repeat(2000) }).notes.length, 2000);
});
