# Thiết Kế Chi Tiết Chrome Extension: HUST ĐRL Helper (Kỳ 20261)

**Ngày khởi tạo**: 2026-08-11  
**Mục tiêu**: Xây dựng tiện ích mở rộng trên trình duyệt Chrome/Edge (Manifest V3) giúp sinh viên Đại học Bách khoa Hà Nội (HUST) tự động trích xuất điểm rèn luyện, phân tích 63 tiêu chí kỳ 20261 theo độ dễ và gợi ý lộ trình tích điểm tối ưu nhất.

---

## 1. Nỗi đau người dùng & Giải pháp (Problem & Solution)

### Nỗi đau thực tế của sinh viên HUST
* **Đổi mới quy chế**: Kỳ 20261 áp dụng cơ chế ĐRL mới với 6 danh mục lớn và 63 tiêu chí chi tiết. Sinh viên bỡ ngỡ không biết mục nào dễ lấy điểm, mục nào tự động cộng.
* **Tốn thời gian nhập tay**: Sinh viên không muốn ngồi tích chọn thủ công từng tiêu chí trên một trang web bên ngoài.

### Giải pháp sản phẩm: HUST ĐRL Helper (Chrome Extension)
* **Tự động trích xuất**: Khi sinh viên mở trang đánh giá ĐRL trên iCTSV (`ctsv.hust.edu.vn`), Extension tự động đọc dữ liệu JSON API `CriteriaTypeDetailsLst` để biết chính xác điểm số và danh mục sinh viên đã/chưa đạt.
* **Giao diện chèn trực tiếp (Injected Floating Panel)**: Hiển thị một widget gọn nhẹ ở góc phải màn hình iCTSV, phân tích xếp loại hiện tại và gợi ý các mục dễ nhất để đạt mốc điểm tiếp theo (Khá: 70đ, Giỏi: 80đ, Xuất sắc: 90đ).
* **Auto Scroll & Highlight**: Bấm vào mục gợi ý, trang web tự động cuộn đến đúng tiêu chí gốc để sinh viên thao tác.
* **Bảo mật tuyệt đối**: 100% dữ liệu xử lý tại máy sinh viên (Client-side), lưu tạm qua LocalStorage, không sử dụng server trung gian.

---

## 2. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

### 2.1 Công nghệ sử dụng
* **Nền tảng**: Chrome Extension Manifest V3.
* **Frontend**: HTML5, Vanilla CSS3 (Custom CSS Variables, Flexbox/Grid), Vanilla JavaScript (ES6+).
* **Isolation**: Shadow DOM (`attachShadow({mode: 'open'})`) để chèn UI vào trang iCTSV mà không bị ảnh hưởng bởi CSS/JS gốc của trường.

### 2.2 Cấu trúc thư mục dự án
```text
/home/aquistus/Documents/Project/
├── manifest.json                    # Cấu hình Manifest V3
├── icons/                           # App icons (16.png, 48.png, 128.png)
├── src/
│   ├── background/
│   │   └── background.js            # Service Worker lắng nghe webNavigation & messaging
│   ├── content/
│   │   ├── content_script.js        # Script can thiệp trang iCTSV, bắt API / DOM data
│   │   ├── injected_panel.js        # Dựng UI Floating Panel qua Shadow DOM
│   │   └── injected_panel.css       # Style riêng cho Panel
│   ├── popup/
│   │   ├── popup.html               # UI khi bấm Icon Extension trên toolbar
│   │   ├── popup.js                 # Logic Popup toolbar
│   │   └── popup.css                # Style Popup
│   ├── core/
│   │   ├── criteria_db.js           # Cơ sở dữ liệu 63 tiêu chí (Level 1..4, điểm max, mẹo)
│   │   └── drl_analyzer.js          # Thuật toán tính tổng điểm, xếp loại & đề xuất lộ trình
│   └── data/
│       └── drl_20261_raw.json       # File JSON dữ liệu mẫu 63 tiêu chí kỳ 20261
└── docs/
    └── superpowers/specs/2026-08-11-hust-drl-extension-design.md
```

