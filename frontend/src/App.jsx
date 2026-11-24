import { useState } from "react";
import ImageUpload from "./components/ImageUpload.jsx";
import Gallery from "./components/Gallery.jsx";

export default function App() {
  const [view, setView] = useState("gallery");
  return (
    <div className={`app theme-${view}`}>
      <header className="site-header shell">
        <button className="wordmark" onClick={() => setView("gallery")}>FUJIFRAME<span>AI</span></button>
        <nav aria-label="Điều hướng chính">
          <button aria-current={view === "gallery" ? "page" : undefined} onClick={() => setView("gallery")}>Gallery</button>
          <button aria-current={view === "studio" ? "page" : undefined} onClick={() => setView("studio")}>AI Studio</button>
        </nav>
        <span className="local-label">Không gian ảnh cá nhân</span>
      </header>
      <main className="shell">
        <div className="page-heading">
          <div><p className="eyebrow">{view === "gallery" ? "A personal photography journal" : "Your local photography workspace"}</p>
            <h1>{view === "gallery" ? "Gallery" : "AI Studio"}</h1></div>
          <p>{view === "gallery" ? "Những khoảnh khắc, trong ánh sáng của riêng mình." : "Xem ảnh trọn vẹn. Hiểu rõ từng thông số."}</p>
        </div>
        <div hidden={view !== "gallery"}><Gallery /></div>
        <div hidden={view !== "studio"}><ImageUpload view="studio" /></div>
      </main>
      <footer className="shell site-footer"><span>FUJIFRAME — PERSONAL PHOTOGRAPHY</span><span>Ảnh của bạn. Góc nhìn của bạn.</span></footer>
    </div>
  );
}
