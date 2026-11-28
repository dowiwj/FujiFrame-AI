import { useEffect, useRef, useState } from "react";
import { applyLabAdjustments, DEFAULT_LAB_SETTINGS, loadLabPreview } from "../services/colorLab.js";

const GROUPS = [
  ["Ánh sáng", [["exposure", "Exposure", -3, 3, 0.1, " EV"], ["contrast", "Contrast", -100, 100], ["highlights", "Highlights", -100, 100], ["shadows", "Shadows", -100, 100]]],
  ["Màu sắc", [["temperature", "Temperature", -100, 100], ["tint", "Tint", -100, 100], ["saturation", "Saturation", -100, 100], ["vibrance", "Vibrance", -100, 100]]],
  ["Tone Curve", [["curveShadows", "Điểm tối", -100, 100], ["curveMidtones", "Điểm giữa", -100, 100], ["curveHighlights", "Điểm sáng", -100, 100]]],
  ["Hoàn thiện", [["grain", "Film Grain", 0, 100]]],
];
const HUE_LABELS = { red: "Đỏ", orange: "Cam", yellow: "Vàng", green: "Lục", aqua: "Cyan", blue: "Lam", purple: "Tím", magenta: "Hồng" };
const HSL_CONTROLS = [["hue", "Hue", -180, 180], ["saturation", "Saturation", -100, 100], ["lightness", "Lightness", -100, 100]];
const PRESETS = {
  neutral: { label: "Không preset", settings: {} },
  muted: { label: "Classic Chrome-inspired", settings: { contrast: -8, highlights: -12, shadows: 10, saturation: -12, grain: 16 } },
  vivid: { label: "Velvia-inspired", settings: { contrast: 12, highlights: -10, vibrance: 22, saturation: 6 } },
  warm: { label: "Warm portrait", settings: { temperature: 16, tint: 4, highlights: -8, shadows: 6, grain: 8 } },
};
const freshSettings = () => ({ ...DEFAULT_LAB_SETTINGS, hsl: Object.fromEntries(Object.entries(DEFAULT_LAB_SETTINGS.hsl).map(([key, value]) => [key, { ...value }])) });

function Slider({ label, value, min, max, step = 1, suffix = "", onChange }) {
  return <label className="lab-slider"><span>{label}<output>{value > 0 ? "+" : ""}{value.toFixed(step === 0.1 ? 1 : 0)}{suffix}</output></span>
    <input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
  </label>;
}

