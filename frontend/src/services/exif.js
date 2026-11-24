import exifr from "exifr";

export async function readExif(blob) {
  try {
    const tags = await exifr.parse(blob, { pick: ["Make", "Model", "LensModel", "FocalLength", "FNumber", "ExposureTime", "ISO", "DateTimeOriginal"], reviveValues: false });
    const metadata = {};
    for (const [key, tag] of Object.entries({ make: "Make", model: "Model", lens: "LensModel", focalLength: "FocalLength", aperture: "FNumber", exposure: "ExposureTime", iso: "ISO", dateTaken: "DateTimeOriginal" })) {
      const value = tags?.[tag];
      if (typeof value === "string" && value.trim()) metadata[key] = value.trim();
      if (typeof value === "number" && Number.isFinite(value) && value > 0) metadata[key] = value;
    }
    return { metadata, exifVersion: 1 };
  } catch { return { metadata: {}, exifVersion: 1, exifError: true }; }
}

export function formatExif(metadata = {}) {
  const { make, model, lens, focalLength, aperture, exposure, iso, dateTaken } = metadata;
  const camera = model?.toLowerCase().includes(make?.toLowerCase()) ? model : [make, model].filter(Boolean).join(" ");
  const shutter = exposure && (exposure < 1 ? `1/${Math.round(1 / exposure)}S` : `${exposure}S`);
  return [camera, lens, focalLength && `${focalLength}MM`, aperture && `F/${aperture}`, shutter, iso && `ISO ${iso}`, dateTaken].filter(Boolean).join(" · ");
}
