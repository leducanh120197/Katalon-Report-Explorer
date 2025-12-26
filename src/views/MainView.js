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
     * Render trang chủ với bảng report có cấu trúc
     * @param {Array} reportTableData - Dữ liệu report table từ FileTreeModel
     * @returns {string} - HTML string của trang chủ
     */
    static renderHomePage(reportTableData) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Katalon Reports Viewer</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; margin-bottom: 20px; }
                    .controls { margin-bottom: 20px; }
                    .controls button { 
                        background-color: #007cba; 
                        color: white; 
                        border: none; 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer; 
                        margin-right: 10px;
                    }
                    .controls button:hover { background-color: #005a87; }
                    .controls .auto-start-section {
                        display: inline-block;
                        margin-left: 20px;
                        vertical-align: top;
                    }
                    .controls .auto-start-status {
                        font-size: 14px;
                        margin-right: 10px;
                        color: #666;
                    }
                    .auto-start-enabled { color: #28a745; }
                    .auto-start-disabled { color: #dc3545; }
                    
                    table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        font-size: 14px; 
                    }
                    th, td { 
                        border: 1px solid #ccc; 
                        padding: 6px 10px; 
                        text-align: left;
                    }
                    th { 
                        background: #f2f2f2; 
                        font-weight: bold;
                    }
                    tr:hover {
                        background-color: #f0f8ff;
                        transition: background-color 0.2s ease;
                    }
                    tr:hover td {
                        background-color: #f0f8ff;
                    }
                    .report-link { 
                        color: #007cba; 
                        text-decoration: none; 
                    }
                    .report-link:hover { 
                        text-decoration: underline; 
                    }
                    .empty-cell { 
                        background-color: #fafafa; 
                    }
                </style>
            </head>
            <body>
                <h1>Katalon Reports Viewer</h1>
                <div class="controls">
                    <form action="/tree-show" method="get" style="display: inline-block;">
                        <button type="submit">Show Tree JSON</button>
                    </form>
                    <div class="auto-start-section">
                        <span id="auto-start-status" class="auto-start-status">Auto-start: <span id="auto-start-value">Đang kiểm tra...</span></span>
                        <button type="button" id="toggle-auto-start">Bật/Tắt Auto-start</button>
                    </div>
                </div>
                ${this.renderReportTable(reportTableData)}
                <script src="/scripts.js"></script>
            </body>
            </html>
        `;
    }

    /**
     * Render bảng report với cấu trúc có merged cells
     * @param {Array} reportTableData - Dữ liệu report table
     * @returns {string} - HTML string của bảng report
     */
    static renderReportTable(reportTableData) {
        if (!reportTableData || reportTableData.length === 0) {
            return '<p>Không có dữ liệu report để hiển thị.</p>';
        }

        // Determine max depth from data
        const maxDepth = this.getMaxDepth(reportTableData);

        // Group data by folder để tính rowspan
        const groupedData = {};
        reportTableData.forEach(row => {
            if (!groupedData[row.folder]) {
                groupedData[row.folder] = [];
            }
            groupedData[row.folder].push(row);
        });

        // Generate dynamic headers
        let headerCells = '<th>Folder</th>';
        for (let i = 1; i <= maxDepth; i++) {
            headerCells += `<th>Level ${i}</th>`;
        }
        headerCells += '<th>Run ID</th><th>Report File</th>';

        let tableRows = '';
        
        Object.keys(groupedData).forEach(folder => {
            const folderRows = groupedData[folder];
            
            // Calculate rowspans for each level
            const rowSpans = this.calculateRowSpans(folderRows, maxDepth);
            
            folderRows.forEach((row, index) => {
                const levels = this.extractLevels(row, maxDepth);
                
                let dataCells = '';
                levels.forEach((level, levelIndex) => {
                    const rowSpan = rowSpans[levelIndex][index];
                    if (rowSpan > 0) {
                        dataCells += `<td rowspan="${rowSpan}">${level}</td>`;
                    }
                });
                
                tableRows += `
                <tr>
                    ${index === 0 ? `<td rowspan="${folderRows.length}">${folder}</td>` : ''}
                    ${dataCells}
                    <td>${row.runId}</td>
                    <td>${row.reportFile ? `<a href="/view?file=${encodeURIComponent(row.reportPath || row.reportFile)}" target="_blank" class="report-link">${row.reportFile}</a>` : ''}</td>
                </tr>`;
            });
        });

        return `
        <h2>Report Table</h2>
        <p>Danh sách các report được tổ chức theo cấu trúc thư mục động.</p>
        
        <table>
            <tr>
                ${headerCells}
            </tr>
            ${tableRows}
        </table>
        `;
    }

    /**
     * Calculate max depth from report data
     * @param {Array} reportTableData - Report data
     * @returns {number} - Maximum depth found
     */
    static getMaxDepth(reportTableData) {
        let maxDepth = 0;
        reportTableData.forEach(row => {
            const levels = [row.platform, row.role, row.module].filter(Boolean);
            maxDepth = Math.max(maxDepth, levels.length);
        });
        return maxDepth;
    }

    /**
     * Extract levels array from row data, padded to maxDepth
     * @param {Object} row - Report row
     * @param {number} maxDepth - Maximum depth to pad to
     * @returns {Array} - Array of level values
     */
    static extractLevels(row, maxDepth) {
        const levels = [row.platform, row.role, row.module].filter(Boolean);
        // Pad with empty strings to match maxDepth
        while (levels.length < maxDepth) {
            levels.push('');
        }
        return levels;
    }

    /**
     * Calculate rowspans for each level column to merge cells with same values
     * @param {Array} folderRows - All rows in a folder
     * @param {number} maxDepth - Maximum depth
     * @returns {Array} - Array of rowspan arrays for each level
     */
    static calculateRowSpans(folderRows, maxDepth) {
        const rowSpans = [];
        
        // Initialize rowspan arrays for each level
        for (let level = 0; level < maxDepth; level++) {
            rowSpans[level] = new Array(folderRows.length).fill(0);
        }
        
        // Calculate rowspans for each level
        for (let level = 0; level < maxDepth; level++) {
            let currentGroup = 0;
            let groupStart = 0;
            
            for (let i = 0; i < folderRows.length; i++) {
                const currentLevels = this.extractLevels(folderRows[i], maxDepth);
                const currentValue = currentLevels[level];
                
                // Check if we need to start a new group
                let shouldStartNewGroup = false;
                
                if (i === 0) {
                    shouldStartNewGroup = true;
                } else {
                    const prevLevels = this.extractLevels(folderRows[i-1], maxDepth);
                    
                    // Start new group if current value differs from previous
                    // OR if any parent level changed (hierarchical grouping)
                    if (currentValue !== prevLevels[level]) {
                        shouldStartNewGroup = true;
                    } else {
                        // Check if any parent level changed
                        for (let parentLevel = 0; parentLevel < level; parentLevel++) {
                            if (currentLevels[parentLevel] !== prevLevels[parentLevel]) {
                                shouldStartNewGroup = true;
                                break;
                            }
                        }
                    }
                }
                
                if (shouldStartNewGroup) {
                    // Close previous group if exists
                    if (i > 0) {
                        const groupSize = i - groupStart;
                        rowSpans[level][groupStart] = groupSize;
                    }
                    groupStart = i;
                }
                
                // Close last group
                if (i === folderRows.length - 1) {
                    const groupSize = i - groupStart + 1;
                    rowSpans[level][groupStart] = groupSize;
                }
            }
        }
        
        return rowSpans;
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