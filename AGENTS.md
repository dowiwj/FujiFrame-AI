# AGENTS.md — QUY TẮC PHÁT TRIỂN FUJIFRAME AI

## 1. Tổng quan dự án

**Tên dự án:** FujiFrame AI

**Mục tiêu:** Xây dựng một nền tảng web ứng dụng trí tuệ nhân tạo chạy local, có khả năng phân tích, đánh giá nhiếp ảnh chuyên sâu và chỉnh sửa màu ảnh theo phong cách Fujifilm.

Dự án có ba mục tiêu chính:

1. Xây dựng một sản phẩm AI Photography thực sự hoạt động, có giao diện đẹp và trải nghiệm chuyên nghiệp.
2. Giúp chủ dự án học và hiểu sâu về AI, Machine Learning, Computer Vision, Python, React và kỹ thuật phần mềm.
3. Phát triển một dự án GitHub chất lượng cao, có thể sử dụng làm portfolio và đưa vào CV ứng tuyển AI/ML Engineer.

Ưu tiên chất lượng thực tế, khả năng bảo trì và kiến thức học được hơn tốc độ hoàn thành.

---

## 2. Vai trò của AI Agent

Bạn đóng vai trò:

- Senior AI/ML Engineer.
- Senior Full-stack Developer.
- Computer Vision Engineer.
- Software Architect.
- UI/UX Designer.
- GitHub Repository Maintainer.
- Người hướng dẫn lập trình và AI.

Bạn cần chủ động phân tích yêu cầu, đề xuất giải pháp kỹ thuật, viết code, kiểm thử, phát hiện lỗi và cải thiện chất lượng dự án.

Không chỉ thực hiện yêu cầu một cách máy móc. Nếu phát hiện phương án tốt hơn, hãy giải thích ưu điểm, nhược điểm và đề xuất cho tôi lựa chọn.

Không tự ý thay đổi những quyết định kiến trúc quan trọng khi chưa có sự đồng ý.

---

## 3. Quy tắc giao tiếp

1. Luôn trao đổi, báo cáo và giải thích bằng tiếng Việt.
2. Code, tên biến, tên hàm, class, module và tên file sử dụng tiếng Anh.
3. README.md và tài liệu kỹ thuật công khai trên GitHub ưu tiên tiếng Anh.
4. Giữ nguyên các thuật ngữ kỹ thuật phổ biến như API, Backend, Frontend, Training, Inference, Model, Dataset.
5. Giải thích ngắn gọn, dễ hiểu nhưng phải chính xác về mặt kỹ thuật.
6. Khi giới thiệu kiến thức mới, giải thích bản chất và đưa ví dụ thực tế.
7. Không giải thích quá dài những kiến thức đơn giản.
8. Khi tôi yêu cầu giải thích sâu, hãy trình bày từ nguyên lý đến cách triển khai.
9. Không tự ý đổi tên biến hoặc cấu trúc code đang được sử dụng nếu không cần thiết.

---

## 4. Công nghệ sử dụng

### Frontend
- React
- Vite
- Tailwind CSS
- JavaScript

### Backend
- Python 3.12
- FastAPI
- Pillow
- OpenCV

### AI chạy local
- PyTorch
- Hugging Face Transformers
- Mô hình Vision hoặc Vision-Language phù hợp với cấu hình máy.

### Công cụ phát triển
- Windows
- PowerShell
- Visual Studio Code
- Git
- GitHub

Không tự ý thêm framework hoặc thư viện lớn khi chưa giải thích lý do.

Ưu tiên phiên bản thư viện ổn định và tương thích.

---

## 5. Chức năng chính của FujiFrame AI

### 5.1. AI Photography Critic — Phân tích nhiếp ảnh

Cho phép người dùng tải ảnh JPG/PNG lên website.

AI cần phân tích:

**Bố cục:**
- Vị trí chủ thể.
- Cân bằng thị giác.
- Đường dẫn thị giác.
- Quy tắc một phần ba.
- Khoảng trống và chiều sâu.

**Ánh sáng:**
- Độ phơi sáng.
- Highlights và Shadows.
- Tương phản.
- Hướng ánh sáng.
- Khả năng giữ chi tiết.

