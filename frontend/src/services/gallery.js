import { readExif } from "./exif.js";
import { normalizeJournal } from "./journal.js";
const DATABASE = "fujiframe-gallery";
let connection;

function openDatabase() {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("photos", { keyPath: "id" });
        request.result.createObjectStore("originals", { keyPath: "id" });
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Đóng các tab FujiFrame khác rồi thử lại."));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); connection = null; };
        resolve(database);
      };
    }).catch(error => { connection = null; throw error; });
  }
  return connection;
}

async function transact(stores, mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(stores, mode);
    const request = operation(transaction);
    transaction.oncomplete = () => resolve(request?.result);
    transaction.onabort = () => reject(transaction.error || new Error("Không thể lưu thay đổi."));
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function listPhotos() {
  const photos = await transact(["photos"], "readonly", tx => tx.objectStore("photos").getAll());
  for (const photo of photos) {
    if (photo.exifVersion) continue;
    const result = await readExif(await getOriginal(photo.id));
    await transact(["photos"], "readwrite", tx => {
      const store = tx.objectStore("photos");
      const request = store.get(photo.id);
      request.onsuccess = () => { if (request.result) store.put({ ...request.result, ...result }); };
    });
    Object.assign(photo, result);
  }
  return photos.sort((a, b) => a.addedAt - b.addedAt || a.id.localeCompare(b.id));
}

export async function getOriginal(id) {
  const record = await transact(["originals"], "readonly", tx => tx.objectStore("originals").get(id));
  if (!record) throw new Error("Ảnh đã được xóa. Hãy tải lại Gallery.");
  return record.blob;
}

export function savePhoto(photo, blob) {
  return transact(["photos", "originals"], "readwrite", tx => {
    tx.objectStore("photos").add(photo);
    tx.objectStore("originals").add({ id: photo.id, blob });
  });
}

export function deletePhoto(id) {
  return transact(["photos", "originals"], "readwrite", tx => {
    tx.objectStore("photos").delete(id);
    tx.objectStore("originals").delete(id);
  });
}

export async function updateJournal(id, values) {
  const journal = normalizeJournal(values);
  let updated;
  await transact(["photos"], "readwrite", tx => {
    const store = tx.objectStore("photos");
    const request = store.get(id);
    request.onsuccess = () => {
      if (!request.result) return;
      updated = { ...request.result, journal };
      store.put(updated);
    };
  });
  if (!updated) throw new Error("Ảnh đã được xóa. Hãy tải lại Gallery.");
  return updated;
}

export function clearPhotos() {
  return transact(["photos", "originals"], "readwrite", tx => {
    tx.objectStore("photos").clear();
    tx.objectStore("originals").clear();
  });
}

export function storageMessage(error) {
  if (error?.name === "QuotaExceededError") return "Không đủ dung lượng lưu trữ. Hãy giải phóng dung lượng rồi thử lại. Các ảnh đã lưu vẫn được giữ.";
  return error?.message || "Không thể truy cập bộ nhớ ảnh của trình duyệt. Hãy thử lại.";
}

export async function preparePhoto(file) {
  if (!file.size) throw new Error("Tệp trống.");
  if (file.size > 32 * 1024 * 1024) throw new Error("Ảnh vượt quá 32 MiB.");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp) throw new Error("Chỉ hỗ trợ JPEG, PNG và WebP.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Ảnh bị hỏng hoặc trình duyệt không thể đọc.");
  }
  try {
    const { width, height } = bitmap;
    if (width * height > 64_000_000) throw new Error("Ảnh vượt quá 64 MP.");
    const scale = Math.min(1, 960 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!thumbnail) throw new Error("Không thể tạo ảnh xem trước.");
    return { id: crypto.randomUUID(), name: file.name, addedAt: Date.now(), size: file.size,
      width, height, format: jpeg ? "JPEG" : png ? "PNG" : "WebP", thumbnail, ...await readExif(file) };
  } finally {
    bitmap.close();
  }
}
