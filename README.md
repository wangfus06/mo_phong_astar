# Mô phỏng tìm đường giao thông

Ứng dụng trực quan hóa A* và BFS trên mạng lưới giao thông. Phần tìm đường được viết bằng Python và chạy trực tiếp trong trình duyệt qua Pyodide/WebAssembly.

## Chạy ứng dụng

Cần cài Node.js và npm. Pyodide được tải từ jsDelivr khi ứng dụng mở lần đầu, nên trình duyệt cần có kết nối Internet.

```bash
npm ci
npm run dev
```

Mở địa chỉ hiển thị trong terminal (mặc định `http://localhost:3000`).

## Kiểm tra

```bash
npm run lint
npm run build
```

GitHub Pages được build và deploy tự động từ nhánh `main` bằng workflow `.github/workflows/deploy.yml`.

## Cấu trúc mã nguồn

```text
src/
   algorithms/       Adapter Pyodide cho A* và BFS
      python/         Thuật toán Python và mô phỏng từng bước
   components/
      controls/       Bộ điều khiển thuật toán và phát mô phỏng
      dialogs/        Hộp thoại cài đặt bản đồ và kịch bản kiểm thử
      map/            Bản đồ giao thông tương tác
      results/        Thống kê và bảng truy vết từng bước
   types/            Kiểu dữ liệu dùng chung
   utils/            Tạo bản đồ, khoảng cách và kịch bản kiểm thử
   App.tsx           Trạng thái và bố cục ứng dụng
```
