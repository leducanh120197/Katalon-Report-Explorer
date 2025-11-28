const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

/**
 * Kiểm tra xem một node có chứa file cần hiển thị không (đệ quy)
 */
const hasDisplayableFile = node => {
    if (!node?.children?.length) return false;
    return node.children.some(child => 
        child?.isFile || hasDisplayableFile(child)
    );
};

/**
 * Kiểm tra xem đường dẫn có nằm trong thư mục _Collection không
 */
const isInCollectionFolder = filePath => {
    return filePath.includes('\\_Collection\\');
};

/**
 * Kiểm tra xem file có được hỗ trợ không
 */
const isSupportedFile = fileName => {
    const lowerCaseFile = fileName.toLowerCase();
    return config.supportedFileExtensions.some(ext => 
        lowerCaseFile.endsWith(ext)
    );
};

/**
 * Tạo cây thư mục
 */
const buildTree = async dir => {
    const name = path.basename(dir);
    if (name === 'katalon-reports-viewer') return null;

    const item = { name, path: dir, children: [] };
    const files = await fs.readdir(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
            const subTree = await buildTree(fullPath);
            if (subTree) item.children.push(subTree);
        } else if (isSupportedFile(file)) {
            item.children.push({ 
                name: file, 
                path: fullPath, 
                isFile: true,
                fileType: path.extname(file).substring(1) // Lấy phần mở rộng không có dấu chấm
            });
        }
    }
    
    item.children = item.children.filter(Boolean).reverse();
    return item;
};

module.exports = {
    hasDisplayableFile,
    isInCollectionFolder,
    isSupportedFile,
    buildTree
};