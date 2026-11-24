import { useEffect, useState } from "react";
import { normalizeFilmRecipe, RECIPE_FIELDS } from "../services/filmRecipe.js";

export default function FilmRecipe({ recipe, onSave, onEditStateChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(recipe || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dirty = editing && RECIPE_FIELDS.some(({ key }) => (draft[key] || "") !== (recipe?.[key] || ""));

  useEffect(() => {
    onEditStateChange({ dirty, saving });
  }, [dirty, saving, onEditStateChange]);
  useEffect(() => () => onEditStateChange({ dirty: false, saving: false }), [onEditStateChange]);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    try {
      const normalized = normalizeFilmRecipe(draft);
      setSaving(true);
      await onSave(draft);
      setEditing(false);
      setMessage(normalized ? "Đã lưu Film Recipe." : "Đã bỏ thông tin Film Recipe.");
    } catch (error) {
      setError(error.message || "Không thể lưu Film Recipe. Hãy thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="photo-journal film-recipe" aria-label="Film Recipe">
    <h2>Film Recipe</h2>
    <p className="gallery-exif">Do bạn nhập. Chỉ điền thông số có trên máy và bạn biết rõ; để trống các mục còn lại.</p>
    {editing ? <form onSubmit={submit}>
      <fieldset disabled={saving}>
        <div className="recipe-fields">
          {RECIPE_FIELDS.map(({ key, label, maxLength = 80 }) => <label key={key} className={key === "notes" ? "recipe-notes" : undefined}>
            <span>{label}</span>
            {key === "notes" ? <textarea rows={3} maxLength={maxLength} value={draft[key] || ""}
              onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} /> :
              <input type="text" maxLength={maxLength} value={draft[key] || ""}
                onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} />}
          </label>)}
        </div>
        <div className="journal-actions"><button type="submit">{saving ? "Đang lưu…" : "Lưu recipe"}</button>
          <button type="button" onClick={() => { setEditing(false); setError(""); }}>Hủy</button></div>
        <p className="gallery-exif">Xóa nội dung các ô rồi lưu để bỏ thông tin recipe. Ảnh gốc vẫn được giữ nguyên.</p>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form> : <>
      {recipe ? <dl className="recipe-values">
        {RECIPE_FIELDS.filter(({ key }) => recipe[key]).map(({ key, label }) =>
          <div key={key} className={key === "notes" ? "recipe-notes" : undefined}><dt>{label}</dt><dd>{recipe[key]}</dd></div>)}
      </dl> : <p className="gallery-exif">Chưa có Film Recipe cho ảnh này.</p>}
      <button type="button" onClick={() => { setDraft(recipe || {}); setError(""); setMessage(""); setEditing(true); }}>
        {recipe ? "Chỉnh sửa recipe" : "Thêm recipe"}
      </button>
    </>}
    <p className="gallery-exif">Màu ảnh có thể chịu ảnh hưởng của ánh sáng và hậu kỳ, ngoài các thông số recipe.</p>
    <p role="status">{message}</p>
  </section>;
}