export default function ColorLab() {
  const [source, setSource] = useState(null);
  const [settings, setSettings] = useState(freshSettings);
  const [selectedHue, setSelectedHue] = useState("red");
  const [preset, setPreset] = useState("neutral");
  const [before, setBefore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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
        const data = before ? pixels.data : applyLabAdjustments(pixels.data, settings);
        context.putImageData(new ImageData(data, pixels.width, pixels.height), 0, 0);
        setError("");
      } catch (failure) { setError(failure.message || "Không thể xử lý preview."); }
    });
    return () => cancelAnimationFrame(frame);
  }, [source, settings, before]);

  function reset() { setSettings(freshSettings()); setPreset("neutral"); setBefore(false); }
  function clear() { request.current += 1; setSource(null); setLoading(false); setError(""); reset(); }
  async function choose(files) {
    if (!files.length) return;
    clear();
    if (files.length !== 1) { setError("Mỗi lần chọn một ảnh."); return; }
    const id = request.current;
    setLoading(true);
    try {
      const preview = await loadLabPreview(files[0]);
      if (id === request.current) setSource(preview);
    } catch (failure) {
      if (id === request.current) setError(failure.message || "Không thể tạo preview.");
    } finally { if (id === request.current) setLoading(false); }
  }
  function setControl(key, value) {
    setSettings(current => ({ ...current, [key]: value }));
    setPreset("custom");
    setBefore(false);
  }
  function setHueControl(key, value) {
    setSettings(current => ({ ...current, hsl: { ...current.hsl, [selectedHue]: { ...current.hsl[selectedHue], [key]: value } } }));
    setPreset("custom");
    setBefore(false);
  }
  function choosePreset(key) {
    setPreset(key);
    setSettings({ ...freshSettings(), ...PRESETS[key].settings });
    setBefore(false);
  }
  async function exportPng() {
    if (!source || exporting) return;
    setExporting(true);
    setError("");
    try {
      const { pixels } = source;
      const output = document.createElement("canvas");
      output.width = pixels.width; output.height = pixels.height;
      const context = output.getContext("2d", { colorSpace: "srgb" });
      if (!context) throw new Error("Trình duyệt không hỗ trợ xuất ảnh.");
      context.putImageData(new ImageData(applyLabAdjustments(pixels.data, settings), pixels.width, pixels.height), 0, 0);
      const blob = await new Promise((resolve, reject) => output.toBlob(value => value ? resolve(value) : reject(new Error("Không thể tạo tệp PNG.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = source.name.replace(/\.[^.]+$/, "") + "-fujiframe.png";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (failure) { setError(failure.message || "Không thể xuất ảnh."); }
    finally { setExporting(false); }
  }

  return <div className={"workbench color-lab" + (source ? " has-source" : "")}>
    <section className="panel viewer" aria-label="Preview Color Lab">
      <div className="panel-heading gallery-toolbar"><h2>{source?.name || "Ảnh chỉnh màu"}</h2>
        <div><button type="button" className="choose-button" onClick={() => input.current?.click()}>Chọn ảnh</button>
          {(source || loading) && <button type="button" className="remove-button" onClick={clear}>Gỡ ảnh</button>}</div></div>
      <input ref={input} type="file" hidden accept=".jpg,.jpeg,.png,.webp" aria-label="Chọn ảnh cho Color Lab"
        onChange={event => { void choose(Array.from(event.target.files)); event.target.value = ""; }} />
      <div className={"stage" + (source ? " has-photo" : "")} aria-busy={loading}
        onDragOver={event => event.preventDefault()}
        onDrop={event => { event.preventDefault(); void choose(Array.from(event.dataTransfer.files)); }}>
        {loading ? <p role="status">Đang tạo preview…</p> : source ?
          <canvas ref={canvas} width={source.pixels.width} height={source.pixels.height} className="preview-image"
            role="img" aria-label={(before ? "Trước chỉnh sửa" : "Sau chỉnh sửa") + ": " + source.name} /> :
          <div className="empty-state"><h3>Bắt đầu từ ánh sáng và màu sắc.</h3><p>Chọn hoặc kéo ảnh vào đây.</p>
            <p className="file-hint">JPEG / PNG / WebP · 32 MiB · 64 MP</p></div>}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <p className="session-note">Chỉnh sửa trong trình duyệt, không ghi đè ảnh gốc. Export PNG dùng preview tối đa 1600 px cạnh dài, không giữ EXIF.</p>
    </section>
    <section className="panel inspector" aria-label="Công cụ chỉnh màu">
      <div className="panel-heading"><h2>Điều chỉnh ảnh</h2></div>
      <fieldset className="lab-controls" disabled={!source || loading || exporting}>
        <div className="lab-group lab-preset"><h3>Gợi ý phong cách</h3>
          <label className="lab-hue-select">Preset <select value={preset} onChange={event => choosePreset(event.target.value)}>
            {preset === "custom" && <option value="custom">Tùy chỉnh</option>}
            {Object.entries(PRESETS).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}
          </select></label>
          <p className="inspector-note">Các preset là phong cách gợi ý, không tái tạo thuật toán Fujifilm.</p>
        </div>
        {GROUPS.map(([title, controls]) => <div className="lab-group" key={title}><h3>{title}</h3>
          {controls.map(([key, label, min, max, step, suffix]) => <Slider key={key} label={label} value={settings[key]}
            min={min} max={max} step={step} suffix={suffix} onChange={value => setControl(key, value)} />)}</div>)}
        <div className="lab-group"><h3>HSL theo dải màu</h3>
          <label className="lab-hue-select">Dải màu <select value={selectedHue} onChange={event => setSelectedHue(event.target.value)}>
            {Object.entries(HUE_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          {HSL_CONTROLS.map(([key, label, min, max]) => <Slider key={selectedHue + key} label={label}
            value={settings.hsl[selectedHue][key]} min={min} max={max} onChange={value => setHueControl(key, value)} />)}
        </div>
        <div className="journal-actions lab-actions"><button type="button" className="read-button" aria-pressed={before}
          onClick={() => setBefore(value => !value)}>{before ? "Xem sau" : "Xem trước"}</button>
          <button type="button" className="read-button" onClick={reset}>Reset</button>
          <button type="button" className="choose-button" onClick={() => void exportPng()}>{exporting ? "Đang xuất…" : "Export PNG"}</button></div>
      </fieldset>
      {source && <p className="request-status" role="status">{before ? "Đang xem ảnh gốc" : "Đang xem bản chỉnh sửa"}</p>}
      <p className="inspector-note">Tone Curve điều chỉnh ba điểm tối/giữa/sáng; HSL hòa trộn các dải màu kề nhau. Đây là công cụ sRGB 8-bit, không phải RAW editor.</p>
    </section>
  </div>;
}
