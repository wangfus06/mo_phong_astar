# Mô phỏng tìm đường giao thông

Ứng dụng trực quan hóa A* và BFS trên mạng lưới giao thông. Phần tìm đường được viết bằng C++ và biên dịch sang WebAssembly để chạy trực tiếp trong trình duyệt.

## Chạy ứng dụng

Cần cài Node.js, npm và Emscripten SDK (`emcc`). Tải SDK từ [emscripten-core/emsdk](https://github.com/emscripten-core/emsdk), sau đó kích hoạt môi trường Emscripten trong terminal.

```bash
npm ci
npm run dev
```

Lệnh `dev` biên dịch `src/algorithms/wasm/pathfinding.cpp` trước khi chạy Vite. Mở địa chỉ hiển thị trong terminal (mặc định `http://localhost:3000`).

## Kiểm tra

```bash
npm run lint
npm run build
```

GitHub Pages được build và deploy tự động từ nhánh `main` bằng workflow `.github/workflows/deploy.yml`.

## Cấu trúc mã nguồn

```text
src/
   algorithms/       Adapter WebAssembly cho A* và BFS
      wasm/           C++ nguồn và module được sinh lúc build
   components/
      controls/       Bộ điều khiển thuật toán và phát mô phỏng
      dialogs/        Hộp thoại cài đặt bản đồ và kịch bản kiểm thử
      map/            Bản đồ giao thông tương tác
      results/        Thống kê và bảng truy vết từng bước
   types/            Kiểu dữ liệu dùng chung
   utils/            Tạo bản đồ, khoảng cách và kịch bản kiểm thử
scripts/              Lệnh biên dịch C++ sang WebAssembly
   App.tsx           Trạng thái và bố cục ứng dụng
```