---

## 3. Mô Hình Phân Loại 63 Tiêu Chí & Thuật Toán Gợi Ý

### 3.1 Phân loại 4 Mức độ Dễ -> Khó (Criteria Classification)

| Level | Định nghĩa | Danh sách CId tiêu chí tiêu biểu | Minh chứng / Yêu cầu |
| :---: | :--- | :--- | :--- |
| **Level 1** | **Bắt buộc / Tự động** *(Cực dễ)* | `114` (Chấp hành pháp luật), `115` (SHCD), `116` (Khai báo cư trú), `117` (Họp lớp), `118` (Quy chế), `119` (Cam kết mục tiêu), `129` (Nỗ lực GPA), `140` (Khảo sát SV), `149` (Mạng xã hội), `170`, `171` (GPA kỳ trước). | Tự động hoặc làm bài test/form ngắn trên web/app. |
| **Level 2** | **Mức Dễ** *(Chỉ cần tham gia)* | `120` (Kế hoạch học tập), `122` (Tư vấn học tập), `123` (Hướng nghiệp), `125` (Portfolio), `133` (Sự kiện CT-XH), `134` (Cổ vũ phong trào), `135` (BKRun/Thể thao), `141` (Tình nguyện ngắn), `142` (Trà đá cộng đồng), `143` (Hiến máu), `144` (Văn hóa địa phương), `146` (Môi trường), `152` (Thi tìm hiểu lịch sử). | Quét QR / nộp ảnh chứng nhận đơn giản. |
| **Level 3** | **Mức Trung Bình** *(Cần kỹ năng/quá trình)* | `121` (NCKH/Học thuật), `124` (Khóa kỹ năng), `128` (Thành viên CLB học thuật/Lab), `130` (Ngoại ngữ), `131` (TOEIC 600+), `132` (Thực tập >30 ngày), `136` (Thi văn nghệ), `137` (Giải thể thao), `138` (Kỹ năng mềm), `139` (Thành viên CLB sở thích), `145` (Mùa hè xanh/Tiếp sức mùa thi), `147` (An ninh trường), `148` (Diễn đàn SV), `150`, `151`, `153`, `157`, `161`, `162`, `163`. | Cần chứng chỉ / xác nhận tham gia quá trình. |
| **Level 4** | **Mức Khó / Nâng cao** *(Chức vụ/Thành tích)* | `126` (Công bố KH), `127` (Olympic), `154` (Giấy khen/Bằng khen), `155` (Cảm tình Đảng), `156` (Kết nạp Đảng), `158`, `159`, `160` (Ban cán sự/Ban điều hành), `164`-`169` (Giải thưởng NCKH Quốc gia/Thành phố/Trường, SV5T). | Giấy khen, Quyết định khen thưởng, Chức vụ. |

---

### 3.2 Thuật toán gợi ý lộ trình (Roadmap Recommendation Logic)
1. **Định vị mốc điểm mục tiêu**:
   - Nếu `Tổng điểm` < 70đ ➔ Mục tiêu ngắn hạn: **70đ (Khá)**.
   - Nếu 70đ ≤ `Tổng điểm` < 80đ ➔ Mục tiêu ngắn hạn: **80đ (Giỏi)**.
   - Nếu 80đ ≤ `Tổng điểm` < 90đ ➔ Mục tiêu ngắn hạn: **90đ (Xuất sắc)**.
2. **Tính điểm thiếu**: `Điểm thiếu` = `Mục tiêu điểm` - `Tổng điểm hiện tại`.
3. **Lọc danh sách gợi ý**:
   - Lọc tất cả tiêu chí có `UCPoint == 0` (chưa đạt).
   - Sắp xếp theo ưu tiên: **Level 1** ➔ **Level 2** ➔ **Level 3**.
   - Chọn ra danh sách tiêu chí nhỏ nhất sao cho tổng điểm max của các mục này ≥ `Điểm thiếu`.