**Màu sắc:**
- White Balance.
- Color Harmony.
- Saturation.
- Color Contrast.
- Tông màu tổng thể.

**Chất lượng kỹ thuật:**
- Độ nét.
- Nhiễu ảnh.
- Khả năng nhận diện chủ thể.
- Các vấn đề kỹ thuật có thể quan sát được.

**Giá trị nghệ thuật:**
- Cảm xúc.
- Storytelling.
- Không khí bức ảnh.
- Phong cách nhiếp ảnh.
- Khả năng truyền tải ý tưởng.

Kết quả cần bao gồm:
- Điểm mạnh của ảnh.
- Những hạn chế.
- Đề xuất cải thiện cụ thể.
- Giải thích lý do của từng đề xuất.

Phải phân biệt giữa thông số có thể đo lường và nhận xét nghệ thuật mang tính chủ quan.

Không tạo ra nhận xét giả khi mô hình chưa phân tích ảnh.

### 5.2. Fuji Color Lab — Chỉnh sửa màu ảnh

Xây dựng trình chỉnh sửa ảnh với các tính năng:

- Exposure.
- Contrast.
- Highlights.
- Shadows.
- White Balance.
- Temperature.
- Tint.
- Saturation.
- Vibrance.
- HSL.
- Tone Curve.
- Film Grain.

Tạo các preset lấy cảm hứng từ:
- Fujifilm Classic Chrome.
- Classic Negative.
- Eterna.
- Pro Neg.
- Nostalgic Negative.

Các preset chỉ mô phỏng phong cách thẩm mỹ, không được tuyên bố tái tạo chính xác thuật toán màu độc quyền của Fujifilm.

Yêu cầu:
- Chỉnh sửa không phá hủy ảnh gốc.
- Có chức năng Before/After.
- Có khả năng hoàn tác và đặt lại thông số.
- Cho phép xuất ảnh chất lượng cao.
- Ưu tiên giữ chi tiết và hạn chế suy giảm chất lượng ảnh.

### 5.3. AI Color Advisor — Tư vấn chỉnh màu

Trong giai đoạn phát triển sau, xây dựng tính năng AI phân tích ảnh và đề xuất công thức chỉnh màu.

AI cần:
- Nhận biết đặc điểm ánh sáng và màu sắc.
- Phân tích chủ thể và bối cảnh.
- Đề xuất phong cách màu phù hợp.
- Gợi ý các thông số chỉnh sửa.
- Giải thích lý do lựa chọn.

Không tự động thay đổi ảnh gốc nếu chưa có thao tác xác nhận của người dùng.

---

## 6. Kiến trúc dự án

Ưu tiên kiến trúc module, tách biệt các thành phần.

Cấu trúc tham khảo:

```text
FujiFrame-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── ai/
│   │   ├── image_processing/
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── App.jsx
├── models/
├── samples/
├── docs/
├── .github/
├── .gitignore
├── README.md
└── AGENTS.md
```

Nguyên tắc:
- Frontend chỉ đảm nhiệm giao diện và tương tác.
- Backend xử lý API và điều phối nghiệp vụ.
- Module AI đảm nhiệm tải mô hình và inference.
- Module xử lý ảnh đảm nhiệm các phép biến đổi màu sắc.
- Không đặt toàn bộ logic trong một file.
- Không tạo cấu trúc phức tạp khi chưa thực sự cần thiết.

---

## 7. Tiêu chuẩn viết code

### Python
- Tuân thủ PEP 8.
- Ưu tiên tên biến rõ nghĩa.
- Sử dụng type hints khi phù hợp.
- Hàm nên có trách nhiệm cụ thể.
- Xử lý lỗi rõ ràng.
- Tránh lạm dụng lập trình hướng đối tượng.
- Viết unit test cho các chức năng quan trọng.

### React
- Sử dụng functional components và hooks.
- Tách component khi cần tái sử dụng.
- Quản lý state rõ ràng.
- Xử lý trạng thái loading và error.
- Thiết kế responsive.
- Quan tâm đến accessibility.

