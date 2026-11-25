const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

export default function ContrastPanel({ contrast }) {
  if (!contrast) return <p>Chưa có số đo tương phản. Hãy đọc lại ảnh với Backend mới.</p>;
  return <section className="exposure-panel" aria-labelledby="contrast-title">
    <h4 id="contrast-title">Tương phản toàn ảnh</h4>
    <dl className="tone-values">
      <div><dt>Độ lệch chuẩn luma<small>Độ phân tán quanh mức sáng trung bình</small></dt>
        <dd>{number.format(contrast.standard_deviation)}</dd></div>
      <div><dt>Khoảng P5–P95<small>Hiệu hai mốc phân vị trên thang 0–255</small></dt>
        <dd>{contrast.percentile_span}<small>{contrast.percentile_05} → {contrast.percentile_95}</small></dd></div>
    </dl>
    <p>Độ lệch chuẩn lớn hơn nghĩa là mức sáng phân tán hơn. P5 và P95 là mức luma tại vị trí 5% và 95% khi xếp pixel từ tối đến sáng.</p>
    <p>Khoảng phân vị giúp giảm ảnh hưởng của một ít pixel cực tối hoặc cực sáng. Các số đo không mô tả tương phản cục bộ hay dải tương phản của cảnh, và không đánh giá chất lượng nghệ thuật.</p>
  </section>;
}
