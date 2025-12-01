/**
 * Katalon Reports Viewer - XML Parser Utilities
 * Copyright (c) 2025 leducanh120197  
 * Licensed under MIT License - see LICENSE file
 */

const xml2js = require('xml2js');
const fs = require('fs').promises;

/**
 * Phân tích và parse file XML (.rp) của Katalon
 * @param {string} filePath - Đường dẫn đến file .rp cần parse
 * @returns {Object|null} - Parsed XML object hoặc null nếu có lỗi
 */
async function parseRpFile(filePath) {
    try {
        // Đọc nội dung XML từ file
        const xmlData = await fs.readFile(filePath, 'utf8');
        // Tạo parser với config không dùng array cho single element
        const parser = new xml2js.Parser({ explicitArray: false });
        // Parse XML string thành JavaScript object
        const result = await parser.parseStringPromise(xmlData);
        return result;
    } catch (err) {
        console.error('Error parsing RP file:', err);
        return null;
    }
}

/**
 * Tạo HTML table từ dữ liệu đã parse từ file .rp
 * @param {Object} rpData - Object chứa data đã parse từ XML
 * @returns {string} - HTML table string hiển thị thông tin test suites
 */
function createRpTable(rpData) {
    // Kiểm tra cấu trúc dữ liệu có hợp lệ không
    if (!rpData || !rpData.ReportCollectionEntity || !rpData.ReportCollectionEntity.reportItemDescriptions) {
        return '<p>Không thể phân tích dữ liệu từ file .rp</p>';
    }

    // Handle cả single item và array của ReportItemDescription
    const reportItems = Array.isArray(rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription) 
        ? rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription 
        : [rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription];

    // Tạo HTML table với thông tin chi tiết từng test suite
    return `
    <h2>Chi tiết Test Suite</h2>
    <table>
        <tr>
            <th>STT</th>
            <th>Test Suite</th>
            <th>Đường dẫn báo cáo</th>
            <th>Nhóm</th>
            <th>Thiết bị</th>
            <th>ID Thiết bị</th>
            <th>Profile</th>
            <th>Cấu hình</th>
            <th>Số lượng test case</th>
        </tr>
        ${reportItems.map((item, index) => {
            // Extract thông tin từ reportLocation
            const reportLocation = item.reportLocation || '';
            const testSuitePath = reportLocation.split('/');
            const testSuiteName = testSuitePath.pop() || 'N/A';
            const testSuiteGroup = testSuitePath.length > 2 ? testSuitePath[testSuitePath.length - 2] : 'N/A';
            
            // Extract device information từ runConfigDescription
            const deviceName = item.runConfigDescription?.runConfigurationData?.entry?.find(e => e.key === 'deviceName')?.value || 'N/A';
            const deviceId = item.runConfigDescription?.runConfigurationData?.entry?.find(e => e.key === 'deviceId')?.value || 'N/A';
            
            // Extract configuration information
            const profileName = item.runConfigDescription?.profileName || 'N/A';
            const groupName = item.runConfigDescription?.groupName || 'N/A';
            const configId = item.runConfigDescription?.runConfigurationId || 'N/A';
            const testCaseAmount = item.testCaseAmount || '0';
            
            // Return HTML row cho mỗi test suite
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${testSuiteName}</td>
                <td>${reportLocation}</td>
                <td>${testSuiteGroup}</td>
                <td>${deviceName}</td>
                <td>${deviceId}</td>
                <td>${profileName}</td>
                <td>${configId}</td>
                <td>${testCaseAmount}</td>
            </tr>`;
        }).join('')}
    </table>
    `;
}

module.exports = {
    parseRpFile,
    createRpTable
};