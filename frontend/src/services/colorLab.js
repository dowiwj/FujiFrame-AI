const decodeSrgb = value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const encodeSrgb = value => value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
const clamp = value => Math.min(1, Math.max(0, value));

export const DEFAULT_LAB_SETTINGS = Object.freeze({
  exposure: 0, contrast: 0, highlights: 0, shadows: 0,
  temperature: 0, tint: 0, saturation: 0, vibrance: 0,
  grain: 0, curveShadows: 0, curveMidtones: 0, curveHighlights: 0,
  hsl: Object.freeze({ red: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), orange: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), yellow: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), green: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), aqua: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), blue: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), purple: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }), magenta: Object.freeze({ hue: 0, saturation: 0, lightness: 0 }) }),
});

const HUE_RANGES = ["red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta"];
const HUE_CENTERS = [0, 30, 60, 120, 180, 240, 280, 320];
const SETTINGS_LIMITS = {
  exposure: 3, contrast: 100, highlights: 100, shadows: 100,
  temperature: 100, tint: 100, saturation: 100, vibrance: 100,
  grain: 100, curveShadows: 100, curveMidtones: 100, curveHighlights: 100,
};

function validateSettings(settings) {
  for (const [key, limit] of Object.entries(SETTINGS_LIMITS)) {
    if (!Number.isFinite(settings[key]) || settings[key] < -limit || settings[key] > limit ||
        (key === "grain" && settings[key] < 0)) throw new Error(`Invalid Color Lab setting: ${key}`);
  }
  for (const key of HUE_RANGES) {
    for (const [property, limit] of [["hue", 180], ["saturation", 100], ["lightness", 100]]) {
      const value = settings.hsl?.[key]?.[property];
      if (!Number.isFinite(value) || value < -limit || value > limit) throw new Error(`Invalid HSL setting: ${key}.${property}`);
    }
  }
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  hue = (hue + 360) % 360;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return [hue, saturation, lightness];
}

function hslToRgb(hue, saturation, lightness) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = ((hue % 360) + 360) % 360 / 60;
  const x = chroma * (1 - Math.abs(segment % 2 - 1));
  const [r, g, b] = segment < 1 ? [chroma, x, 0] : segment < 2 ? [x, chroma, 0] :
    segment < 3 ? [0, chroma, x] : segment < 4 ? [0, x, chroma] :
    segment < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const offset = lightness - chroma / 2;
  return [r + offset, g + offset, b + offset];
}

function curve(value, settings) {
  const positions = [0, 0.25, 0.5, 0.75, 1];
  const output = [0, clamp(0.25 + settings.curveShadows / 200),
    clamp(0.5 + settings.curveMidtones / 200),
    clamp(0.75 + settings.curveHighlights / 200), 1];
  const index = Math.min(3, Math.floor(value * 4));
  const fraction = (value - positions[index]) * 4;
  return clamp(output[index] + (output[index + 1] - output[index]) * fraction);
}

