const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 2 });

export default function ColorPanel({ color }) {
  if (!color) return <p>Chưa có số đo màu. Hãy đọc lại ảnh với Backend mới.</p>;
  const peak = Math.max(1, ...color.saturation);
  return <section className="exposure-panel" aria-labelledby="color-title">
    <h4 id="color-title">Màu & độ bão hòa</h4>
    <dl className="tone-values">
      <div><dt>RGB trung bình<small>Từng kênh trên thang 0–255</small></dt>
        <dd>R {number.format(color.mean_red)}<br />G {number.format(color.mean_green)}<br />B {number.format(color.mean_blue)}</dd></div>
      <div><dt>Saturation trung bình<small>Trung bình S của từng pixel trong HSV</small></dt>
        <dd>{percent.format(color.mean_saturation)}</dd></div>
    </dl>
    <figure className="histogram-chart">
      <figcaption>Saturation · S<span>Đỉnh: {number.format(peak)} pixel</span></figcaption>
      <svg viewBox="0 0 256 80" preserveAspectRatio="none" role="img"
        aria-label={`Histogram saturation, từ 0% đến 100%, 256 mức; đỉnh ${peak} pixel`}>
        {color.saturation.map((count, level) => <rect key={level} x={level} y={80 - count / peak * 80}
          width="1" height={count / peak * 80} fill="currentColor" />)}
      </svg>
      <div className="histogram-axis" aria-hidden="true"><span>0%</span><span>100%</span></div>
    </figure>
    <p>Saturation đo mức chênh lệch giữa các kênh so với kênh sáng nhất. Đen và xám có S = 0; ảnh nhiều màu đối lập vẫn có thể có RGB trung bình gần bằng nhau.</p>
    <p>Chênh lệch RGB có thể đến từ chủ thể hoặc ánh sáng, chưa đủ kết luận sai cân bằng trắng. Saturation thấp có thể là chủ đích; đây không phải điểm chất lượng màu.</p>
  </section>;
}
