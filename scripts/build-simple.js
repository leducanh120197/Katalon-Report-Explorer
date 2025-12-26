/**
 * Build script đơn giản với timestamp
 * Sử dụng pkg với tùy chọn --output để đặt tên file custom
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Tạo timestamp
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hour}${minute}`;
}

// Đọc thông tin package
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const appName = packageJson.name;
const version = packageJson.version;
const timestamp = getTimestamp();

// Tạo thư mục dist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

const platform = process.argv[2] || 'win';

const platforms = {
    'win': {
        target: 'node18-win-x64',
        ext: '.exe'
    },
    'mac': {
        target: 'node18-macos-x64', 
        ext: ''
    },
    'linux': {
        target: 'node18-linux-x64',
        ext: ''
    }
};

if (platforms[platform]) {
    const config = platforms[platform];
    const outputName = `${appName}_v${version}_${timestamp}_${platform}${config.ext}`;
    const outputPath = `dist/${outputName}`;
    
    console.log(`Building ${outputName}...`);
    
    try {
        execSync(`pkg . --targets ${config.target} --output ${outputPath}`, { 
            stdio: 'inherit' 
        });
        console.log(`✅ Build successful: ${outputName}`);
    } catch (error) {
        console.error('❌ Build failed:', error.message);
    }
} else {
    console.error('❌ Invalid platform. Use: win, mac, or linux');
}