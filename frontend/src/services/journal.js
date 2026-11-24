export const JOURNAL_FIELDS = [
  { key: "title", label: "Tiêu đề", maxLength: 160 },
  { key: "collection", label: "Bộ sưu tập", maxLength: 80 },
  { key: "location", label: "Địa điểm", maxLength: 200 },
  { key: "description", label: "Mô tả", maxLength: 2000 },
];

export function normalizeJournal(values) {
  const journal = {};
  for (const { key, label, maxLength } of JOURNAL_FIELDS) {
    const value = values[key] ?? "";
    if (typeof value !== "string") throw new Error(`${label} phải là văn bản.`);
    const text = value.trim();
    if (text.length > maxLength) throw new Error(`${label} tối đa ${maxLength} ký tự.`);
    if (text) journal[key] = text;
  }
  return journal;
}
