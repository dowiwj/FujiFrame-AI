import assert from "node:assert/strict";
import test from "node:test";
import { adjustPixels, applyLabAdjustments, DEFAULT_LAB_SETTINGS } from "./colorLab.js";

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

const settingsWith = changes => ({ ...DEFAULT_LAB_SETTINGS, ...changes });

test("all neutral controls return an independent, unchanged pixel buffer", () => {
  const source = new Uint8ClampedArray([255, 128, 0, 90, 20, 40, 60, 0]);
  const result = applyLabAdjustments(source);
  assert.deepEqual(result, source);
  assert.notEqual(result, source);
});

test("tone, white balance and curve controls alter pixels without mutating source or alpha", () => {
  const source = new Uint8ClampedArray([60, 80, 100, 123]);
  for (const changes of [
    { highlights: 80 }, { shadows: -80 }, { temperature: 80 }, { tint: 80 },
    { curveShadows: 60 }, { curveMidtones: -60 }, { curveHighlights: 60 },
  ]) {
    const sample = changes.curveHighlights ? new Uint8ClampedArray([220, 230, 240, 123]) : source;
    const result = applyLabAdjustments(sample, settingsWith(changes));
    assert.notDeepEqual([...result.slice(0, 3)], [...sample.slice(0, 3)], JSON.stringify(changes));
    assert.equal(result[3], 123);
    assert.deepEqual([...source], [60, 80, 100, 123]);
  }
});

test("saturation and vibrance preserve neutral gray and affect colorful pixels", () => {
  const source = new Uint8ClampedArray([180, 90, 40, 255, 100, 100, 100, 255]);
  for (const changes of [{ saturation: 70 }, { vibrance: 70 }]) {
    const result = applyLabAdjustments(source, settingsWith(changes));
    assert.notDeepEqual([...result.slice(0, 3)], [...source.slice(0, 3)]);
    assert.deepEqual([...result.slice(4)], [100, 100, 100, 255]);
  }
});

test("HSL adjusts its named hue band and grain is deterministic", () => {
  const source = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]);
  const red = settingsWith({ hsl: { ...DEFAULT_LAB_SETTINGS.hsl, red: { hue: 60, saturation: 0, lightness: 0 } } });
  const shifted = applyLabAdjustments(source, red);
  assert.notDeepEqual([...shifted.slice(0, 3)], [255, 0, 0]);
  assert.deepEqual([...shifted.slice(4)], [0, 0, 255, 255]);
  const grain = settingsWith({ grain: 60 });
  assert.deepEqual(applyLabAdjustments(source, grain), applyLabAdjustments(source, grain));
});

test("rejects incomplete and out-of-range settings", () => {
  const source = new Uint8ClampedArray(4);
  assert.throws(() => applyLabAdjustments(source, settingsWith({ temperature: 101 })));
  assert.throws(() => applyLabAdjustments(source, settingsWith({ hsl: {} })));
  assert.throws(() => applyLabAdjustments(new Uint8ClampedArray(3)));
});
