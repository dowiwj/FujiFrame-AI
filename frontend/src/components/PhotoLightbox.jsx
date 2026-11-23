import { useEffect, useRef } from "react";

export default function PhotoLightbox({ selection, rows, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog className="lightbox" ref={dialog} onCancel={onClose}
    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } }} aria-label="Xem ảnh lớn">
    <div className="lightbox-toolbar"><span>{selection.file.name}</span><button onClick={onClose} autoFocus>Đóng ×</button></div>
    <img src={selection.url} alt={selection.file.name} />
    <dl className="metadata">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "—"}</dd></div>)}</dl>
  </dialog>;
}