// All adjustments are calculated from the immutable decoded preview.
export function applyLabAdjustments(source, settings = DEFAULT_LAB_SETTINGS) {
  validateSettings(settings);
  if (!(source instanceof Uint8ClampedArray) || source.length % 4 !== 0) throw new Error("Invalid pixel buffer");
  const result = adjustPixels(source, settings.exposure, settings.contrast);
  const neutral = Object.keys(SETTINGS_LIMITS).every(key => settings[key] === 0) &&
    HUE_RANGES.every(key => Object.values(settings.hsl[key]).every(value => value === 0));
  if (neutral) return result;
  const hasCurve = settings.curveShadows !== 0 || settings.curveMidtones !== 0 || settings.curveHighlights !== 0;
  const hasHsl = HUE_RANGES.some(key => Object.values(settings.hsl[key]).some(value => value !== 0));
  const hasColor = settings.saturation !== 0 || settings.vibrance !== 0 || hasHsl;
  const hasTone = settings.shadows !== 0 || settings.highlights !== 0;
  const hasBalance = settings.temperature !== 0 || settings.tint !== 0;
  for (let index = 0; index < result.length; index += 4) {
    const alpha = source[index + 3];
    if (alpha === 0) continue;
    let r = result[index] / 255, g = result[index + 1] / 255, b = result[index + 2] / 255;
    if (hasTone) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const shadowWeight = (1 - luminance) ** 2;
      const highlightWeight = luminance ** 2;
      const toneOffset = (settings.shadows * shadowWeight + settings.highlights * highlightWeight) / 400;
      r = clamp(r + toneOffset); g = clamp(g + toneOffset); b = clamp(b + toneOffset);
    }
    if (hasCurve) { r = curve(r, settings); g = curve(g, settings); b = curve(b, settings); }
    if (hasBalance) {
      r = clamp(r + settings.temperature / 500 + settings.tint / 1000);
      g = clamp(g - settings.tint / 500);
      b = clamp(b - settings.temperature / 500 + settings.tint / 1000);
    }
    if (hasColor) {
      let [hue, saturation, lightness] = rgbToHsl(r, g, b);
      const originalSaturation = saturation;
      saturation = clamp(saturation * (1 + settings.saturation / 100) +
        settings.vibrance / 100 * saturation * (1 - saturation));
      // Blend adjacent hue bands to avoid an abrupt boundary in color gradients.
      if (hasHsl && originalSaturation > 0.001) {
        let left = HUE_CENTERS.length - 1;
        for (let band = 0; band < HUE_CENTERS.length - 1; band += 1) {
          if (hue >= HUE_CENTERS[band] && hue < HUE_CENTERS[band + 1]) { left = band; break; }
        }
        const right = (left + 1) % HUE_CENTERS.length;
        const start = HUE_CENTERS[left];
        const end = right === 0 ? 360 : HUE_CENTERS[right];
        const fraction = (hue - start) / (end - start);
        const first = settings.hsl[HUE_RANGES[left]];
        const second = settings.hsl[HUE_RANGES[right]];
        const blend = property => first[property] * (1 - fraction) + second[property] * fraction;
        hue = (hue + blend("hue")) % 360;
        saturation = clamp(saturation * (1 + blend("saturation") / 100));
        lightness = clamp(lightness + blend("lightness") / 200);
      }
      [r, g, b] = hslToRgb(hue, saturation, lightness);
    }
    if (settings.grain) {
      // Stable monochrome grain: no shimmer when a slider is moved or an image is exported.
      const hash = ((Math.imul(index + 1, 1664525) + 1013904223) >>> 0) / 4294967295;
      const noise = (hash - 0.5) * settings.grain / 500;
      r += noise; g += noise; b += noise;
    }
    result[index] = Math.round(255 * clamp(r));
    result[index + 1] = Math.round(255 * clamp(g));
    result[index + 2] = Math.round(255 * clamp(b));
  }
  return result;
}

export function adjustPixels(source, exposure, contrast) {
  if (!Number.isFinite(exposure) || exposure < -3 || exposure > 3 ||
      !Number.isFinite(contrast) || contrast < -100 || contrast > 100) {
    throw new Error("Thông số chỉnh màu ngoài phạm vi hỗ trợ.");
  }
  // Always transform the immutable source, never the previous preview.
  const result = new Uint8ClampedArray(source);
  if (exposure === 0 && contrast === 0) return result;
  const gain = 2 ** exposure;
  const factor = 2 ** (contrast / 100);
  const lookup = new Uint8ClampedArray(256);
  for (let value = 0; value < 256; value += 1) {
    const exposed = encodeSrgb(clamp(decodeSrgb(value / 255) * gain));
    lookup[value] = Math.round(255 * clamp((exposed - 0.5) * factor + 0.5));
  }
  for (let index = 0; index < result.length; index += 4) {
    result[index] = lookup[source[index]];
    result[index + 1] = lookup[source[index + 1]];
    result[index + 2] = lookup[source[index + 2]];
  }
  return result;
}

export async function loadLabPreview(file) {
  if (!file.size || file.size > 32 * 1024 * 1024) throw new Error("Chọn ảnh không trống, tối đa 32 MiB.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Chỉ hỗ trợ JPEG, PNG và WebP.");
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("Không thể đọc ảnh. Tệp có thể hỏng hoặc không được trình duyệt hỗ trợ."); }
  try {
    if (bitmap.width * bitmap.height > 64_000_000) throw new Error("Ảnh vượt quá 64 MP.");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { colorSpace: "srgb", willReadFrequently: true });
    if (!context) throw new Error("Trình duyệt không hỗ trợ canvas để chỉnh ảnh.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { name: file.name, pixels: context.getImageData(0, 0, canvas.width, canvas.height) };
  } finally { bitmap.close(); }
}