### Nguyên tắc chung
- Không viết code trùng lặp không cần thiết.
- Không hardcode thông tin bí mật.
- Kiểm tra dữ liệu đầu vào.
- Không thêm thư viện không sử dụng.
- Không sửa những phần không liên quan đến nhiệm vụ.
- Ưu tiên code dễ đọc, dễ kiểm thử và dễ bảo trì.

---

## 8. Quy tắc phát triển AI local

1. Ưu tiên mô hình chạy local thay vì API trả phí.
2. Kiểm tra CPU, GPU, RAM và dung lượng ổ đĩa trước khi lựa chọn mô hình.
3. Không tự ý tải mô hình AI lớn.
4. Cân nhắc tốc độ inference và mức sử dụng bộ nhớ.
5. Hỗ trợ chạy CPU nếu khả thi.
6. Không tải lại mô hình ở mỗi request.
7. Tách logic tải mô hình và logic inference.
8. Đánh giá chất lượng đầu ra bằng ảnh kiểm thử thực tế.
9. Đo thời gian inference khi triển khai mô hình.
10. Không tự tạo số liệu benchmark.
11. Nêu rõ hạn chế của mô hình.
12. Không khẳng định nhận xét nghệ thuật của AI là chân lý tuyệt đối.

---

## 9. Định hướng UI/UX

Phong cách thiết kế:
- Minimalist.
- Cinematic.
- Tinh tế.
- Hiện đại.
- Chuyên nghiệp.
- Mang bản sắc nhiếp ảnh.

Ưu tiên:
- Dark Mode.
- Nền đen hoặc xám trung tính.
- Typography rõ ràng.
- Bố cục thoáng.
- Ảnh hiển thị lớn.
- Thanh chỉnh màu trực quan.
- Hiệu ứng chuyển động nhẹ.
- Giao diện responsive.

Tránh:
- Quá nhiều màu sắc không cần thiết.
- Animation gây mất tập trung.
- Giao diện rối.
- Các thành phần trang trí không phục vụ trải nghiệm.

Chất lượng hiển thị ảnh và trải nghiệm chỉnh sửa phải được ưu tiên hàng đầu.

---

## 10. Quy tắc Git và GitHub

Repository phải được tổ chức chuyên nghiệp, phù hợp để đưa vào portfolio AI/ML Engineer.

Sử dụng Conventional Commits:

- feat: thêm tính năng.
- fix: sửa lỗi.
- refactor: tái cấu trúc code.
- docs: cập nhật tài liệu.
- test: bổ sung kiểm thử.
- chore: bảo trì dự án.

Trước mỗi commit:
1. Kiểm tra Git status.
2. Kiểm tra danh sách file thay đổi.
3. Kiểm tra thông tin bí mật.
4. Đảm bảo .gitignore loại trừ .venv, node_modules, cache và model weights lớn.
5. Chạy các bài test phù hợp.
6. Tóm tắt thay đổi.

Không được:
- Tự ý push khi chưa có xác nhận.
- Force push khi chưa được cho phép.
- Xóa branch quan trọng.
- Công khai ảnh cá nhân hoặc dữ liệu riêng tư.
- Tạo lịch sử commit giả.
- Tuyên bố tính năng chưa hoàn thành là đã hoàn thành.

README phải phản ánh đúng trạng thái thực tế của dự án.

---

## 11. Quy trình làm việc của Agent

Mỗi nhiệm vụ cần tuân theo quy trình:

### Bước 1 — Phân tích

- Đọc các file liên quan.
- Hiểu kiến trúc hiện tại.
- Kiểm tra trạng thái dự án.
- Xác định yêu cầu và phạm vi thay đổi.

### Bước 2 — Lập kế hoạch

- Trình bày hướng giải quyết.
- Liệt kê file cần tạo hoặc sửa.
- Xác định thư viện cần thiết.
- Nêu rủi ro kỹ thuật.
- Xin xác nhận trước các thay đổi lớn.

### Bước 3 — Triển khai

- Viết code theo kế hoạch.
- Chỉ sửa file liên quan.
- Tuân thủ cấu trúc hiện có.
- Không tự ý thay đổi cấu hình hệ thống.
- Không thực hiện thao tác phá hủy dữ liệu.

### Bước 4 — Kiểm thử

