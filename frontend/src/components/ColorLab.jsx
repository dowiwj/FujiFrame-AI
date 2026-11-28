import { useEffect, useRef, useState } from "react";
import { adjustPixels, loadLabPreview } from "../services/colorLab.js";

export default function ColorLab() {
  const [source, setSource] = useState(null);
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [before, setBefore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);
  const canvas = useRef(null);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  useEffect(() => {
    if (!source) return;
    const frame = requestAnimationFrame(() => {
      try {
        const { pixels } = source;
        const context = canvas.current?.getContext("2d", { colorSpace: "srgb" });
        if (!context) throw new Error("Không thể hiển thị preview.");
        const data = before ? pixels.data : adjustPixels(pixels.data, exposure, contrast);
        context.putImageData(new ImageData(new Uint8ClampedArray(data), pixels.width, pixels.height), 0, 0);
        setError("");
      } catch (error) { setError(error.message || "Không thể xử lý preview."); }
    });
    return () => cancelAnimationFrame(frame);
  }, [source, exposure, contrast, before]);

  function reset() { setExposure(0); setContrast(0); setBefore(false); }
  function clear() {
    request.current += 1; setSource(null); setLoading(false); setError(""); reset();
  }
  async function choose(files) {
    if (!files.length) return;
    clear();
    if (files.length !== 1) { setError("Mỗi lần chọn một ảnh."); return; }
    const id = request.current;
    setLoading(true);
    try {
      const preview = await loadLabPreview(files[0]);
      if (id === request.current) setSource(preview);
    } catch (error) {
      if (id === request.current) setError(error.message || "Không thể tạo preview.");
    } finally { if (id === request.current) setLoading(false); }
  }

  return <div className="workbench color-lab">
    <section className="panel viewer" aria-label="Preview Color Lab">
      <div className="panel-heading gallery-toolbar"><h2>{source?.name || "Ảnh chỉnh màu"}</h2>
        <div><button className="choose-button" onClick={() => input.current.click()}>Chọn ảnh</button>
          {(source || loading) && <button className="remove-button" onClick={clear}>Gỡ ảnh</button>}</div></div>
      <input ref={input} type="file" hidden accept=".jpg,.jpeg,.png,.webp" aria-label="Chọn ảnh cho Color Lab"
        onChange={event => { void choose(Array.from(event.target.files)); event.target.value = ""; }} />
      <div className={`stage${source ? " has-photo" : ""}`} aria-busy={loading}
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); void choose(Array.from(event.dataTransfer.files)); }}>
        {loading ? <p role="status">Đang tạo preview…</p> : source ?
          <canvas ref={canvas} width={source.pixels.width} height={source.pixels.height} className="preview-image"
            role="img" aria-label={`${before ? "Trước chỉnh sửa" : "Sau chỉnh sửa"}: ${source.name}`} /> :
          <div className="empty-state"><h3>Thử ánh sáng và tương phản.</h3><p>Chọn hoặc kéo ảnh vào đây.</p>
            <p className="file-hint">JPEG / PNG / WebP · 32 MiB · 64 MP</p></div>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="session-note">Preview tối đa 1600 px cạnh dài. Ảnh gốc được giữ nguyên; chưa hỗ trợ xuất ảnh.</p>
    </section>
    <section className="panel inspector" aria-label="Công cụ chỉnh màu">
      <div className="panel-heading"><h2>Điều chỉnh preview</h2></div>
      <fieldset className="lab-controls" disabled={!source || loading}>
        <label>Exposure <output>{exposure.toFixed(1)} EV</output>
          <input type="range" min="-3" max="3" step="0.1" value={exposure}
            onChange={event => { setExposure(Number(event.target.value)); setBefore(false); }} /></label>
        <label>Contrast <output>{contrast > 0 ? "+" : ""}{contrast}</output>
          <input type="range" min="-100" max="100" step="1" value={contrast}
            onChange={event => { setContrast(Number(event.target.value)); setBefore(false); }} /></label>
        <div className="journal-actions"><button type="button" className="read-button" aria-pressed={before}
          onClick={() => setBefore(value => !value)}>{before ? "Xem sau chỉnh sửa" : "Xem trước chỉnh sửa"}</button>
          <button type="button" className="read-button" onClick={reset}>Reset</button></div>
      </fieldset>
      {source && <p className="request-status" role="status">{before ? "Đang xem trước chỉnh sửa" : "Đang xem sau chỉnh sửa"}</p>}
      <p className="inspector-note">Exposure thay đổi sáng trên preview sRGB; không phục hồi dữ liệu RAW hoặc vùng đã mất chi tiết. Contrast thay đổi độ dốc quanh mức giữa, không mô phỏng màu Fujifilm.</p>
      <p className="inspector-note">Ảnh xử lý trong trình duyệt, không gửi tới API. Thay đổi chỉ giữ trong phiên này.</p>
    </section>
  </div>;
}
