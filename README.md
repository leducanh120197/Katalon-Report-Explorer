# Katalon Reports Viewer

Một ứng dụng web để xem và quản lý báo cáo từ Katalon Studio.

## Cấu trúc Project

```
katalon-reports-viewer/
├── public/                     # Static assets
│   ├── styles.css             # CSS styles
│   └── scripts.js             # Client-side JavaScript
├── src/                       # Source code
│   ├── config/                # Configuration
│   │   └── index.js          # App configuration
│   ├── routes/               # Route handlers
│   │   ├── main.js           # Main routes (home, view)
│   │   └── api.js            # API routes (create-html)
│   ├── templates/            # HTML templates
│   │   └── reportTemplate.js # HTML report generator
│   └── utils/                # Utility functions
│       ├── fileSystem.js     # File system utilities
│       ├── htmlRenderer.js   # HTML rendering utilities
│       └── xmlParser.js      # XML/RP file parsing
├── app.js                    # Original monolithic file (backup)
├── app-new.js               # New modular main application
├── package.json             # Dependencies
└── README.md               # This file
```

## Modules Description

### Configuration (`src/config/index.js`)
- Chứa các cấu hình ứng dụng như port, đường dẫn reports, file extensions được hỗ trợ

### File System Utils (`src/utils/fileSystem.js`)
- `buildTree()`: Tạo cây thư mục từ filesystem
- `hasDisplayableFile()`: Kiểm tra node có chứa file hiển thị được
- `isInCollectionFolder()`: Kiểm tra đường dẫn thuộc _Collection folder
- `isSupportedFile()`: Kiểm tra file extension có được hỗ trợ

### HTML Renderer (`src/utils/htmlRenderer.js`)
- `renderTree()`: Render cây thư mục thành HTML table
- `renderTreeRows()`: Render từng hàng của bảng

### XML Parser (`src/utils/xmlParser.js`)
- `parseRpFile()`: Parse file .rp (XML format)
- `createRpTable()`: Tạo HTML table từ dữ liệu .rp

### Report Template (`src/templates/reportTemplate.js`)
- `generateHtmlReport()`: Tạo HTML report từ JSON và RP files

### Routes
- **Main Routes** (`src/routes/main.js`): Home page, file viewer
- **API Routes** (`src/routes/api.js`): REST APIs cho việc tạo HTML reports

### Static Assets (`public/`)
- **CSS**: Styles cho UI
- **JavaScript**: Client-side interactions

## Cách chạy

### Sử dụng file mới (modular)
```bash
node app-new.js
```

### Sử dụng file cũ (backup)
```bash
node app.js
```

## Lợi ích của việc modularize

1. **Dễ maintain**: Mỗi module có trách nhiệm riêng biệt
2. **Dễ test**: Có thể test từng module độc lập
3. **Reusable**: Các utility functions có thể tái sử dụng
4. **Scalable**: Dễ dàng thêm tính năng mới
5. **Clean code**: Code dễ đọc và hiểu hơn
6. **Separation of concerns**: Tách biệt logic, presentation, và configuration

## Dependencies

- `express`: Web framework
- `xml2js`: XML parsing
- `fs.promises`: Async file operations
- `path`: File path utilities