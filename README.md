# Mô phỏng tìm đường giao thông

Ứng dụng trực quan hóa thuật toán A* và BFS trên mạng lưới giao thông. Có thể chọn bản đồ mẫu, chỉnh điểm đầu/cuối, thay đổi đường bị chặn và xem từng bước tìm kiếm.

## Chạy ứng dụng

Cần cài Node.js và npm.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (mặc định `http://localhost:3000`).

## Kiểm tra

```bash
npm run lint
npm run build
```

## Cấu trúc mã nguồn

```text
src/
   algorithms/       Cài đặt A* và BFS
   components/
      controls/       Bộ điều khiển thuật toán và phát mô phỏng
      dialogs/        Hộp thoại cài đặt bản đồ và kịch bản kiểm thử
      map/            Bản đồ giao thông tương tác
      results/        Thống kê và bảng truy vết từng bước
   types/            Kiểu dữ liệu dùng chung
   utils/            Tạo bản đồ, heuristic và kịch bản kiểm thử
   App.tsx           Trạng thái và bố cục ứng dụng
```
