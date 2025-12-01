/**
 * Katalon Reports Viewer - MainView  
 * Copyright (c) 2025 leducanh120197
 * Licensed under MIT License - see LICENSE file
 */

const FileTreeModel = require('../models/FileTreeModel');

/**
 * View class để render các template HTML
 * Chỉ chịu trách nhiệm tạo HTML output, không xử lý business logic
 */
class MainView {
    /**
     * Render trang chủ với danh sách file reports
     * @param {Object} tree - Cấu trúc cây thư mục từ FileTreeModel
     * @returns {string} - HTML string của trang chủ
     */
    static renderHomePage(tree) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Katalon Reports Viewer</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <h1>Katalon Reports Viewer</h1>
                <div style="margin-bottom: 20px;">
                    <form action="/tree" method="get" style="display: inline-block; margin-right: 10px;"><button>Tree</button></form>
                    <form action="/tree-show" method="get" style="display: inline-block;"><button type="submit">Show Tree JSON</button></form>
                </div>
                ${this.renderFileTree(tree)}
                <script src="/scripts.js"></script>
            </body>
            </html>
        `;
    }

    /**
     * Render cây file dưới dạng table HTML
     * @param {Object} tree - Cấu trúc cây thư mục
     * @returns {string} - HTML string của bảng file tree
     */
    static renderFileTree(tree) {
        // Kiểm tra có dữ liệu không
        if (!tree?.children?.length) return '<p>Không có file nào để hiển thị.</p>';
        
        return `
        <table class="file-table">
            <tbody>
                ${this.renderTreeRows(tree, 0)}
            </tbody>
        </table>
        `;
    }

    /**
     * Render các dòng trong cây file một cách đệ quy
     * @param {Object} node - Node hiện tại trong cây
     * @param {number} level - Mức độ lồng ghép (để tạo indent)
     * @returns {string} - HTML string của các dòng table
     */
    static renderTreeRows(node, level) {
        // Kiểm tra node có children không
        if (!node?.children?.length) return '';
        
        let rows = '';
        
        // Duyệt qua tất cả children của node
        for (const child of node.children) {
            if (!child) continue;
            
            // Tạo indent theo level
            const indent = '&nbsp;'.repeat(level * 4);
            
            if (child.isFile) {
                // Xử lý file: kiểm tra các điều kiện để hiển thị buttons
                const isInCollection = FileTreeModel.isInCollectionFolder(child.path);
                const isJsonOrRp = child.fileType === 'json' || child.fileType === 'rp';
                const isHtml = child.fileType === 'html' && child.name === 'collection.html';
                
                // Button tạo HTML (chỉ hiện với file JSON/RP trong Collection)
                const createHtmlButton = isInCollection && isJsonOrRp ? 
                    `<button class="create-html-btn" data-path="${encodeURIComponent(child.path)}">Tạo HTML</button>` : '';
                
                // Button xóa HTML (chỉ hiện với file collection.html)
                const deleteHtmlButton = isInCollection && isHtml ? 
                    `<button class="delete-html-btn" data-path="${encodeURIComponent(child.path)}">Xóa</button>` : '';
                
                // Render dòng file
                rows += `
                <tr class="file-row">
                    <td>${indent}
                        <a href="/view?file=${encodeURIComponent(child.path)}" target="_blank">${child.name}</a>
                        ${createHtmlButton}
                        ${deleteHtmlButton}
                    </td>
                </tr>`;
            } else {
                // Xử lý thư mục: render folder với toggle functionality
                rows += `
                <tr class="folder-row open">
                    <td>${indent}
                        <span class="toggle-folder" data-path="${encodeURIComponent(child.path)}" data-has-files="${FileTreeModel.hasDisplayableFile(child)}">${child.name}</span>
                    </td>
                </tr>`;
                
                // Nếu folder có file hiển thị được, render nested table
                if (FileTreeModel.hasDisplayableFile(child)) {
                    rows += `
                    <tr class="folder-content" data-parent="${encodeURIComponent(child.path)}" style="display:table-row">
                        <td colspan="1">
                            <table class="nested-table">
                                <tbody>
                                    ${this.renderTreeRows(child, level + 1)}
                                </tbody>
                            </table>
                        </td>
                    </tr>`;
                }
            }
        }
        
        return rows;
    }


    

    /**
     * Render trang hiển thị JSON tree với format đẹp
     * @param {Object} jsonTree - Cấu trúc JSON tree từ FileTreeModel  
     * @param {string} reportsDir - Đường dẫn thư mục reports
     * @returns {string} - HTML string của trang JSON tree
     */
    static renderJsonTreePage(jsonTree, reportsDir) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tree Structure - JSON</title>
                <style>
                    body { font-family: monospace; margin: 20px; background-color: #f5f5f5; }
                    .header { margin-bottom: 20px; }
                    .back-btn { background-color: #007cba; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
                    .back-btn:hover { background-color: #005a87; }
                    .json-container { background-color: white; border: 1px solid #ddd; border-radius: 4px; padding: 20px; overflow: auto; max-height: 80vh; }
                    pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
                </style>
            </head>
            <body>
                <div class="header">
                    <a href="/" class="back-btn">← Back to Home</a>
                    <h1>Tree Structure (JSON Format)</h1>
                    <p>Reports Directory: <strong>${reportsDir}</strong></p>
                </div>
                <table class="file-table">
                    <tbody>
                        ${this.renderTreeRows(jsonTree, 1)}
                    </tbody>
                </table>

                <div class="json-container">
                    <pre>${JSON.stringify(jsonTree, null, 2)}</pre>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Render trang lỗi đơn giản
     * @param {string} errorMessage - Thông báo lỗi cần hiển thị
     * @returns {string} - HTML string của trang lỗi
     */
    static renderErrorPage(errorMessage) {
        return `
            <h1>Error</h1>
            <p>Could not read directory structure: ${errorMessage}</p>
            <a href="/">← Back to Home</a>
        `;
    }
}

module.exports = MainView;