---

## 4. Chi Tiết Thiết Kế Giao Diện (UI/UX Specification)

### 4.1 Injected Floating Panel (`injected_panel.js`)
* **Nút mở (Floating Badge)**:
  * Đặt cố định góc dưới bên phải màn hình iCTSV (`position: fixed; bottom: 20px; right: 20px; z-index: 999999;`).
  * Giao diện: Thẻ hình chữ nhật bo tròn góc, nền màu đỏ Bách Khoa (`#dc2626`), chữ trắng.
  * Nội dung: `🔴 68đ - KHÁ | +12đ lên Giỏi ➔`

* **Khung Slide-over Panel**:
  * Khi click nút mở, panel trượt ra từ bên phải màn hình (`width: 400px; height: 85vh; top: 7.5vh; right: 20px;`).
  * **Header**:
    * Số điểm hiện tại (VD: `68 / 100đ`).
    * Nhãn phân loại (*Yếu / Trung bình / Khá / Giỏi / Xuất sắc*).
    * Progress bar chia vạch mốc: 70 - 80 - 90.
  * **Tab 1: 🎯 Mục gợi ý làm thêm (Mặc định)**:
    * Thẻ thông báo: *"Bạn còn thiếu 12 điểm để đạt mốc Giỏi (80đ). Gợi ý làm các mục sau:"*
    * Danh sách dạng card: Tên tiêu chí, điểm cộng, loại minh chứng, nút `[Kéo tới mục]`.
    * Sự kiện `click` nút `[Kéo tới mục]`: Gọi hàm `scrollToCriteria(cId)` -> tìm phần tử DOM tương ứng trên trang iCTSV, cuộn tới và đổi màu nền (highlight yellow background) trong 2.5 giây.
  * **Tab 2: 📋 Bảng 63 tiêu chí**:
    * Cây thư mục 4 Level (Level 1 đến Level 4). Mỗi level có thể bấm mở/gập (accordion).
    * Hiển thị điểm đã đạt / điểm tối đa của từng dòng.
  * **Tab 3: 💡 Tra cứu Minh chứng**:
    * Ô tìm kiếm nhanh tiêu chí.
    * Hướng dẫn cụ thể hình thức nộp minh chứng (ảnh screenshot, giấy chứng nhận, mã QR...).

---

## 5. Kế Hoạch Kiểm Thử & Xác Nhận (Verification & Testing Plan)

### 5.1 Các kịch bản kiểm thử (Test Cases)
1. **Kiểm thử trích xuất API**: Đảm bảo `content_script.js` đọc chuẩn cấu trúc JSON `CriteriaTypeDetailsLst` bất kể sinh viên đã tích chọn bao nhiêu mục.
2. **Kiểm thử tính toán điểm số**: Kiểm tra tổng điểm tính toán trên Extension khớp 100% với tổng điểm hiển thị trên trang iCTSV.
3. **Kiểm thử gợi ý lộ trình**:
   - Trường hợp 65đ ➔ Gợi ý đúng các mục Level 1/2 thiếu để lên 70đ.
   - Trường hợp 82đ ➔ Gợi ý đúng các mục để lên 90đ.
4. **Kiểm thử Scroll & Highlight**: Bấm nút `[Kéo tới mục]` từ Floating Panel ➔ Trang web gốc cuộn chính xác tới vị trí tiêu chí và chớp sáng nổi bật.
5. **Kiểm thử Cách ly CSS**: Đảm bảo giao diện Floating Panel hiển thị đúng style qua Shadow DOM mà không bị biến dạng bởi CSS của iCTSV.

---

## 6. Lộ Trình Phát Triển (Next Steps)
1. Viết triển khai file `manifest.json`, `criteria_db.js`, `drl_analyzer.js`.
2. Lập trình `content_script.js` và `injected_panel.js`.
3. Kiểm thử trực tiếp với dữ liệu mẫu JSON `drl_20261_raw.json`.
