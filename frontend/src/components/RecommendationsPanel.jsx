import { useState } from "react";

export default function RecommendationsPanel({ recommendations }) {
  const [dismissed, setDismissed] = useState([]);
  const [message, setMessage] = useState("");
  const visible = recommendations?.filter(item => !dismissed.includes(item.id));
  return <section className="recommendations-panel" aria-labelledby="recommendations-title">
    <h3 id="recommendations-title">Gợi ý chỉnh sửa</h3>
    <p>Gợi ý theo quy tắc từ số đo ảnh, không phải mô hình AI. Hãy chọn theo chủ đích của bạn; chưa có chỉnh sửa nào được áp dụng.</p>
    {!recommendations ? <p>Chọn ảnh và đọc lại với Backend mới để xem gợi ý.</p> :
      recommendations.length === 0 ? <p>Không có gợi ý theo các ngưỡng hiện tại. Điều này không khẳng định ảnh hoàn hảo hay cần chỉnh sửa.</p> :
        visible.length === 0 ? <p>Bạn đã bỏ qua tất cả gợi ý.</p> :
          <ul className="recommendation-list">{visible.map(item => <li key={item.id}>
            <h4>{item.title}</h4>
            <p>{item.reason}</p><p>{item.consideration}</p>
            <button type="button" className="read-button" aria-label={`Bỏ qua: ${item.title}`} onClick={() => {
              setDismissed(current => [...current, item.id]);
              setMessage(`Đã bỏ qua: ${item.title}`);
            }}>Bỏ qua</button>
          </li>)}</ul>}
    {dismissed.length > 0 && <button type="button" className="read-button" onClick={() => {
      setDismissed([]); setMessage("Đã hiện lại các gợi ý.");
    }}>Hiện lại gợi ý đã bỏ qua</button>}
    <p role="status">{message}</p>
  </section>;
}
