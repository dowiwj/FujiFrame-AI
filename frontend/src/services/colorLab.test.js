import assert from "node:assert/strict";
import test from "node:test";
import { adjustPixels } from "./colorLab.js";

test("neutral settings preserve every byte and return independent pixels", () => {
  const source = new Uint8ClampedArray([0, 128, 255, 37]);
  const result = adjustPixels(source, 0, 0);
  assert.deepEqual(result, source);
  assert.notEqual(result, source);
});

test("one EV uses linear-light gain, clips highlights and preserves alpha/source", () => {
  const source = new Uint8ClampedArray([128, 255, 0, 61]);
  assert.deepEqual([...adjustPixels(source, 1, 0)], [176, 255, 0, 61]);
  assert.deepEqual([...source], [128, 255, 0, 61]);
  assert.deepEqual(adjustPixels(source, 1, 0), adjustPixels(source, 1, 0));
});

test("contrast expands around midpoint and does not change alpha", () => {
  assert.deepEqual([...adjustPixels(new Uint8ClampedArray([0, 128, 255, 90]), 0, 100)], [0, 129, 255, 90]);
});

test("rejects invalid settings before processing pixels", () => {
  for (const [exposure, contrast] of [[NaN, 0], [4, 0], [-4, 0], [0, Infinity], [0, 101], [0, -101]]) {
    assert.throws(() => adjustPixels(new Uint8ClampedArray(4), exposure, contrast));
  }
});
