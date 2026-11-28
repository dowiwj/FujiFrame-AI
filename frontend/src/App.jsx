import { useEffect, useState } from "react";
import PhotoDetail from "./components/PhotoDetail.jsx";
import ImageUpload from "./components/ImageUpload.jsx";
import Gallery from "./components/Gallery.jsx";
import ColorLab from "./components/ColorLab.jsx";

export default function App() {
  const [view, setView] = useState("gallery");
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const sync = () => { setHash(window.location.hash); setView("gallery"); };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const photoId = hash.startsWith("#photo/") ? hash.slice(7) : null;
  function navigate(next) {
    if (photoId !== null) {
      window.history.pushState(null, "", "#gallery");
      setHash("#gallery");
    }
    setView(next);
  }
  return (
    <div className={`app theme-${view === "gallery" ? "gallery" : "studio"}`}>
      <header className="site-header shell">
        <button className="wordmark" onClick={() => navigate("gallery")}>FUJIFRAME<span>AI</span></button>
        <nav aria-label="Điều hướng chính">
          <button aria-current={view === "gallery" ? "page" : undefined} onClick={() => navigate("gallery")}>Gallery</button>
          <button aria-current={view === "studio" ? "page" : undefined} onClick={() => navigate("studio")}>AI Studio</button>
          <button aria-current={view === "lab" ? "page" : undefined} onClick={() => navigate("lab")}>Color Lab</button>
        </nav>
        <span className="local-label">Không gian ảnh cá nhân</span>
      </header>
      <main className="shell">
        <div className="page-heading" hidden={photoId !== null}>
          <div><p className="eyebrow">{view === "gallery" ? "A personal photography journal" : "Your local photography workspace"}</p>
            <h1>{view === "gallery" ? "Gallery" : view === "lab" ? "Color Lab" : "AI Studio"}</h1></div>
          <p>{view === "gallery" ? "Những khoảnh khắc, trong ánh sáng của riêng mình." : view === "lab" ? "Thử ánh sáng. Giữ nguyên ảnh gốc." : "Xem ảnh trọn vẹn. Hiểu rõ từng thông số."}</p>
        </div>
        <div hidden={view !== "gallery" || photoId !== null}><Gallery /></div>
        {photoId !== null && <PhotoDetail key={photoId} id={photoId} />}
        <div hidden={view !== "studio"}><ImageUpload view="studio" /></div>
        <div hidden={view !== "lab"}><ColorLab /></div>
      </main>
      <footer className="shell site-footer"><span>FUJIFRAME — PERSONAL PHOTOGRAPHY</span><span>Ảnh của bạn. Góc nhìn của bạn.</span></footer>
    </div>
  );
}
