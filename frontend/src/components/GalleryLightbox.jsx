import { useEffect, useRef, useState } from "react";
import { getOriginal } from "../services/gallery.js";
import { formatExif } from "../services/exif.js";
import PhotoJournal from "./PhotoJournal.jsx";
import FilmRecipe from "./FilmRecipe.jsx";

export default function GalleryLightbox({ photos, initialId, onClose, onSaveJournal, onSaveRecipe }) {
  const [id, setId] = useState(initialId);
  const [source, setSource] = useState(null);
  const [error, setError] = useState("");
  const [recipeEdit, setRecipeEdit] = useState({ dirty: false, saving: false });
  const dialog = useRef(null);
  const touch = useRef(null);
  const index = photos.findIndex(photo => photo.id === id);
  const photo = photos[index];
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; focus?.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    let active = true;
    let url;
    setSource(null); setError("");
    if (!photo) { onClose(); return; }
    getOriginal(id).then(blob => {
      if (active) { url = URL.createObjectURL(blob); setSource({ id, url }); }
    }).catch(() => { if (active) setError("Không thể tải ảnh gốc."); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [id, photo, onClose]);
  function move(direction) {
    const next = photos[index + direction];
    if (next && canLeave()) setId(next.id);
  }
  function canLeave() {
    return !recipeEdit.saving && (!recipeEdit.dirty || window.confirm("Bỏ các thay đổi Film Recipe chưa lưu?"));
  }
  function close() {
    if (canLeave()) onClose();
  }
  return <dialog ref={dialog} className="gallery-lightbox" aria-label="Xem ảnh Gallery" onCancel={event => { event.preventDefault(); close(); }}
    onKeyDown={event => {
      if (event.target.closest("input, textarea, select")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    }}>
    <div className="gallery-lightbox-toolbar"><span aria-live="polite">{String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span><button aria-label="Đóng Lightbox" disabled={recipeEdit.saving} onClick={close} autoFocus>×</button></div>
    <div className="gallery-lightbox-image" onTouchStart={event => { touch.current = event.touches[0]; }} onTouchEnd={event => {
      const start = touch.current; const end = event.changedTouches[0]; touch.current = null;
      if (start && Math.abs(end.clientX - start.clientX) > 60 && Math.abs(end.clientY - start.clientY) < 60) move(end.clientX < start.clientX ? 1 : -1);
    }}>
      {error ? <p role="alert">{error}</p> : source?.id === id ? <img src={source.url} alt={photo?.name} onError={() => setError("Không thể hiển thị ảnh.")} /> : <p role="status">Đang tải ảnh…</p>}
    </div>
    <div className="gallery-lightbox-toolbar"><button aria-label="Ảnh trước" disabled={index <= 0} onClick={() => move(-1)}>←</button><button aria-label="Ảnh tiếp theo" disabled={index >= photos.length - 1} onClick={() => move(1)}>→</button></div>
    <p>{photo?.journal?.title || photo?.name}</p><p className="gallery-exif">{formatExif(photo?.metadata)}</p>
    {photo && <PhotoJournal key={photo.id} photo={photo} onSave={onSaveJournal} />}
    {photo && <FilmRecipe key={`recipe-${photo.id}`} recipe={photo.recipe} onSave={values => onSaveRecipe(photo.id, values)} onEditStateChange={setRecipeEdit} />}
  </dialog>;
}
