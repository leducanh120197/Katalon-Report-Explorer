const path = require('path');
const fs = require('fs');

// Đọc config từ file JSON
let config = {};
try {
    // PKG executable: config.json ở cùng thư mục với .exe
    // Development: config.json ở root project
    let configPath;
    if (process.pkg) {
        // Running as PKG executable - config.json cùng thư mục với .exe
        configPath = path.join(path.dirname(process.execPath), 'config.json');
    } else {
        // Running from source - config.json ở root project
        configPath = path.join(__dirname, '..', '..', 'config.json');
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error('Error reading config file:', error);
    // Fallback config nếu không đọc được file
    config = {
        port: 3000,
        reportsDir: path.join(__dirname, '..', '..', '..', 'Reports'),
        supportedFileExtensions: ['.html', '.json', '.rp'],
        appName: 'Katalon Reports Viewer',
        description: 'Ứng dụng web để xem và quản lý báo cáo từ Katalon Studio'
    };
}

module.exports = config;