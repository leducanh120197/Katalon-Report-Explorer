/**
 * Katalon Reports Viewer - ReportModel
 * Copyright (c) 2025 leducanh120197
 * Licensed under MIT License - see LICENSE file
 */

const fs = require('fs').promises;
const path = require('path');
const { parseRpFile, createRpTable } = require('../utils/xmlParser');

/**
 * Model để xử lý việc tạo và quản lý HTML reports từ Katalon data
 * Chịu trách nhiệm đọc JSON/RP files và tạo HTML output
 */
class ReportModel {
    /**
     * Đọc và parse dữ liệu từ JSON report file  
     * @param {string} jsonFilePath - Đường dẫn đến file collection.json
     * @returns {Object} - Object chứa metadata của test execution
     */
    static async getJsonData(jsonFilePath) {
        try {
            // Đọc file JSON content
            const jsonContent = await fs.readFile(jsonFilePath, 'utf8');
            // Parse JSON và trả về object
            return JSON.parse(jsonContent);
        } catch (err) {
            console.error('Error reading JSON file:', err);
            // Trả về object rỗng nếu có lỗi
            return {};
        }
    }

    /**
     * Đọc và xử lý dữ liệu từ RP (Result Package) file
     * @param {string} rpFilePath - Đường dẫn đến file .rp
     * @returns {string} - HTML table string chứa kết quả test cases
     */
    static async getRpData(rpFilePath) {
        try {
            // Parse XML content từ file .rp
            const rpData = await parseRpFile(rpFilePath);
            // Tạo HTML table từ parsed data
            return createRpTable(rpData);
        } catch (err) {
            console.error('Error processing RP file:', err);
            // Trả về thông báo lỗi nếu không đọc được
            return '<p>Không thể đọc dữ liệu từ file .rp</p>';
        }
    }

    /**
     * Tạo HTML report hoàn chỉnh từ JSON và RP data
     * @param {string} filePath - Đường dẫn file JSON hoặc RP làm đầu vào
     * @returns {string} - HTML string hoàn chỉnh ready để save
     */
    static async createHtmlReport(filePath) {
        const dirPath = path.dirname(filePath);
        
        // Xác định đường dẫn file JSON và RP based on input file
        let jsonFilePath = '';
        let rpFilePath = '';
        
        if (filePath.toLowerCase().endsWith('.json')) {
            // Input là JSON file
            jsonFilePath = filePath;
            rpFilePath = path.join(dirPath, path.basename(dirPath) + '.rp');
        } else if (filePath.toLowerCase().endsWith('.rp')) {
            // Input là RP file  
            rpFilePath = filePath;
            jsonFilePath = path.join(dirPath, 'collection.json');
        }

        // Lấy dữ liệu từ cả 2 files
        const jsonData = await this.getJsonData(jsonFilePath);
        const rpTableHtml = await this.getRpData(rpFilePath);

        // Tạo HTML content với styling và metadata
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${jsonData.name || 'Katalon Test Report'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .pass { color: green; }
                .fail { color: red; }
                .error { color: orange; }
                h1, h2 { color: #333; }
            </style>
        </head>
        <body>
            <h1>${jsonData.name || 'Katalon Test Report'}</h1>
            <div>
                <p><strong>Start Time:</strong> ${jsonData.startTime ? new Date(jsonData.startTime).toLocaleString() : 'N/A'}</p>
                <p><strong>End Time:</strong> ${jsonData.endTime ? new Date(jsonData.endTime).toLocaleString() : 'N/A'}</p>
                <p><strong>Duration:</strong> ${jsonData.startTime && jsonData.endTime ? Math.round((jsonData.endTime - jsonData.startTime) / 60000) + ' minutes' : 'N/A'}</p>
            </div>
            <h2>Tổng quan kết quả</h2>
            <table>
                <tr>
                    <th>Total Test Cases</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Error</th>
                    <th>Skipped</th>
                    <th>Incomplete</th>
                </tr>
                <tr>
                    <td>${jsonData.totalTestCases || 0}</td>
                    <td class="pass">${jsonData.totalPassedTestCases || 0}</td>
                    <td class="fail">${jsonData.totalFailedTestCases || 0}</td>
                    <td class="error">${jsonData.totalErrorTestCases || 0}</td>
                    <td>${jsonData.totalSkippedTestCases || 0}</td>
                    <td>${jsonData.totalIncompleteTestCases || 0}</td>
                </tr>
            </table>
            ${rpTableHtml}
            ${jsonData.description ? `<div><h2>Description</h2><p>${jsonData.description}</p></div>` : ''}
        </body>
        </html>
        `;

        return htmlContent;
    }

    /**
     * Lưu HTML content vào file collection.html
     * @param {string} filePath - Đường dẫn file gốc (để tìm directory)
     * @param {string} htmlContent - HTML content cần lưu
     * @returns {string} - Success message
     */
    static async saveHtmlReport(filePath, htmlContent) {
        const dirPath = path.dirname(filePath);
        const htmlFilePath = path.join(dirPath, 'collection.html');
        
        // Kiểm tra file đã tồn tại chưa để tránh ghi đè
        try {
            await fs.access(htmlFilePath);
            // Nếu access thành công = file đã tồn tại
            throw new Error('File HTML đã tồn tại');
        } catch (err) {
            if (err.message === 'File HTML đã tồn tại') {
                throw err;
            }
            // File chưa tồn tại, tiếp tục tạo file mới
        }
        
        // Ghi HTML content vào file
        await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
        return 'Đã tạo file HTML thành công';
    }

    /**
     * Xóa HTML report file với security check
     * @param {string} filePath - Đường dẫn đầy đủ đến file cần xóa
     * @returns {string} - Success message  
     */
    static async deleteHtmlReport(filePath) {
        // Security check: chỉ cho phép xóa collection.html trong thư mục _Collection
        if (!filePath.includes('\\_Collection\\') || !filePath.endsWith('collection.html')) {
            throw new Error('Chỉ được phép xóa file collection.html trong thư mục _Collection');
        }
        
        // Thực hiện xóa file
        await fs.unlink(filePath);
        return 'Đã xóa file HTML thành công';
    }
}

module.exports = ReportModel;