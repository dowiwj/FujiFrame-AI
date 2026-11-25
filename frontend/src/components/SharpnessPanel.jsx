const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export default function SharpnessPanel({ sharpness }) {
  return <section className="exposure-panel" aria-labelledby="sharpness-title">
    <h4 id="sharpness-title">Chi tiết & độ nét tham khảo</h4>
    {sharpness?.rms_neighbor_difference == null ?
      <p>Chưa có số đo: ảnh cần có pixel lân cận và dùng chế độ màu 8-bit được hỗ trợ. Grayscale 16-bit chưa được đo.</p> :
      <dl className="tone-values">
        <div><dt>Chênh lệch luma RMS<small>Thang 0–255, không phải điểm chất lượng</small></dt>
          <dd>{number.format(sharpness.rms_neighbor_difference)}</dd></div>
        <div><dt>Cặp pixel đã đo</dt><dd>{number.format(sharpness.pair_count)}</dd></div>
      </dl>}
    <p>Đo thay đổi sáng giữa pixel ngang và dọc trong từng khối 1024 px; bỏ qua cặp nằm qua biên khối. Không resize ảnh trước khi đo.</p>
    <p>Giá trị lớn có thể do chi tiết, tương phản hoặc nhiễu. Giá trị thấp có thể do nền trơn hay chủ đích mềm nét. Chỉ nên so sánh cùng cảnh, kích thước và cách xử lý; không dùng để kết luận ảnh mất nét.</p>
  </section>;
}
