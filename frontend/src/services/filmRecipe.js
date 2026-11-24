export const RECIPE_FIELDS = [
  { key: "name", label: "Tên recipe", maxLength: 160 },
  { key: "filmSimulation", label: "Film Simulation" },
  { key: "dynamicRange", label: "Dynamic Range" },
  { key: "whiteBalance", label: "White Balance" },
  { key: "wbShift", label: "WB Shift" },
  { key: "highlightTone", label: "Highlight Tone" },
  { key: "shadowTone", label: "Shadow Tone" },
  { key: "color", label: "Color" },
  { key: "sharpness", label: "Sharpness" },
  { key: "noiseReduction", label: "Noise Reduction" },
  { key: "grainEffect", label: "Grain Effect" },
  { key: "colorChromeEffect", label: "Color Chrome Effect" },
  { key: "colorChromeFxBlue", label: "Color Chrome FX Blue" },
  { key: "clarity", label: "Clarity" },
  { key: "notes", label: "Ghi chú / hậu kỳ", maxLength: 2000 },
];

// Store the photographer's wording; supported values vary by camera model.
export function normalizeFilmRecipe(values) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Film Recipe phải là một bộ thông số.");
  }
  const recipe = {};
  for (const { key, label, maxLength = 80 } of RECIPE_FIELDS) {
    const value = values[key] ?? "";
    if (typeof value !== "string") throw new Error(`${label} phải là văn bản.`);
    const text = value.trim();
    if (text.length > maxLength) throw new Error(`${label} tối đa ${maxLength} ký tự.`);
    if (text) recipe[key] = text;
  }
  return Object.keys(recipe).length ? { ...recipe, source: "manual" } : null;
}
