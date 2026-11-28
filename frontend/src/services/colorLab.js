const decodeSrgb = value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const encodeSrgb = value => value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
const clamp = value => Math.min(1, Math.max(0, value));

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
