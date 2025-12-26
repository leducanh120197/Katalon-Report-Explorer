/**
 * Build script với timestamp
 * Tạo executable files với thời gian build trong tên file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Tạo timestamp cho build
function getBuildTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hour}${minute}${second}`;
}

// Đọc thông tin từ package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const appName = packageJson.name;
const version = packageJson.version;

// Tạo timestamp
const buildTime = getBuildTimestamp();

// Cấu trúc build
const buildConfigs = {
    'win': {
        target: 'node18-win-x64',
        extension: '.exe',
        platform: 'win'
    },
    'mac': {
        target: 'node18-macos-x64', 
        extension: '',
        platform: 'mac'
    },
    'mac-arm': {
        target: 'node18-macos-arm64',
        extension: '',
        platform: 'mac-arm'
    },
    'linux': {
        target: 'node18-linux-x64',
        extension: '',
        platform: 'linux'
    }
};

function buildForPlatform(platform, config) {
    console.log(`\n🔨 Building for ${platform}...`);
    
    // Tên file với timestamp
    const outputName = `${appName}_v${version}_${buildTime}_${config.platform}${config.extension}`;
    const tempOutputPath = path.join('dist', 'temp_output');
    
    try {
        // Build với pkg
        const pkgCommand = `pkg . --targets ${config.target} --out-path ${tempOutputPath}`;
        console.log(`Running: ${pkgCommand}`);
        execSync(pkgCommand, { stdio: 'inherit' });
        
        // Tìm file đã build
        const tempFiles = fs.readdirSync(tempOutputPath);
        const builtFile = tempFiles.find(file => 
            file.startsWith(appName) && 
            (config.extension === '' || file.endsWith(config.extension))
        );
        
        if (builtFile) {
            const oldPath = path.join(tempOutputPath, builtFile);
            const newPath = path.join('dist', outputName);
            
            // Di chuyển và đổi tên file
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Built: ${outputName}`);
            
            // Xóa thư mục temp
            fs.rmSync(tempOutputPath, { recursive: true, force: true });
            
            return outputName;
        } else {
            console.log('❌ No built file found');
            return null;
        }
    } catch (error) {
        console.error(`❌ Build failed for ${platform}:`, error.message);
        return null;
    }
}

function buildAll() {
    console.log(`🚀 Starting build with timestamp: ${buildTime}`);
    console.log(`📦 App: ${appName} v${version}\n`);
    
    // Tạo thư mục dist nếu chưa có
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }
    
    // Build cho từng platform
    const results = [];
    const platformArg = process.argv[2];
    
    if (platformArg && buildConfigs[platformArg]) {
        // Build cho platform cụ thể
        const result = buildForPlatform(platformArg, buildConfigs[platformArg]);
        if (result) results.push(result);
    } else {
        // Build cho tất cả platforms
        for (const [platform, config] of Object.entries(buildConfigs)) {
            const result = buildForPlatform(platform, config);
            if (result) results.push(result);
        }
    }
    
    // Tóm tắt kết quả
    console.log('\n📋 Build Summary:');
    console.log('================');
    if (results.length > 0) {
        results.forEach(file => {
            const filePath = path.join('dist', file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`✅ ${file} (${sizeMB} MB)`);
        });
    } else {
        console.log('❌ No files built successfully');
    }
    
    console.log(`\n⏰ Build completed at: ${new Date().toLocaleString()}`);
}

// Chạy build
buildAll();