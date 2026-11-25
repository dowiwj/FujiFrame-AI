import { useEffect, useRef, useState } from "react";
import { getOriginal, listPhotos, storageMessage } from "../services/gallery.js";
import { formatExif } from "../services/exif.js";
import { RECIPE_FIELDS } from "../services/filmRecipe.js";

export default function PhotoDetail({ id }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const heading = useRef(null);
  useEffect(() => {
    let active = true;
    let url;
    setResult(null);
    setError("");
    async function load() {
      try {
        const photo = (await listPhotos()).find(item => item.id === id);
        if (!photo) throw new Error("Không tìm thấy ảnh trong trình duyệt này. Ảnh có thể đã bị xóa hoặc thuộc thư viện khác.");
        const blob = await getOriginal(id);
        if (!active) return;
        url = URL.createObjectURL(blob);
        setResult({ photo, url });
      } catch (error) {
        if (active) setError(storageMessage(error));
      }
    }
    void load();
    const updates = new BroadcastChannel("fujiframe-gallery");
    const refresh = () => setAttempt(value => value + 1);
    updates.onmessage = refresh;
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
      updates.close();
      window.removeEventListener("focus", refresh);
    };
  }, [id, attempt]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [id]);
  const photo = result?.photo;
  return <article className="photo-detail" aria-label="Chi tiết ảnh">
    <a href="#gallery" className="detail-back">← Về Gallery</a>
    <h1 ref={heading} tabIndex={-1}>{photo?.journal?.title || photo?.name || "Chi tiết ảnh"}</h1>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setAttempt(value => value + 1)}>Thử lại</button></div> : !photo ?
      <p role="status">Đang tải ảnh…</p> : <>
        <figure className="detail-image"><img src={result.url} alt={photo.journal?.title || photo.name}
          width={photo.width} height={photo.height} onError={() => setError("Không thể hiển thị ảnh gốc.")} /></figure>
        <div className="detail-information">
          <section aria-label="Nhật ký ảnh">
            <h2>Nhật ký ảnh</h2>
            <p className="gallery-exif">Thông tin do bạn nhập</p>
            {photo.journal?.collection && <p>{photo.journal.collection}</p>}
            {photo.journal?.location && <p>{photo.journal.location}</p>}
            <p className="journal-description">{photo.journal?.description || "Chưa có mô tả cho ảnh này."}</p>
            <h2>Thông số ảnh</h2>
            <p>{formatExif(photo.metadata) || "Chưa có thông tin EXIF."}</p>
            <p className="gallery-exif">{photo.format} · {photo.width} × {photo.height} px</p>
          </section>
          <section aria-label="Film Recipe">
            <h2>Film Recipe</h2>
            <p className="gallery-exif">Thông số do bạn nhập, không suy đoán từ màu ảnh.</p>
            {photo.recipe ? <dl className="recipe-values">
              {RECIPE_FIELDS.filter(({ key }) => photo.recipe[key]).map(({ key, label }) =>
                <div key={key}><dt>{label}</dt><dd>{photo.recipe[key]}</dd></div>)}
            </dl> : <p>Chưa có Film Recipe cho ảnh này.</p>}
            <p className="gallery-exif">Ánh sáng và hậu kỳ cũng ảnh hưởng đến màu sắc cuối cùng.</p>
          </section>
        </div>
      </>}
    <p className="session-note">Đường dẫn này chỉ mở ảnh trong thư viện của cùng trình duyệt và địa chỉ web. Chỉnh sửa nhật ký và recipe trong lightbox của Gallery.</p>
  </article>;
}
