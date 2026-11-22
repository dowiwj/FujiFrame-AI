import { useEffect, useRef, useState } from "react";
import { inspectImage } from "../services/images.js";

const MAX_FILE_BYTES = 32 * 1024 * 1024;
const number = new Intl.NumberFormat("vi-VN");

export default function ImageUpload() {
  const input = useRef(null);
  const activeRequest = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => () => {
    if (selection) URL.revokeObjectURL(selection.url);
  }, [selection]);

  function chooseFiles(files) {
    if (!files.length) return;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setMetadata(null);
    setPreviewFailed(false);
    setError("");

    const file = files[0];
    if (files.length > 1 || file.size === 0 || file.size > MAX_FILE_BYTES) {
      setSelection(null);
      if (files.length > 1) setError("Mỗi lần chỉ chọn một ảnh.");
      else if (file.size === 0) setError("Tệp đã chọn trống.");
      else setError("Dung lượng ảnh vượt quá 32 MiB.");
      return;
    }
    setSelection({ file, url: URL.createObjectURL(file) });
  }

  async function readMetadata() {
    if (!selection || activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await inspectImage(selection.file, controller.signal);
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
    ["Dung lượng", metadata && number.format(metadata.size_bytes) + " byte"],
  ];

  const selectButton = (
    <button type="button" className="choose-button" onClick={() => input.current.click()}>
      {selection ? "Đổi ảnh" : "Chọn ảnh"}
    </button>
  );

  return (
    <div className="workbench">
      <section className="panel viewer" aria-labelledby="preview-title">
        <div className="panel-heading flex items-center justify-between gap-3">
          <h2 id="preview-title">Khung xem trước</h2>
          {selection && selectButton}
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
          className={"stage" + (dragging ? " is-dragging" : "")}
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
              <img key={selection.url} className="preview-image" src={selection.url}
                alt={"Ảnh xem trước: " + selection.file.name}
                onError={() => setPreviewFailed(true)} />
            )
          ) : (
            <div className="empty-state">
              <span className="focus-mark" aria-hidden="true" />
              <h3>Thả ảnh vào đây</h3>
              <p>JPEG hoặc PNG · Tối đa 32 MiB và 64 MP</p>
              {selectButton}
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
          <dl aria-busy={loading}>
            {rows.map(([label, value]) => (
              <div key={label} className="metric">
                <dt>{label}</dt><dd>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="read-button" onClick={readMetadata}
            disabled={!selection || loading || !!metadata}>
            {loading ? "Đang đọc…" : metadata ? "Đã đọc thông số" : "Đọc thông số"}
          </button>
          <p className="sr-only" role="status">
            {loading && "Đang kiểm tra ảnh trên máy của bạn."}
            {metadata && "Đã đọc thông số từ tệp gốc."}
          </p>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}
