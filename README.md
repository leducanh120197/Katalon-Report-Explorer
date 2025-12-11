# Katalon Reports Viewer

Một ứng dụng web MVC để xem và quản lý báo cáo từ Katalon Studio.

## 🚀 Quick Start

### ⚙️ **Setup Configuration**

1. **Copy sample config:**
   ```bash
   cp config.json.sample config.json
   ```

2. **Update Reports Directory:**
   ```json
   {
     "reportsDir": "C:\\your\\katalon\\project\\Reports"  
   }
   ```

### 🏃‍♂️ **Run Application**

```bash
npm install
npm start
```

Access: http://localhost:3000

## 📁 Cấu trúc Project (Clean MVC Architecture)

```
katalon-reports-viewer/
├── app.js                     # 🚀 Main application entry point
├── config.json               # ⚙️ Configuration file (JSON format)
├── package.json              # 📦 Dependencies và scripts
├── README.md                 # 📖 Documentation
├── public/                   # 🌐 Static assets (Client-side)
│   ├── styles.css           #     CSS styles cho UI
│   └── scripts.js           #     Client-side JavaScript interactions
└── src/                     # 💼 MVC Source code
    ├── config/              # ⚙️ Configuration Management
    │   └── index.js        #     Config loader với fallback
    ├── controllers/         # 🎮 C - Controllers (Business Logic)
    │   ├── MainController.js #     Xử lý UI pages (home, view, tree)
    │   └── ApiController.js  #     Xử lý API calls (JSON responses)
    ├── models/              # 📊 M - Models (Data Layer)
    │   ├── FileTreeModel.js  #     File system operations & tree building
    │   └── ReportModel.js    #     Report generation & HTML creation
    ├── views/               # 🎨 V - Views (Presentation Layer)
    │   └── MainView.js       #     HTML template rendering
    ├── routes/              # 🛣️ Routing (URL mapping)
    │   ├── main.js          #     Routes cho UI pages (trả về HTML)
    │   └── api.js           #     Routes cho APIs (trả về JSON)
    └── utils/               # 🔧 Shared Utilities
        └── xmlParser.js     #     XML/RP file parsing functions
```

## 🎯 Chi tiết từng thành phần MVC

### 🚀 **Main Application (`app.js`)**
- **Entry point** của toàn bộ ứng dụng
- Khởi tạo Express server
- Mount static files (`public/`)
- Kết nối routes với controllers
- Start server với config từ `config.json`

### ⚙️ **Configuration (`src/config/index.js` + `config.json`)**
- **`config.json`**: File cấu hình chính (port, reportsDir, extensions)
- **`src/config/index.js`**: Config loader với error handling
- **Fallback mechanism**: Nếu JSON lỗi thì dùng default config
- **Centralized settings**: Tất cả settings ở một chỗ

### 🎮 **Controllers (Business Logic Layer)**

#### **MainController.js** - UI Page Controller
- **`showHomePage()`**: Render trang chủ với file tree
- **`showTreeJson()`**: Hiển thị JSON structure của tree
- **`viewFile()`**: Serve files để browser xem
- **Responsibility**: Điều phối giữa Models và Views để tạo HTML response

#### **ApiController.js** - API Endpoint Controller  
- **`createHtmlReport()`**: Tạo HTML report từ JSON/RP files
- **`deleteHtmlReport()`**: Xóa HTML reports với security check
- **Responsibility**: Xử lý AJAX requests và trả về JSON responses

### 📊 **Models (Data Access Layer)**

#### **FileTreeModel.js** - File System Data Model
- **`getDisplayTree()`**: Tạo tree structure cho hiển thị UI
- **`getJsonTree()`**: Tạo tree với metadata đầy đủ (size, dates)
- **`isSupportedFile()`**: Validate file extensions
- **`isInCollectionFolder()`**: Check Collection folder path
- **`hasDisplayableFile()`**: Recursive check for displayable content

