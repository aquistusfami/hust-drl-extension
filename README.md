# HUST ĐRL Helper (Kỳ 20261)

Tiện ích mở rộng trên trình duyệt Chrome / Edge giúp sinh viên Đại học Bách khoa Hà Nội (HUST) theo dõi, tính toán và tối ưu Điểm Rèn Luyện (ĐRL) trực tiếp trên trang iCTSV.

---

## 1. Tính năng chính

- **Thống kê điểm real-time**: Tự động trích xuất dữ liệu từ hệ thống iCTSV, hiển thị tổng điểm hiện tại và xếp loại rèn luyện tương ứng.
- **Gợi ý lộ trình mục tiêu**: Đề xuất danh sách các tiêu chí ngắn nhất để đạt các mốc điểm mong muốn (Khá 70đ, Giỏi 80đ, Xuất sắc 90đ).
- **Tính toán theo luật khống chế HUST**: Tự động áp dụng giới hạn điểm trần của từng nhóm (`CGMaxPoint`) và danh mục lớn (`CTMaxPoint`), tránh tình trạng tích chọn tiêu chí bị tràn điểm.
- **Phân loại tiêu chí theo mức độ**: Phân nhóm 63 tiêu chí rèn luyện từ Level 1 (dễ/tự động) đến Level 4 (thành tích cao), kèm danh mục riêng cho các khoản trừ điểm vi phạm.
- **Tùy chỉnh nhóm ưu tiên**: Cho phép sinh viên tự xếp lại mức độ ưu tiên của từng tiêu chí phù hợp với bản thân.
- **Mẹo nộp minh chứng**: Hướng dẫn chuẩn bị file ảnh/chứng nhận cho các mục phổ biến như Hiến máu, Chạy bộ Strava, TOEIC, Khảo sát sinh viên, Khóa học kỹ năng.

---

## 2. Hướng dẫn cài đặt

Vì tiện ích hiện chưa đăng tải trên Chrome Web Store, bạn có thể cài đặt thủ công theo các bước sau:

1. **Tải mã nguồn**: 
   - Bấm nút **Code** ➔ **Download ZIP** trên GitHub (hoặc `git clone` về máy), sau đó giải nén tệp tin ra một thư mục.
2. **Mở quản lý tiện ích**:
   - Trên trình duyệt Chrome / Edge, truy cập đường dẫn: `chrome://extensions/`
3. **Bật chế độ nhà phát triển**:
   - Gạt bật công tắc **Chế độ dành cho nhà phát triển** (Developer mode) ở góc trên bên phải.
4. **Tải tiện ích vào trình duyệt**:
   - Bấm nút **Tải tiện ích đã giải nén** (Load unpacked) ở góc trái.
   - Trỏ tới thư mục chứa mã nguồn vừa giải nén (nơi có chứa file `manifest.json`).

---

## 3. Hướng dẫn sử dụng

1. Đăng nhập vào trang chấm điểm rèn luyện của Nhà trường: [https://ctsv.hust.edu.vn/#/cham-diem-ren-luyen](https://ctsv.hust.edu.vn/#/cham-diem-ren-luyen)
2. Sau khi trang tải xong, tiện ích sẽ tự động xuất hiện dưới dạng **Nút bấm góc dưới bên phải màn hình** (ví dụ: `HUST ĐRL: 65đ (TRUNG BÌNH)`).
3. Bấm vào nút bấm để mở bảng điều khiển với 3 tab:
   - **Gợi ý Lộ trình**: Xem các tiêu chí cần hoàn thành phân theo từng danh mục lớn để đạt kịch trần điểm.
   - **Tiêu chí**: Danh sách toàn bộ tiêu chí để bạn tích thử điểm hoặc tự xếp lại nhóm ưu tiên.
   - **Mẹo nộp MC**: Các lưu ý nhanh khi chụp ảnh và tải minh chứng lên iCTSV.
4. Khi tích hoặc bỏ chọn bất kỳ ô tiêu chí nào, tổng điểm và lộ trình sẽ tự động cập nhật ngay lập tức.

---

## 4. Quyền riêng tư & An toàn dữ liệu

- Tiện ích chạy hoàn toàn trên trình duyệt cá nhân của bạn (Client-side).
- Không gửi bất kỳ dữ liệu cá nhân hay tài khoản đăng nhập nào ra máy chủ bên ngoài.
- Dữ liệu điểm và thiết lập nhóm ưu tiên được lưu trực tiếp tại bộ nhớ cục bộ của trình duyệt (`chrome.storage.local` và `localStorage`).

---

## 5. Đóng góp & Phản hồi

Nếu gặp lỗi trong quá trình sử dụng hoặc có góp ý nâng cấp thuật toán, bạn có thể tạo Issue hoặc gửi Pull Request trực tiếp trên kho mã nguồn này.
