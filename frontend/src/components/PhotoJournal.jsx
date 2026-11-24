import { useState } from "react";
import { JOURNAL_FIELDS } from "../services/journal.js";

export default function PhotoJournal({ photo, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(photo.journal || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      await onSave(photo.id, draft);
      setEditing(false);
      setMessage("Đã lưu nhật ký ảnh.");
    } catch (error) {
      setError(error.message || "Không thể lưu nhật ký. Hãy thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="photo-journal" aria-label="Nhật ký ảnh">
    <h2>Nhật ký ảnh</h2>
    <p className="gallery-exif">Thông tin do bạn nhập, lưu riêng với EXIF và ảnh gốc.</p>
    {editing ? <form onSubmit={submit}>
      <fieldset disabled={saving}>
        {JOURNAL_FIELDS.map(({ key, label, maxLength }) => <label key={key}>
          <span>{label}</span>
          {key === "description" ? <textarea rows={4} maxLength={maxLength} value={draft[key] || ""}
            onChange={event => setDraft({ ...draft, [key]: event.target.value })} /> :
            <input type="text" maxLength={maxLength} value={draft[key] || ""}
              onChange={event => setDraft({ ...draft, [key]: event.target.value })} />}
        </label>)}
        <div className="journal-actions"><button type="submit">{saving ? "Đang lưu…" : "Lưu nhật ký"}</button>
          <button type="button" onClick={() => { setEditing(false); setError(""); }}>Hủy</button></div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form> : <>
      {photo.journal?.collection && <p><span className="journal-label">Bộ sưu tập</span>{photo.journal.collection}</p>}
      {photo.journal?.location && <p>{photo.journal.location}</p>}
      {photo.journal?.description && <p className="journal-description">{photo.journal.description}</p>}
      <button type="button" onClick={() => { setDraft(photo.journal || {}); setMessage(""); setEditing(true); }}>Chỉnh sửa nhật ký</button>
    </>}
    <p role="status">{message}</p>
  </section>;
}
