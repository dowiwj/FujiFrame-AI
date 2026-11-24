import { memo, useCallback, useEffect, useRef, useState } from "react";
import { clearPhotos, deletePhoto, listPhotos, preparePhoto, savePhoto, storageMessage, updateJournal } from "../services/gallery.js";
import GalleryLightbox from "./GalleryLightbox.jsx";
import { formatExif } from "../services/exif.js";

function useBlobUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

const GalleryPhoto = memo(function GalleryPhoto({ photo, onOpen, onRemove, busy }) {
  const url = useBlobUrl(photo.thumbnail);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <figure className="gallery-photo">
    <button className="photo-button" aria-label={`Mở ảnh ${photo.name}`} onClick={() => onOpen(photo)}>
      {failed ? <p className="preview-fallback">Không thể tải ảnh xem trước. Nhấn để mở ảnh gốc.</p> :
        <img src={url || undefined} alt={photo.name} width={photo.width} height={photo.height}
          loading="lazy" decoding="async" className={loaded ? "is-loaded" : ""}
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    </button>
    <figcaption>
      <span>{photo.journal?.title || photo.name}</span>
      <span className="gallery-photo-actions">
        <span>{photo.width} × {photo.height}</span>
        <button type="button" className="remove-button" disabled={busy}
          aria-label={`Xóa ảnh ${photo.name}`} onClick={() => onRemove(photo)}>Xóa</button>
      </span>
    </figcaption>
    {formatExif(photo.metadata) && <p className="gallery-exif">{formatExif(photo.metadata)}</p>}
  </figure>;
});

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState("");
  const input = useRef(null);
  const locked = useRef(false);
  const dragDepth = useRef(0);
  const channel = useRef(null);
  const openRequest = useRef(0);
  const refreshId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++refreshId.current;
    const stored = await listPhotos();
    if (id === refreshId.current) {
      setPhotos(stored);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const reload = () => { void refresh().catch(error => setErrors([storageMessage(error)])); };
    reload();
    const updates = new BroadcastChannel("fujiframe-gallery");
    channel.current = updates;
    updates.onmessage = () => { openRequest.current += 1; setExpanded(null); reload(); };
    window.addEventListener("focus", reload);
    return () => { refreshId.current += 1; openRequest.current += 1; updates.close(); window.removeEventListener("focus", reload); };
  }, [refresh]);

  async function addFiles(files) {
    if (!ready || locked.current || !files.length) return;
    locked.current = true;
    setBusy(true);
    setErrors([]);
    const failures = [];
    let added = 0;
    try {
      for (const [index, file] of Array.from(files).entries()) {
        setStatus(`Đang lưu ảnh ${index + 1} / ${files.length}…`);
        try {
          const photo = await preparePhoto(file);
          await savePhoto(photo, file);
          added += 1;
          setPhotos(current => [...current, photo]);
        } catch (error) {
          failures.push(`${file.name} — ${storageMessage(error)}`);
          if (error.name === "QuotaExceededError") {
            failures.push("Đã dừng lượt thêm ảnh. Các tệp còn lại chưa được lưu.");
            break;
          }
        }
      }
      channel.current?.postMessage("changed");
      await refresh();
    } catch (error) {
      failures.push(storageMessage(error));
    } finally {
      setErrors(failures);
      setStatus(`Đã lưu ${added} ảnh.`);
      locked.current = false;
      setBusy(false);
    }
  }

  const removePhoto = useCallback(async photo => {
    if (locked.current || !window.confirm(`Xóa ảnh “${photo.name}” khỏi Gallery trên trình duyệt này?`)) return;
    locked.current = true;
    setBusy(true);
    setErrors([]);
    setStatus("");
    try {
      await deletePhoto(photo.id);
      openRequest.current += 1;
      setExpanded(current => current?.photo.id === photo.id ? null : current);
      setPhotos(current => current.filter(item => item.id !== photo.id));
      channel.current?.postMessage("changed");
      await refresh();
      setStatus(`Đã xóa ảnh “${photo.name}”.`);
    } catch (error) {
      setErrors([storageMessage(error)]);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, [refresh]);

  async function removeAll() {
    if (locked.current || !window.confirm(`Xóa tất cả ${photos.length} ảnh đã lưu trong Gallery trên trình duyệt này?`)) return;
    locked.current = true;
    setBusy(true);
    setErrors([]);
    try {
      await clearPhotos();
      openRequest.current += 1;
      setExpanded(null);
      setPhotos([]);
      channel.current?.postMessage("changed");
      await refresh();
      setStatus("Đã xóa tất cả ảnh trong Gallery.");
    } catch (error) {
      setErrors([storageMessage(error)]);
    } finally { locked.current = false; setBusy(false); }
  }

  const openPhoto = useCallback(photo => setExpanded({ photo }), []);
  const closeLightbox = useCallback(() => setExpanded(null), []);

  async function saveJournal(id, values) {
    const updated = await updateJournal(id, values);
    refreshId.current += 1;
    setPhotos(current => current.map(photo => photo.id === id ? updated : photo));
    channel.current?.postMessage("changed");
  }

  const chooseButton = <button className="choose-button" disabled={!ready || busy} onClick={() => input.current.click()}>Thêm ảnh</button>;
  const collections = [...new Set(photos.map(photo => photo.journal?.collection).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "vi"));
  const visiblePhotos = collectionFilter
    ? photos.filter(photo => photo.journal?.collection === collectionFilter)
    : photos;
  return <section className={`gallery${dragging ? " is-dragging" : ""}`} aria-label="Thư viện ảnh"
    onDragEnter={event => { event.preventDefault(); dragDepth.current += 1; setDragging(true); }}
    onDragOver={event => event.preventDefault()}
    onDragLeave={() => { dragDepth.current -= 1; if (dragDepth.current <= 0) setDragging(false); }}
    onDrop={event => { event.preventDefault(); dragDepth.current = 0; setDragging(false); void addFiles(event.dataTransfer.files); }}>
    <div className="panel-heading gallery-toolbar">
      <h2>{String(visiblePhotos.length).padStart(2, "0")} / {collectionFilter ? "ẢNH ĐANG LỌC" : "ẢNH TRONG GALLERY"}</h2>
      <div className="gallery-controls">
        {collections.length > 0 && <label className="collection-filter"><span>Bộ sưu tập</span>
          <select value={collectionFilter} onChange={event => setCollectionFilter(event.target.value)}>
            <option value="">Tất cả ảnh</option>
            {collections.map(collection => <option key={collection} value={collection}>{collection}</option>)}
          </select>
        </label>}
        {photos.length > 0 && chooseButton}{photos.length > 0 && <button className="remove-button" disabled={busy || !ready} onClick={removeAll}>Xóa tất cả</button>}
      </div>
    </div>
    <input ref={input} type="file" multiple accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-label="Thêm ảnh vào Gallery" hidden
      onChange={event => { void addFiles(Array.from(event.target.files)); event.target.value = ""; }} />
    {!ready ? <p role="status">Đang mở thư viện ảnh…</p> : photos.length && visiblePhotos.length ?
      <div className="gallery-masonry">{visiblePhotos.map(photo => <GalleryPhoto key={photo.id} photo={photo} onOpen={openPhoto} onRemove={removePhoto} busy={busy} />)}</div> : photos.length ?
      <div className="gallery-empty empty-state"><h3>Chưa có ảnh trong bộ sưu tập này.</h3><button className="read-button" onClick={() => setCollectionFilter("")}>Hiện tất cả ảnh</button></div> :
      <div className="gallery-empty empty-state"><h3>Mỗi bức ảnh, một câu chuyện.</h3><p>Kéo-thả ảnh vào đây hoặc chọn từ máy của bạn.</p>{chooseButton}<p className="file-hint">JPEG / PNG / WebP · Tối đa 32 MiB mỗi ảnh · 64 MP</p></div>}
    <p className="request-status" role="status">{status}</p>
    {errors.length > 0 && <div className="error" role="alert">{errors.map((message, index) => <p key={index}>{message}</p>)}{!ready && <button className="read-button" onClick={() => { setErrors([]); void refresh().catch(error => setErrors([storageMessage(error)])); }}>Thử lại</button>}</div>}
    <p className="session-note">Ảnh được lưu trong trình duyệt tại địa chỉ này. Xóa dữ liệu trang web sẽ xóa thư viện ảnh.</p>
    {expanded && <GalleryLightbox photos={photos} initialId={expanded.photo.id} onClose={closeLightbox} onSaveJournal={saveJournal} />}
  </section>;
}
