# HUST ĐRL Helper

HUST ĐRL Helper là tiện ích trình duyệt giúp sinh viên Đại học Bách khoa Hà Nội theo dõi Điểm Rèn Luyện (ĐRL), lập kế hoạch đạt mốc xếp loại và tìm hoạt động phù hợp ngay trên iCTSV. Bộ tiêu chí mẫu đi kèm dành cho kỳ 2026.1.

## Cài đặt

Tải mã nguồn bằng **Code → Download ZIP** và giải nén vào một thư mục. Bạn cũng có thể tải gói cài đặt nếu có bản phát hành. [Releases](https://github.com/aquistusfami/hust-drl-extension/releases)

| Trình duyệt | Cách nạp tiện ích |
| --- | --- |
| Chrome | Mở `chrome://extensions/`, bật **Developer mode**, chọn **Load unpacked**, rồi chọn thư mục chứa `manifest.json`. |
| Edge | Mở `edge://extensions/`, bật **Developer mode**, chọn **Load unpacked**, rồi chọn thư mục chứa `manifest.json`. |
| Firefox | Mở `about:debugging#/runtime/this-firefox`, chọn **Load Temporary Add-on…**, rồi mở tệp `manifest.json`. Firefox gỡ tiện ích tạm thời khi đóng trình duyệt. |

## Sử dụng

1. Đăng nhập iCTSV, mở trang chấm điểm và nhấn nút **HUST ĐRL** ở góc dưới bên phải. [Trang chấm điểm rèn luyện](https://ctsv.hust.edu.vn/cham-diem-ren-luyen)
2. Trong tab **Gợi ý Lộ trình**, xem điểm hiện tại, điểm dự kiến và trần điểm của từng mục trong 5 mục ĐRL. Tiện ích ưu tiên các tiêu chí dễ hơn khi lập kế hoạch đến mốc **Khá (70 điểm)**, **Tốt (80 điểm)** hoặc **Xuất sắc (90 điểm)**. Nếu các tiêu chí hiện có chưa đủ, widget hiển thị mức điểm cao nhất dự kiến và phần còn thiếu.
3. Xem **Hoạt động sắp hoặc đang diễn ra** ngay dưới tiêu chí phù hợp trong **Gợi ý Lộ trình** và **Tiêu chí**. Widget đọc bản dữ liệu công khai đi kèm và ghi ngày cập nhật. Mở liên kết iCTSV để kiểm tra hạn đăng ký hoặc xem các sự kiện mới hơn.
4. Chọn **Thử tính điểm** để mô phỏng điểm khi hoàn thành một tiêu chí. **Kéo tới mục** mở tiêu chí cùng các hoạt động liên quan. Tab **Mẹo nộp MC** có gợi ý chuẩn bị minh chứng.

Bạn có thể bật hoặc tắt widget bằng công tắc **Bật Widget trên iCTSV** trong popup của tiện ích.

## Demo

Widget trên Firefox với dữ liệu giả lập. Lộ trình từ 66 lên 70 điểm chia theo 5 mục ĐRL và hiển thị một hoạt động ngay dưới tiêu chí phù hợp.

<img src="images/roadmap-demo.png" alt="Widget HUST ĐRL Helper hiển thị lộ trình từ 66 lên 70 điểm và một hoạt động dưới tiêu chí phù hợp" width="400">

## Dữ liệu và quyền riêng tư

Tiện ích tính điểm trong trình duyệt và lưu cục bộ dữ liệu dùng để tính điểm, lựa chọn mô phỏng và tùy chọn hiển thị. Việc ghép hoạt động với tiêu chí diễn ra trong trình duyệt từ tệp đi kèm. Hãy đối chiếu kết quả chính thức và trạng thái minh chứng trên iCTSV. [Dữ liệu hoạt động công khai (JSON)](src/data/public_activities.json)

## Đóng góp

Bạn có thể báo lỗi hoặc đề xuất tính năng trên [GitHub Issues](https://github.com/aquistusfami/hust-drl-extension/issues). Các bước thiết lập môi trường, kiểm thử và gửi pull request có trong [hướng dẫn đóng góp](CONTRIBUTING.md). Xem các thay đổi theo phiên bản trong [nhật ký thay đổi](CHANGELOG.md).
