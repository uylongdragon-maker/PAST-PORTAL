# P.A.S.T Portal - Cổng thông tin điện tử của CLB Tình nguyện Vì Bình Yên Thành Phố

P.A.S.T Portal là một ứng dụng cổng thông tin điện tử cao cấp kết hợp phong cách thiết kế **Glassmorphism (Kính mờ)** hiện đại và tinh tế. Portal này được xây dựng dành cho **CLB Tình nguyện Vì Bình Yên Thành Phố** nhằm số hóa các quy trình đăng ký thám tử tình nguyện đô thị (Detectives), tham gia giải mã chuyên án (Giải mã Chuyên án: Đố Bạn Kì Tài) và quản trị cơ sở dữ liệu nội bộ.

Ứng dụng được thiết kế theo chủ đề **Thám tử an ninh thành phố (City Peace Detectives)** mang lại trải nghiệm nhập vai tương tác thú vị cho người xem như một điều tra viên thực thụ bảo vệ bình yên đô thị.

## 🚀 Công Nghệ Sử Dụng

- **Frontend Core**: HTML5 & Javascript (Single Page Application).
- **Styling**: TailwindCSS CDN kết hợp Custom CSS (`styles.css`) cho hiệu ứng Glassmorphism mờ kính sâu, hồng tâm thám tử, laser sweep, LED pulse, và thiết kế responsive thích ứng tốt trên cả máy tính lẫn di động.
- **Database & Services**: Firebase Web Client SDK v10 (sử dụng Firestore để lưu hồ sơ thám tử, kết quả giải mã chuyên án, và ngân hàng đề thi).

## ✨ Kiến Trúc & Tính Năng Nổi Bật

### 1. Website dành cho khách (Chủ đề Thám tử đô thị)
- **Hồ sơ Chuyên án (Trang Chủ)**: 
  - Đóng vai trò như một "bảng phân tích chuyên án" (Case Board). Giới thiệu về CLB và nhiệm vụ giám sát bình yên thành phố.
  - Thống kê thời gian thực: Tổng số thám tử đăng ký, số chuyên án đã được giải mã, tỷ lệ chính xác nghiệp vụ trung bình (truy xuất trực tiếp từ Firestore).
- **Đăng ký Phù hiệu**:
  - Biểu mẫu đăng ký bảo mật (Họ tên, Email, Số điện thoại).
  - Tự động gán mã phù hiệu thám tử chuyên nghiệp (ví dụ: `DET-4512-PAST`).
  - Duy trì phiên đăng nhập bằng `localStorage` (hiển thị trạng thái LED phát sáng, mã Badge ID trên thanh điều hướng).
- **Giải mã Chuyên án (Đố Bạn Kì Tài)**:
  - Bộ câu hỏi kiểm tra kỹ năng tình nguyện ứng phó: an toàn giao thông, thoát nạn hỏa hoạn, sơ cứu đuối nước, gãy xương và CPR.
  - Đồng hồ đo thời gian chính xác tới từng phần nghìn giây (`MM:SS.MS`), nhấp nháy đỏ cảnh báo nếu vượt quá 3 phút.
  - Tự động lưu trữ kết quả giải mã chuyên án lên cơ sở dữ liệu trực tuyến.
- **Bảng Vàng Thám Tử (Rankings)**:
  - Vinh danh những điều tra viên xuất sắc nhất sắp xếp theo tiêu chí: Độ chính xác -> Thời gian giải mã nhanh nhất.
  - Tìm kiếm động theo mã Badge ID hoặc tên thám tử.

### 2. Bảng chỉ huy Quản trị (Admin Panel) - Tách biệt hoàn toàn
- Lối vào được tích hợp ẩn thông qua nút **Cổng Quản Trị** ở cuối thanh điều hướng của khách.
- Xác thực bảo mật:
  - **Tài khoản**: `admin`
  - **Mật khẩu**: `past123`
- **Giao diện Quản trị**: Khi đăng nhập thành công, hệ thống ẩn hoàn toàn giao diện khách (`#guest-layout`) và hiển thị bảng chỉ huy toàn màn hình tối (`#admin-workspace`) mang phong cách Trung tâm Chỉ huy Đặc vụ (Command Center), tăng tính bảo mật và trải nghiệm trực quan riêng biệt.
  - **Danh sách Thám tử**: Xem, tìm kiếm và xóa tài khoản thám tử tình nguyện.
  - **Báo cáo Chuyên án**: Xem kết quả làm bài trắc nghiệm của thám tử, tìm kiếm và xóa lượt thi.
  - **Ngân hàng Chuyên án**: CRUD câu hỏi trắc nghiệm trực tiếp lên Firestore (đồng bộ ngay sang màn hình làm bài của thám tử).

## 📂 Cấu Trúc Dự Án

- `index.html`: Chứa cấu trúc SPA phân chia thành `#guest-layout` (giao diện khách thám tử) và `#admin-workspace` (giao diện admin tối).
- `styles.css`: Hệ thống thiết kế kính mờ Lumina Tactical, crosshair thám tử, folder tab, và các hoạt ảnh.
- `app.js`: Xử lý logic định tuyến, đăng ký, đồng hồ đếm giờ, và tích hợp các bộ sưu tập Firestore (`operators`, `quiz_submissions`, `questions`).
- `package.json`: Cấu hình Vite làm máy chủ chạy thử nghiệm cục bộ.
- `README.md`: Hướng dẫn vận hành.

## 🛠️ Hướng Dẫn Chạy Dự Án

1. **Khởi chạy cục bộ**:
   Mở thư mục dự án và chạy các lệnh:
   ```bash
   npm install      # Cài đặt Vite dev server
   npm run dev      # Khởi động máy chủ thử nghiệm
   ```
   Sau đó truy cập địa chỉ được cung cấp: [http://localhost:5173](http://localhost:5173).

2. **Xác thực Quản trị viên**:
   - Truy cập **Cổng Quản Trị** ở góc dưới thanh bên trái (Sidebar).
   - Đăng nhập với tài khoản: `admin` / mật khẩu `past123`.
   - Để quay trở về giao diện thám tử dành cho khách, nhấn nút **Đăng Xuất** ở góc dưới menu admin.
