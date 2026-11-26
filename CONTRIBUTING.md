# Hướng dẫn đóng góp

Bạn có thể đóng góp bằng cách báo lỗi, đề xuất tính năng, cải thiện tài liệu hoặc gửi bản sửa mã nguồn cho HUST ĐRL Helper.

## Báo lỗi hoặc đề xuất tính năng

Tìm issue tương tự trước khi mở issue mới. Với lỗi, ghi phiên bản tiện ích và trình duyệt, các bước tái hiện, kết quả thực tế và kết quả mong đợi. Với lỗi tính điểm, nêu mốc điểm, tiêu chí liên quan và trần điểm của nhóm hoặc mục bằng ví dụ giả lập. Với đề xuất tính năng, mô tả tình huống sinh viên gặp phải và thao tác bạn muốn thực hiện. [GitHub Issues](https://github.com/aquistusfami/hust-drl-extension/issues)

Dùng dữ liệu giả lập hoặc che thông tin cá nhân trong ảnh, nhật ký và nội dung issue. Giữ token, cookie và dữ liệu phiên đăng nhập ngoài các tệp đóng góp.

## Thiết lập môi trường

1. Fork repo, clone bản fork và tạo nhánh cho thay đổi, ví dụ `git switch -c fix/tran-diem-nhom`.
2. Cài Node.js 22 LTS hoặc một bản LTS mới hơn, rồi chạy `npm ci` từ thư mục gốc để cài phụ thuộc kiểm thử.
3. Nạp thư mục repo vào trình duyệt theo hướng dẫn cài đặt. Sau khi sửa mã, nạp lại tiện ích rồi tải lại tab iCTSV. [Cài đặt tiện ích](README.md#cài-đặt)

Trình duyệt đọc trực tiếp mã nguồn của tiện ích. Khi làm việc với mã, dùng thụt lề hai dấu cách, nháy đơn trong JavaScript và tên hàm dạng `camelCase`. Giữ nội dung giao diện bằng tiếng Việt.

## Tìm mã cần sửa

| Đường dẫn | Nội dung |
| --- | --- |
| `src/core/` | Tính điểm, trần điểm, lộ trình và thông tin tiêu chí |
| `src/content/` | Đọc dữ liệu iCTSV, tra cứu hoạt động và hiển thị widget |
| `src/popup/` | Giao diện mở từ biểu tượng tiện ích |
| `src/background/` | Xử lý thông điệp và lưu trữ cục bộ |
| `manifest.json` | Điểm vào, quyền trình duyệt và thứ tự nạp script |

## Kiểm thử

```sh
npm test -- --runInBand
git diff --check
```

Jest chạy các tệp `tests/*.test.js`. Bộ kiểm thử có trong repo nằm ở `tests/roadmap.test.js`. Bạn có thể chạy riêng bằng `npm test -- --runInBand tests/roadmap.test.js`.

- Với thay đổi tính điểm, kiểm tra trường hợp nhiều tiêu chí dùng chung trần nhóm hoặc mục, chưa đủ điểm và đã đạt mốc xếp loại.
- Với thay đổi tra cứu hoạt động, kiểm tra hoạt động khớp tiêu chí và còn đăng ký, hoạt động đã đóng, và trường hợp chưa tìm thấy kết quả.
- Với thay đổi giao diện hoặc manifest, nạp tiện ích trong trình duyệt và kiểm tra thao tác liên quan. Nếu sửa khai báo script nền, kiểm tra cả Firefox và một trình duyệt Chromium.

## Gửi pull request

Viết commit ngắn với tiền tố phù hợp, ví dụ `fix: áp dụng trần điểm nhóm khi lập lộ trình` hoặc `docs: bổ sung hướng dẫn cài đặt Firefox`.

Trong pull request, nêu tình huống cần xử lý, thay đổi người dùng sẽ thấy và các bước kiểm thử đã chạy. Liên kết issue liên quan nếu có. Với thay đổi giao diện, đính kèm ảnh chỉ chụp phần tiện ích và dùng dữ liệu giả lập.
