import ExposurePanel from "./ExposurePanel.jsx";
import ContrastPanel from "./ContrastPanel.jsx";
import ColorPanel from "./ColorPanel.jsx";
import SharpnessPanel from "./SharpnessPanel.jsx";

const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const channels = [
  ["red", "Đỏ · R", "#ff9999"],
  ["green", "Lục · G", "#99d9a8"],
  ["blue", "Lam · B", "#91baff"],
  ["brightness", "Độ sáng · Y′", "#e9e9e5"],
];

export default function HistogramPanel({ analysis, loading, error }) {
  return <section className="histogram-panel" aria-labelledby="histogram-title" aria-busy={loading}>
    <h3 id="histogram-title">Histogram RGB & độ sáng</h3>
    {loading ? <p role="status">Đang phân tích pixel ảnh…</p> : error ?
      <p>Chưa có histogram. Hãy thử đọc lại ảnh.</p> : !analysis ?
        <p>Chọn ảnh để xem phân bố màu và độ sáng.</p> : <>
          {channels.map(([key, label, color]) => {
            const values = analysis[key];
            const peak = Math.max(1, ...values);
            return <figure key={key} className="histogram-chart">
              <figcaption>{label}<span>Đỉnh: {number.format(peak)} pixel</span></figcaption>
              <svg viewBox="0 0 256 80" preserveAspectRatio="none" role="img" aria-label={`Histogram ${label}, 256 mức từ 0 đến 255; số pixel lớn nhất ở một mức: ${peak}`}>
                {values.map((count, level) => <rect key={level} x={level} y={80 - count / peak * 80}
                  width="1" height={count / peak * 80} fill={color} />)}
              </svg>
              <div className="histogram-axis" aria-hidden="true"><span>0</span><span>255</span></div>
            </figure>;
          })}
          <dl className="metadata">
            <div><dt>Sáng trung bình</dt><dd>{number.format(analysis.mean_brightness)} / 255</dd></div>
            <div><dt>Pixel phân tích</dt><dd>{number.format(analysis.pixel_count)}</dd></div>
          </dl>
          <ExposurePanel exposure={analysis.exposure} />
          <ContrastPanel contrast={analysis.contrast} />
          <ColorPanel color={analysis.color} />
          <SharpnessPanel sharpness={analysis.sharpness} />
          <p>Mỗi biểu đồ có trục đứng riêng theo đỉnh. Trục ngang: mức tối → sáng; trục đứng: số pixel.</p>
          <p>Y′ = 0,299R + 0,587G + 0,114B, làm tròn về 8-bit. Đây là độ sáng luma, không phải điểm chất lượng ảnh hay mô hình AI.</p>
          {analysis.transparency_composited && <p>Vùng trong suốt được ghép trên nền trắng để đo; preview có thể dùng nền khác.</p>}
          <p>Đo toàn bộ pixel của khung hình đầu tiên. Chưa chuyển đổi ICC; ảnh màu rộng hoặc CMYK có thể khác preview. Ảnh grayscale 16-bit được quy về 256 mức.</p>
          <p>Ảnh sáng hoặc tối có thể là chủ đích nghệ thuật.</p>
        </>}
  </section>;
}
