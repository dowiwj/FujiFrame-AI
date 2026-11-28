import { useEffect, useRef, useState } from "react";
import { inspectImage } from "../services/images.js";
import PhotoLightbox from "./PhotoLightbox.jsx";
import HistogramPanel from "./HistogramPanel.jsx";
import RecommendationsPanel from "./RecommendationsPanel.jsx";

const MAX_FILE_BYTES = 32 * 1024 * 1024;
const number = new Intl.NumberFormat("vi-VN");
const megabytes = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export default function ImageUpload({ view }) {
  const input = useRef(null);
  const activeRequest = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => () => {
    if (selection) URL.revokeObjectURL(selection.url);
  }, [selection]);

  function clearSelection() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setMetadata(null);
    setPreviewFailed(false);
    setError("");
    setSelection(null);
    setExpanded(false);
  }

  function chooseFiles(files) {
    if (!files.length) return;
    clearSelection();
    const file = files[0];
    if (files.length > 1 || file.size === 0 || file.size > MAX_FILE_BYTES) {
      if (files.length > 1) setError("Mỗi lần chỉ chọn một ảnh.");
      else if (file.size === 0) setError("Tệp đã chọn trống.");
      else setError("Dung lượng ảnh vượt quá 32 MiB.");
      return;
    }
    setSelection({ file, url: URL.createObjectURL(file) });
    void readMetadata(file);
  }

  async function readMetadata(file = selection?.file) {
    if (!file || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setMetadata(null);
    setError("");
    try {
      const result = await inspectImage(file, controller.signal);
      if (!controller.signal.aborted) setMetadata(result);
    } catch (requestError) {
      if (!controller.signal.aborted) setError(requestError.message);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }

  const rows = [
    ["Định dạng", metadata?.format],
    ["Chiều rộng", metadata && number.format(metadata.width) + " px"],
    ["Chiều cao", metadata && number.format(metadata.height) + " px"],
    ["Dung lượng", metadata && (metadata.size_bytes < 10_000
      ? "< 0,01 MB"
      : megabytes.format(metadata.size_bytes / 1_000_000) + " MB")],
  ];

  const selectButton = (
    <button type="button" className="choose-button" onClick={() => input.current.click()}>
      {selection ? "Đổi ảnh" : "Chọn ảnh ↗"}
    </button>
  );

  return (
    <>
    <div className="workbench">
      <section className="panel viewer" aria-labelledby="preview-title">
        <div className="panel-heading flex flex-wrap items-center justify-between gap-3">
          <h2 id="preview-title">{selection ? "01 / Ảnh đang xem" : "01 / Chưa chọn ảnh"}</h2>
          {selection && (
            <div className="flex items-center gap-2">
              {selectButton}
              <button type="button" className="remove-button" onClick={clearSelection}>Gỡ ảnh</button>
            </div>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          aria-label="Chọn tệp ảnh"
          hidden
          onChange={(event) => {
            chooseFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div
          className={"stage" + (selection ? " has-photo" : "") + (dragging ? " is-dragging" : "")}
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => {
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            chooseFiles(event.dataTransfer.files);
          }}
        >
          {selection ? (
            previewFailed ? (
              <p className="preview-fallback">Trình duyệt không thể xem trước tệp này.</p>
            ) : (
              <button className="photo-button" onClick={() => setExpanded(true)} aria-label="Mở ảnh lớn">
              <img key={selection.url} className="preview-image" src={selection.url}
                alt={"Ảnh xem trước: " + selection.file.name}
                onError={() => setPreviewFailed(true)} />
              </button>
            )
          ) : (
            <div className="empty-state">
              <span className="empty-index" aria-hidden="true">01</span>
              <h3>{view === "gallery" ? "Mỗi bức ảnh, một câu chuyện." : "Bắt đầu từ một bức ảnh."}</h3>
              <p>Kéo ảnh vào đây hoặc chọn từ máy của bạn.</p>
              {selectButton}
              <p className="file-hint">JPEG / PNG · Tối đa 32 MiB · 64 MP</p>
            </div>
          )}
        </div>
        <div className="file-strip">
          <span>Tệp nguồn</span>
          <strong title={selection?.file.name}>{selection?.file.name || "Chưa chọn ảnh"}</strong>
        </div>
      </section>
      <section className="panel inspector" aria-labelledby="metadata-title">
        <div className="panel-heading"><h2 id="metadata-title">Thông số ảnh</h2></div>
        <div className="inspector-body">
          <dl className="metadata" aria-busy={loading}>
            {rows.map(([label, value]) => (
              <div key={label} className="metric">
                <dt>{label}</dt><dd>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="request-status" role="status">
            {loading ? "Đang đọc và phân tích ảnh…" : metadata ? "Đã đọc thông số và phân tích pixel ảnh." : "Thông số được đọc tự động khi chọn ảnh."}
          </p>
          {error && <p className="error" role="alert">{error}</p>}
          {error && selection && <button className="read-button" disabled={loading} onClick={() => readMetadata()}>Thử đọc lại</button>}
          {view === "studio" && <>
            <p className="inspector-note">Camera, lens và thông số chụp chưa được hỗ trợ. Ảnh gốc được giữ nguyên.</p>
            <HistogramPanel analysis={metadata?.analysis} loading={loading} error={error} />
            {metadata && !loading && !error && <RecommendationsPanel key={selection?.url} recommendations={metadata.recommendations} />}
          </>}
        </div>
      </section>
    </div>
    {view === "gallery" && <p className="session-note">Phiên xem ảnh local · Ảnh không được lưu vào thư viện sau khi tải lại trang.</p>}
    {expanded && selection && <PhotoLightbox selection={selection} rows={rows} onClose={() => setExpanded(false)} />}
    </>
  );
}
