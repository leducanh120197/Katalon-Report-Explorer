# Build Scripts với Timestamp

Các build scripts mới đã được thêm vào để tạo executable files với timestamp trong tên file.

## 🚀 Cách sử dụng

### Build Scripts với Timestamp

**Định dạng tên file:** `{app-name}_v{version}_{timestamp}_{platform}.{ext}`

Ví dụ: `katalon-reports-viewer_v2.0.0_20251225_1707_win.exe`

### Scripts có sẵn:

#### 1. Build Script Đầy Đủ (Recommended)
```bash
# Build cho Windows
npm run build-win

# Build cho macOS Intel
npm run build-mac

# Build cho macOS Apple Silicon
npm run build-mac-arm

# Build cho Linux
npm run build-linux

# Build cho tất cả platforms
npm run build-all
```

#### 2. Build Script Đơn Giản (Nhanh hơn)
```bash
# Build cho Windows (mặc định)
npm run build-simple-win

# Build cho macOS
npm run build-simple-mac

# Build cho Linux
npm run build-simple-linux
```

#### 3. Build Legacy (Không có timestamp)
```bash
# Build cũ không có timestamp
npm run build-legacy
npm run build-win-legacy
npm run build-mac-legacy
npm run build-linux-legacy
npm run build-all-legacy
```

## 📝 Định dạng Timestamp

- **Format:** `YYYYMMDD_HHMM`
- **Ví dụ:** `20251225_1707` = 25/12/2025 lúc 17:07

## 📁 Cấu trúc Output

```
dist/
├── katalon-reports-viewer_v2.0.0_20251225_1707_win.exe
├── katalon-reports-viewer_v2.0.0_20251225_1707_mac
├── katalon-reports-viewer_v2.0.0_20251225_1707_mac-arm
└── katalon-reports-viewer_v2.0.0_20251225_1707_linux
```

## 🔧 Tùy chỉnh

### Thay đổi định dạng timestamp

Chỉnh sửa function `getTimestamp()` trong `scripts/build-simple.js`:

```javascript
function getTimestamp() {
    const now = new Date();
    // Thêm giây
    return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    // Format: 20251225_170730
}
```

### Thay đổi tên file pattern

Chỉnh sửa biến `outputName` trong build scripts:

```javascript
const outputName = `${appName}-${version}-${timestamp}-${platform}${config.ext}`;
// Kết quả: katalon-reports-viewer-2.0.0-20251225_1707-win.exe
```

## 📊 Thông tin Build

Mỗi lần build sẽ hiển thị:
- ✅ Tên file đầy đủ
- 📊 Kích thước file (MB)  
- ⏰ Thời gian hoàn thành
- 🎯 Platform target

## 🔄 Migration từ Build cũ

Nếu muốn quay lại build cũ:
```bash
npm run build-legacy        # Thay vì npm run build
npm run build-win-legacy    # Thay vì npm run build-win
```