#### **ReportModel.js** - Report Data Model
- **`createHtmlReport()`**: Generate HTML từ JSON + RP data
- **`saveHtmlReport()`**: Save HTML với duplicate checking
- **`deleteHtmlReport()`**: Delete với security validation
- **`getJsonData()`**: Parse JSON files safely
- **`getRpData()`**: Process RP files using XML parser

### 🎨 **Views (Presentation Layer)**

#### **MainView.js** - HTML Template Generator
- **`renderHomePage()`**: Complete HTML page với navigation
- **`renderFileTree()`**: File/folder tree table structure  
- **`renderTreeRows()`**: Recursive table row generation
- **`renderJsonTreePage()`**: JSON viewer page
- **`renderErrorPage()`**: Error handling pages
- **Responsibility**: Chỉ làm HTML templating, không có business logic

### 🛣️ **Routes (URL Mapping)**

#### **main.js** - UI Routes (Server-Side Rendering)
```javascript
GET  /           → MainController.showHomePage    → HTML page
GET  /view       → MainController.viewFile        → File content  
GET  /tree-show  → MainController.showTreeJson    → JSON viewer page
```

#### **api.js** - API Routes (Client-Side Processing)
```javascript
POST   /create-html  → ApiController.createHtmlReport   → JSON response
DELETE /delete-html  → ApiController.deleteHtmlReport   → JSON response
```

### 🔧 **Utils (Shared Libraries)**

#### **xmlParser.js** - XML Processing Utilities
- **`parseRpFile()`**: Parse .rp XML files using xml2js
- **`createRpTable()`**: Generate HTML table from RP data
- **Pure functions**: No side effects, easy to test

### 🌐 **Public Assets (Client-Side)**

#### **styles.css** - UI Styling
- File tree table styling
- Button styles (create/delete)
- Responsive design elements

#### **scripts.js** - Client Interactions
- Folder toggle functionality  
- AJAX calls cho create/delete HTML
- DOM manipulation sau API responses

## 🚀 Cách chạy

```bash
# Install dependencies
npm install

# Start application  
npm start
# hoặc
node app.js

# Development mode
npm run dev
```

**Server sẽ chạy tại**: `http://localhost:3000`

## 🎯 Luồng hoạt động MVC

### **📖 Khi user truy cập trang chủ:**
1. **Route** (`/`) → **MainController**.showHomePage()
2. **Controller** → **FileTreeModel**.getDisplayTree() (lấy data)
3. **Controller** → **MainView**.renderHomePage() (tạo HTML)  
4. **Response**: HTML page hoàn chỉnh

### **⚡ Khi user click "Tạo HTML":**
1. **Client JS** → POST `/create-html` (JSON request)
2. **Route** → **ApiController**.createHtmlReport()
3. **Controller** → **ReportModel**.createHtmlReport() (xử lý data)
4. **Controller** → **ReportModel**.saveHtmlReport() (lưu file)
5. **Response**: JSON `{success: true, message: "..."}`
6. **Client JS**: alert() → location.reload()

## 💡 Lợi ích Architecture MVC

### **🎯 Separation of Concerns**
- **Models**: Chỉ xử lý data logic
- **Views**: Chỉ làm presentation  
- **Controllers**: Điều phối giữa M và V

### **🔧 Maintainability** 
- Sửa UI → chỉ sửa Views
- Sửa business logic → chỉ sửa Controllers/Models
- Thêm tính năng → thêm method vào class tương ứng

### **🧪 Testability**
- Test từng layer riêng biệt
- Mock dependencies dễ dàng
- Unit test cho Models, integration test cho Controllers

### **📈 Scalability**
- Thêm Controllers mới cho features mới
- Models có thể dùng chung cho nhiều Controllers  
- Views có thể template reuse

### **👥 Team Collaboration**
- Frontend dev làm Views + Public assets
- Backend dev làm Models + Controllers
- DevOps làm Config + Deployment

## 🛠️ Tech Stack