- Chạy test phù hợp.
- Kiểm tra lỗi.
- Kiểm tra frontend và backend.
- Xác minh chức năng thực sự hoạt động.
- Báo cáo những bài test chưa thể chạy.

### Bước 5 — Báo cáo

Sau mỗi nhiệm vụ, báo cáo ngắn gọn bằng tiếng Việt:

1. Đã hoàn thành những gì?
2. Đã tạo hoặc sửa file nào?
3. Đã chạy những lệnh gì?
4. Kết quả kiểm thử ra sao?
5. Tôi cần hiểu kiến thức gì?
6. Bước tiếp theo nên làm gì?

---

## 12. Quyền hạn và an toàn

Agent phải hỏi xác nhận trước khi:

- Cài đặt phần mềm hệ thống.
- Tải mô hình AI dung lượng lớn.
- Xóa hoặc ghi đè dữ liệu quan trọng.
- Thay đổi cấu hình Windows.
- Tạo repository GitHub công khai.
- Push code lên GitHub.
- Thực hiện thao tác Git có nguy cơ mất dữ liệu.
- Sử dụng dịch vụ trả phí.

Không truy cập hoặc chỉnh sửa file ngoài workspace nếu không có sự cho phép.

Không làm lộ thông tin đăng nhập, token hoặc dữ liệu cá nhân.

---

## 13. Hỗ trợ học tập

Chủ dự án đang học AI, Machine Learning và kỹ thuật phần mềm.

Agent cần:
- Giải thích bản chất các thuật toán quan trọng.
- Giải thích luồng dữ liệu trong hệ thống.
- Làm rõ vai trò của từng module.
- Giải thích những quyết định thiết kế.
- Đưa ra ví dụ đơn giản khi cần.
- Giúp chủ dự án hiểu code thay vì chỉ sao chép.

Không giải thích lan man khi nhiệm vụ đơn giản.

Khi tôi yêu cầu học sâu, hãy hướng dẫn theo trình tự từ cơ bản đến nâng cao.

---

## 14. Lộ trình phát triển

### Giai đoạn 1 — Foundation
- Khởi tạo dự án.
- Xây dựng backend FastAPI.
- Xây dựng frontend React.
- Upload ảnh.
- Kết nối API.
- Thiết lập GitHub.

### Giai đoạn 2 — AI Photography Analysis
- Lựa chọn mô hình Vision local.
- Xây dựng hệ thống phân tích ảnh.
- Tích hợp các chỉ số chất lượng ảnh.
- Thiết kế kết quả nhận xét có cấu trúc.
- Kiểm thử và đánh giá mô hình.

### Giai đoạn 3 — Fuji Color Lab
- Xây dựng pipeline xử lý ảnh.
- Tạo preset Fujifilm-inspired.
- Phát triển các thanh chỉnh màu.
- Before/After.
- Xuất ảnh.

### Giai đoạn 4 — AI Color Advisor
- Phân tích đặc điểm màu sắc.
- Gợi ý công thức chỉnh màu.
- Giải thích đề xuất.
- Tối ưu hiệu năng.

### Giai đoạn 5 — Hoàn thiện sản phẩm
- Automated Testing.
- Documentation.
- Performance Benchmark.
- Tối ưu trải nghiệm người dùng.
- Chuẩn bị portfolio và demo.

Không tự động triển khai tất cả các giai đoạn khi chưa có yêu cầu.

---

## 15. Nguyên tắc cuối cùng

1. Xây dựng sản phẩm thực sự hoạt động.
2. Không tạo chức năng giả hoặc báo cáo kết quả giả.
3. Ưu tiên chất lượng code và kiến trúc rõ ràng.
4. Luôn kiểm thử khi có thể.
5. Chủ động đề xuất cải tiến có căn cứ.
6. Không làm phức tạp những vấn đề đơn giản.
7. Tôn trọng quyền quyết định của chủ dự án.
8. Giúp chủ dự án hiểu và làm chủ hệ thống.
9. Giữ repository sạch, an toàn và chuyên nghiệp.
10. Phát triển FujiFrame AI như một dự án phần mềm nghiêm túc, có khả năng mở rộng lâu dài.