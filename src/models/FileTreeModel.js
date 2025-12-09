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

    /**
     * Parse folder structure thành dạng report table rows
     * @param {string} dir - Thư mục gốc để scan  
     * @returns {Array} - Array of report rows cho table display
     */
    static async getReportTableData(dir) {
        try {
            const tree = await this.getDisplayTree(dir);
            
            if (!tree?.children?.length) {
                return [];
            }
            
            const reportRows = [];
            
            // Duyệt qua các timestamp folders (level 1)
            for (const timestampFolder of tree.children) {
                
                if (!timestampFolder.children?.length) {
                    continue;
                }
                
                let folderRowCount = 0;
                const timestampName = timestampFolder.name;
                
                // Kiểm tra nếu có file .rp trực tiếp trong timestamp folder
                const directRpFiles = timestampFolder.children.filter(f => f.isFile && f.fileType === 'rp');
                if (directRpFiles.length > 0) {
                    directRpFiles.forEach(rpFile => {
                        reportRows.push({
                            folder: timestampName,
                            platform: '_Collection',
                            role: 'Test Collection',
                            module: '',
                            runId: timestampName,
                            reportFile: rpFile.name,
                            reportPath: rpFile.path,
                            isFirstInFolder: folderRowCount === 0
                        });
                        folderRowCount++;
                    });
                }
                
                // Tìm _Collection folder và các platform folders
                for (const child of timestampFolder.children) {
                    if (child.name === '_Collection' && child.children) {
                        // Collection row
                        const collectionFiles = child.children.filter(f => f.isFile && (f.fileType === 'rp' || f.fileType === 'json'));
                        if (collectionFiles.length > 0) {
                            const rpFile = collectionFiles.find(f => f.fileType === 'rp');
                            const htmlFile = collectionFiles.find(f => f.fileType === 'html');
                            const reportFile = htmlFile || rpFile || collectionFiles[0];
                            
                            reportRows.push({
                                folder: timestampName,
                                platform: '_Collection', 
                                role: 'STG - Collection',
                                module: '',
                                runId: timestampName,
                                reportFile: reportFile ? reportFile.name : '',
                                reportPath: reportFile ? reportFile.path : '',
                                isFirstInFolder: folderRowCount === 0
                            });
                            folderRowCount++;
                        }
                    } else if (child.children?.length) {
                        // Platform folder (Android, iOS, etc.) hoặc Test Suites
                        const platformName = child.name;
                        
                        // Nếu là Test Suites folder, dive deeper
                        if (platformName === 'Test Suites') {
                            for (const testSuiteChild of child.children) {
                                if (testSuiteChild.children?.length) {
                                    this.processNestedFolder(testSuiteChild, timestampName, folderRowCount, reportRows);
                                    folderRowCount += this.countRowsAdded(testSuiteChild);
                                }
                            }
                        } else {
                            // Direct platform folder - Android level is depth 0
                            // Start with Android as platform
                            const initialPathInfo = { platform: child.name };
                            this.findAllReportFiles(child, timestampName, folderRowCount, reportRows, 1, initialPathInfo);
                            folderRowCount += this.countRowsAdded(child);
                        }
                    }
                }
                
                // Nếu không tìm thấy gì, thêm ít nhất 1 row cho folder
                if (folderRowCount === 0) {
                    reportRows.push({
                        folder: timestampName,
                        platform: 'Unknown',
                        role: '',
                        module: '',
                        runId: timestampName,
                        reportFile: '',
                        reportPath: '',
                        isFirstInFolder: true
                    });
                }
            }
            
            return reportRows;
        } catch (error) {
            console.error('Error in getReportTableData:', error);
            return [];
        }
    }

    /**
     * Process nested folder structure để extract report data
     */
    static processNestedFolder(folder, timestampName, folderRowCount, reportRows) {
        // Bắt đầu với depth = 0 (platform level)
        this.findAllReportFiles(folder, timestampName, folderRowCount, reportRows, 0, {});
    }

    /**
     * Recursively find all report files in a folder structure
     * Structure: timestamp/platform/role/module/runId/file
     */
    static findAllReportFiles(node, timestampName, folderRowCount, reportRows, depth = 0, pathInfo = {}) {
        if (!node.children?.length) return;
        
        // Nếu có files trong node này
        const reportFiles = node.children.filter(f => f.isFile && (f.fileType === 'rp' || f.fileType === 'html' || f.fileType === 'json'));
        
        if (reportFiles.length > 0) {
            reportFiles.forEach(file => {
                reportRows.push({
                    folder: timestampName,
                    platform: pathInfo.platform || 'Unknown',
                    role: pathInfo.role || '',
                    module: pathInfo.module || '',
                    runId: this.extractRunId(file.name) || pathInfo.runId || timestampName,
                    reportFile: file.name,
                    reportPath: file.path,
                    isFirstInFolder: reportRows.filter(r => r.folder === timestampName).length === 0
                });
            });
        }
        
        // Recurse into subfolders với updated path info
        for (const child of node.children) {
            if (!child.isFile) {
                let newPathInfo = { ...pathInfo };
                
                // Determine level based on depth (adjusted for starting from Android level)
                switch (depth) {
                    case 0: // Platform level (Android, iOS) - already set in initial call
                        if (!newPathInfo.platform) newPathInfo.platform = child.name;
                        break;
                    case 1: // Role level (Admin, Owner, ResidentRenew) 
                        newPathInfo.role = child.name;
                        break;
                    case 2: // Module level (Login, Home, Chat, AgreeContract, etc.)
                        newPathInfo.module = child.name;
                        break;
                    case 3: // RunId level (20251203_200844)
                        newPathInfo.runId = child.name;
                        break;
                }
                
                this.findAllReportFiles(child, timestampName, folderRowCount, reportRows, depth + 1, newPathInfo);
            }
        }
    }

    /**
     * Count potential rows that would be added from a folder
     */
    static countRowsAdded(folder) {
        let count = 0;
        if (folder.children?.length) {
            for (const child of folder.children) {
                if (child.isFile && (child.fileType === 'rp' || child.fileType === 'html' || child.fileType === 'json')) {
                    count++;
                } else if (!child.isFile) {
                    count += this.countRowsAdded(child);
                }
            }
        }
        return Math.max(count, 0);
    }

    /**
     * Extract Run ID from filename if possible
     */
    static extractRunId(filename) {
        const match = filename.match(/(\d{8}_\d{6})/);
        return match ? match[1] : null;
    }
}

module.exports = FileTreeModel;