# P.A.S.T Portal - Cổng thông tin điện tử của CLB Tình nguyện Vì Bình Yên Thành Phố

P.A.S.T Portal là một ứng dụng cổng thông tin điện tử cao cấp kết hợp phong cách thiết kế **Glassmorphism (Kính mờ)** hiện đại và tinh tế. Portal này được xây dựng dành cho **CLB Tình nguyện Vì Bình Yên Thành Phố** nhằm số hóa các quy trình đăng ký thành viên (Operators), tham gia làm bài khảo sát/kiểm tra nghiệp vụ (Đố Bạn Kì Tài) và quản lý cơ sở dữ liệu nội bộ.

## 🚀 Công Nghệ Sử Dụng

- **Frontend Core**: HTML5 & Javascript (Single Page Application).
- **Styling**: TailwindCSS CDN kết hợp Custom CSS (`styles.css`) cho hiệu ứng Glassmorphism mờ kính sâu, scanline, LED pulse, và thiết kế responsive thích ứng tốt trên cả máy tính lẫn di động.
- **Database & Services**: Firebase Web Client SDK v10 (sử dụng Firestore để lưu hồ sơ Operators, kết quả lượt thi, và ngân hàng đề thi).

## ✨ Tính Năng Nổi Bật

1. **Trang Chủ (Dashboard)**:
   - Giới thiệu tổng quan về CLB Tình nguyện Vì Bình Yên Thành Phố.
   - Thống kê trực tiếp thời gian thực: số lượng Operators, tổng số lượt làm bài, độ chính xác trung bình của toàn CLB (nạp trực tiếp từ Firebase Firestore).
2. **Đăng Ký Operator**:
   - Giao diện đăng ký bảo mật với Email, Số điện thoại và Họ tên.
   - Tự động gán mã định danh quân sự chuyên nghiệp (ví dụ: `OP-4215-PAST`).
   - Tự động duy trì trạng thái đăng nhập của Operator qua `localStorage`.
3. **Đố Bạn Kì Tài (Tactical Quiz)**:
   - Bài trắc nghiệm đánh giá kiến thức nghiệp vụ (Kỹ năng cứu hộ, an toàn giao thông, sơ cấp cứu, ứng phó hỏa hoạn).
   - Đồng hồ đo thời gian chính xác tới từng phần nghìn giây (`MM:SS.MS`).
   - Tự động tính điểm và đẩy kết quả lên cơ sở dữ liệu trực tuyến.
4. **Bảng Xếp Hạng (Rankings)**:
   - Bảng vàng vinh danh những Operators xuất sắc nhất theo tiêu chí: Độ chính xác cao nhất -> Thời gian hoàn thành nhanh nhất.
   - Nút tìm kiếm thông minh lọc nhanh Operator theo tên hoặc mã số.
5. **Cổng Quản Trị Viên (Admin Panel)**:
   - Đăng nhập bảo mật với thông tin:
     - **Tài khoản**: `admin`
     - **Mật khẩu**: `past123`
   - Quản lý Operators (Xem danh sách, tìm kiếm và xóa hồ sơ).
   - Quản lý Bảng điểm (Xem danh sách bài thi, ngày nộp, tìm kiếm và xóa kết quả).
   - Quản lý Ngân hàng Đề thi: Cho phép thêm mới câu hỏi trắc nghiệm, sửa câu hỏi có sẵn, xóa câu hỏi. Các câu hỏi mới lưu vào Firestore sẽ tự động đồng bộ hóa sang màn hình làm bài thi của các Operators.

## 📂 Cấu Trúc Dự Án

- `index.html`: Cấu trúc cốt lõi của SPA, chứa các View phân vùng riêng biệt.
- `styles.css`: Hệ thống thiết kế Lumina Tactical Glassmorphic, quy chuẩn màu sắc, các lớp tiện ích kính mờ và hoạt ảnh quét laser.
- `app.js`: Tệp xử lý logic ứng dụng, tích hợp SDK Firebase Firestore và cơ chế quản lý trạng thái.
- `README.md`: Hướng dẫn vận hành.

## 🛠️ Hướng Dẫn Chạy Dự Án

1. **Khởi chạy cục bộ**:
   Do cổng thông tin sử dụng Firebase Client SDK để kết nối với cơ sở dữ liệu đám mây Firestore của Google, bạn có thể chạy ứng dụng bằng cách mở trực tiếp tệp `index.html` trong bất kỳ trình duyệt web hiện đại nào (Chrome, Edge, Firefox, Safari) hoặc chạy thông qua tiện ích mở rộng Live Server của VS Code.
   
2. **Khởi tạo dữ liệu câu hỏi mặc định**:
   Hệ thống được lập trình tự động kiểm tra cơ sở dữ liệu câu hỏi Firestore khi khởi chạy lần đầu tiên. Nếu hệ thống nhận diện bảng câu hỏi trống, hệ thống sẽ tự động gieo (seed) 5 câu hỏi nghiệp vụ mẫu chuẩn lên Firestore của bạn để bài kiểm tra có thể hoạt động ngay tức khắc.

3. **Thông tin xác thực Quản trị viên**:
   - Truy cập tab **Quản trị viên** trong menu thanh bên (Sidebar).
   - Nhập tài khoản `admin` và mật khẩu `past123`.
   - Dashboard Admin sẽ xuất hiện cung cấp toàn bộ quyền CRUD.
