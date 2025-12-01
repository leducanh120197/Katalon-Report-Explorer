const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

/**
 * Model để xử lý File Tree data
 */
class FileTreeModel {
    /**
     * Kiểm tra file có được hỗ trợ không
     * @param {string} fileName - Tên file cần kiểm tra
     * @returns {boolean} - true nếu file được hỗ trợ, false nếu không
     */
    static isSupportedFile(fileName) {
        // Chuyển tên file về lowercase để kiểm tra không phân biệt hoa thường
        const lowerCaseFile = fileName.toLowerCase();
        // Kiểm tra extension có trong danh sách được hỗ trợ không
        return config.supportedFileExtensions.some(ext => 
            lowerCaseFile.endsWith(ext)
        );
    }

    /**
     * Kiểm tra có trong thư mục Collection không
     * @param {string} filePath - Đường dẫn đầy đủ của file
     * @returns {boolean} - true nếu file nằm trong thư mục _Collection
     */
    static isInCollectionFolder(filePath) {
        // Kiểm tra đường dẫn có chứa thư mục _Collection không
        return filePath.includes('\\_Collection\\');
    }

    /**
     * Lấy cây thư mục để hiển thị trên giao diện
     * @param {string} dir - Thư mục gốc để scan
     * @returns {Object|null} - Cấu trúc cây thư mục hoặc null nếu thư mục bị loại trừ
     */
    static async getDisplayTree(dir) {
        // Lấy tên thư mục từ đường dẫn
        const name = path.basename(dir);
        // Loại trừ thư mục gốc của ứng dụng
        if (name === 'katalon-reports-viewer') return null;

        // Tạo object đại diện cho thư mục hiện tại
        const item = { name, path: dir, children: [] };
        
        try {
            const files = await fs.readdir(dir);

            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory()) {
                    const subTree = await this.getDisplayTree(fullPath);
                    if (subTree) item.children.push(subTree);
                } else if (this.isSupportedFile(file)) {
                    item.children.push({ 
                        name: file, 
                        path: fullPath, 
                        isFile: true,
                        fileType: path.extname(file).substring(1)
                    });
                }
            }
            
            item.children = item.children.filter(Boolean).reverse();
            return item;
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
            return null;
        }
    }

    /**
     * Lấy cây thư mục dạng JSON với thông tin đầy đủ
     * @param {string} dir - Thư mục gốc để scan
     * @returns {Object|null} - Cấu trúc cây JSON chi tiết với metadata hoặc null nếu thư mục bị loại trừ
     */
    static async getJsonTree(dir) {
        try {
            // Lấy tên thư mục từ đường dẫn
            const name = path.basename(dir);
            // Loại trừ các thư mục không cần thiết
            if (name === 'katalon-reports-viewer') return null;
            if (name === 'Self-healing') return null;

            // Lấy thông tin metadata của thư mục
            const stats = await fs.stat(dir);
            // Tạo object với thông tin chi tiết
            const item = {
                name,
                path: dir,
                type: 'directory',
                // size: stats.size,
                // created: stats.birthtime,
                // modified: stats.mtime,
                children: []
            };

            const files = await fs.readdir(dir);

            for (const file of files) {
                const fullPath = path.join(dir, file);
                const fileStats = await fs.stat(fullPath);
                
                if (fileStats.isDirectory()) {
                    const subTree = await this.getJsonTree(fullPath);
                    if (subTree) item.children.push(subTree);
                } else if (this.isSupportedFile(file)) {
                    item.children.push({
                        name: file,
                        path: fullPath,
                        type: 'file',
                        fileType: path.extname(file).substring(1),
                        // size: fileStats.size,
                        // created: fileStats.birthtime,
                        // modified: fileStats.mtime,
                        isDisplayable: true,
                        isInCollection: this.isInCollectionFolder(fullPath)
                    });
                }
            }
            
            item.children = item.children.filter(Boolean).reverse();
            return item;
        } catch (error) {
            console.error('Error building JSON tree:', error);
            return null;
        }
    }

    /**
     * Kiểm tra node có file hiển thị không
     * @param {Object} node - Node cần kiểm tra
     * @returns {boolean} - true nếu node hoặc children có file có thể hiển thị
     */
    static hasDisplayableFile(node) {
        // Kiểm tra node có children không
        if (!node?.children?.length) return false;
        // Tìm kiếm đệ quy trong children
        return node.children.some(child => 
            child?.isFile || this.hasDisplayableFile(child)
        );
    }
}

module.exports = FileTreeModel;