const percent = new Intl.NumberFormat("vi-VN", { style: "percent", maximumFractionDigits: 2 });
const count = new Intl.NumberFormat("vi-VN");
const bands = [
  ["shadows", "Shadows · Vùng tối"],
  ["midtones", "Midtones · Trung gian"],
  ["highlights", "Highlights · Vùng sáng"],
];
const extremes = [["near_black", "Gần đen"], ["near_white", "Gần trắng"]];

export default function ExposurePanel({ exposure }) {
  if (!exposure) return <p>Chưa có phân bố sáng. Hãy đọc lại ảnh với Backend mới.</p>;
  return <section className="exposure-panel" aria-labelledby="exposure-title">
    <h4 id="exposure-title">Phân bố vùng sáng</h4>
    <div className="tone-bar" aria-hidden="true">
      {bands.map(([key]) => <span key={key} className={`tone-${key}`} style={{ width: `${exposure[key].fraction * 100}%` }} />)}
    </div>
    <dl className="tone-values">
      {[...bands, ...extremes].map(([key, label]) => {
        const value = exposure[key];
        return <div key={key}>
          <dt>{label}<small>Y′ {value.minimum}–{value.maximum}</small></dt>
          <dd>{percent.format(value.fraction)}<small>{count.format(value.pixel_count)} pixel</small></dd>
        </div>;
      })}
    </dl>
    <p>Ngưỡng tham khảo trên thang luma 0–255, tính cả hai đầu mút. Ba dải sáng chiếm 100%; tỷ lệ hiển thị có thể lệch nhẹ do làm tròn.</p>
    <p>Gần đen nằm trong shadows; gần trắng nằm trong highlights, không cộng thêm vào tổng.</p>
    <p>Các tỷ lệ này không xác nhận cháy sáng, mất chi tiết hay sai phơi sáng. Hãy đối chiếu với ảnh và chủ đích high-key / low-key của bạn.</p>
  </section>;
}
