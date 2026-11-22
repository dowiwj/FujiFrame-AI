import ImageUpload from "./components/ImageUpload.jsx";

export default function App() {
  return (
    <>
      <header className="masthead">
        <div className="shell flex items-center justify-between gap-4">
          <div className="wordmark">
            <span className="film-mark" aria-hidden="true" />
            <span>FujiFrame <span className="brand-ai">AI</span></span>
          </div>
          <span className="local-label">Studio local</span>
        </div>
      </header>
      <main className="shell">
        <div className="intro">
          <h1>Bàn kiểm ảnh</h1>
          <p>Xem trước và đọc thông số gốc của ảnh ngay trên máy của bạn.</p>
        </div>
        <ImageUpload />
      </main>
    </>
  );
}