### **Backend Framework**
- **Express.js**: Web server framework
- **Node.js**: JavaScript runtime

### **Template Engine** 
- **String templates**: Simple HTML generation trong Views

### **Data Processing**
- **xml2js**: XML parsing cho .rp files
- **fs.promises**: Async file operations

### **Client-Side**
- **Vanilla JavaScript**: DOM manipulation, AJAX
- **CSS3**: Modern styling

### **Architecture Pattern**
- **MVC**: Model-View-Controller
- **RESTful APIs**: Standard HTTP methods
- **Static file serving**: Express static middleware

## 📝 Configuration Options

### **config.json**
```json
{
  "port": 3000,                                    // Server port
  "reportsDir": "E:\\path\\to\\Reports",          // Katalon reports directory  
  "supportedFileExtensions": [".html", ".json", ".rp"], // File types to display
  "appName": "Katalon Reports Viewer",            // Application name
  "description": "MVC web app for Katalon reports" // App description
}
```

## 🔒 Security Features

- **Path validation**: Chỉ cho phép xóa collection.html trong _Collection
- **File extension filtering**: Chỉ hiển thị file types được support
- **Input sanitization**: Validate file paths trước khi xử lý
- **Error handling**: Graceful error responses

## 📊 File Types Supported

- **`.html`**: Katalon HTML reports
- **`.json`**: Test collection data  
- **`.rp`**: Report collection XML files

## 📦 Build & Deploy

### 🚀 **Build Executable (PKG)**

Ứng dụng có thể build thành standalone executable không cần Node.js:

```bash
# Cài PKG (chỉ cần 1 lần)
npm install -g pkg

# Build cho Windows
npm run build-win

# Build cho macOS (Intel)
npm run build-mac

# Build cho macOS (Apple Silicon M1/M2)  
npm run build-mac-arm

# Build cho Linux
npm run build-linux

# Build cho tất cả platforms
npm run build-all
```

**Kết quả:**
- Windows: `dist/katalon-reports-viewer.exe` (~43MB)
- macOS Intel: `dist/katalon-reports-viewer-macos` (~45MB)
- macOS ARM64: `dist/katalon-reports-viewer-macos-arm64` (~42MB)
- Linux: `dist/katalon-reports-viewer-linux` (~44MB)

### 📋 **Deploy Instructions**

1. **Copy sample config:** `cp config.json.sample config.json`
2. **Update config:** Sửa `reportsDir` trong config.json theo đường dẫn Reports của bạn
3. **Copy executable:** Chép `katalon-reports-viewer.exe` sang máy đích
4. **Copy config:** Chép `config.json` cùng folder với .exe  
5. **Run application:** Double-click .exe hoặc chạy từ command line
6. **Access web interface:** Mở browser tại `http://localhost:3000`

### ⚙️ **Build Scripts**

```bash
# Development
npm start              # Chạy từ source code
npm run dev           # Development mode

# Production Build  
npm run build         # Build all platforms
npm run build-win     # Build Windows only (.exe)
```

### ⚙️ **PKG Configuration**

```json
{
  "pkg": {
    "assets": [
      "src/**/*",     // MVC source code
      "public/**/*",  // Static assets  
      "config.json",  // Configuration
      "README.md"     // Documentation
    ],
    "targets": [
      "node18-win-x64",      // Windows 64-bit
      "node18-macos-x64",    // macOS Intel  
      "node18-macos-arm64",  // macOS Apple Silicon
      "node18-linux-x64"     // Linux 64-bit
    ],
    "outputPath": "dist"
  }
}
```

**Lợi ích executable:**
- ✅ **Portable**: Không cần Node.js trên máy đích
- ✅ **Single file**: Dễ distribute và deploy
- ✅ **Performance**: Tối ưu hóa cho production
- ✅ **Security**: Không expose source code

Project này đã đạt chuẩn **Enterprise-level MVC architecture** với clean code và professional structure! 🏆