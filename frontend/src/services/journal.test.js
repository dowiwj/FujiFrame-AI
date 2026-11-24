import assert from "node:assert/strict";
import test from "node:test";
import { JOURNAL_FIELDS, normalizeJournal } from "./journal.js";

test("keeps only manually editable fields without changing EXIF input", () => {
  const input = { title: "  Buổi sáng  ", description: "Dòng 1\nDòng 2", location: "  Huế ", metadata: { iso: 400 }, gps: "private" };
  assert.deepEqual(normalizeJournal(input), { title: "Buổi sáng", description: "Dòng 1\nDòng 2", location: "Huế" });
  assert.equal(input.title, "  Buổi sáng  ");
  assert.deepEqual(input.metadata, { iso: 400 });
});

test("empty fields remove previous journal text without fabricated defaults", () => {
  assert.deepEqual(normalizeJournal({ title: " ", location: "", description: null }), {});
});

for (const { key, maxLength } of JOURNAL_FIELDS) {
  test(`${key} validates types and length boundaries`, () => {
    assert.equal(normalizeJournal({ [key]: "a".repeat(maxLength) })[key].length, maxLength);
    assert.throws(() => normalizeJournal({ [key]: "a".repeat(maxLength + 1) }));
    assert.throws(() => normalizeJournal({ [key]: 42 }));
    assert.throws(() => normalizeJournal({ [key]: {} }));
  });
}
