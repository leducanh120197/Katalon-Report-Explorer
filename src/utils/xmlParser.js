const fs = require('fs').promises;
const xml2js = require('xml2js');

/**
 * Phân tích file XML (.rp)
 */
async function parseRpFile(filePath) {
    try {
        const xmlData = await fs.readFile(filePath, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);
        return result;
    } catch (err) {
        console.error('Error parsing RP file:', err);
        return null;
    }
}

/**
 * Tạo bảng từ dữ liệu file .rp
 */
function createRpTable(rpData) {
    if (!rpData || !rpData.ReportCollectionEntity || !rpData.ReportCollectionEntity.reportItemDescriptions) {
        return '<p>Không thể phân tích dữ liệu từ file .rp</p>';
    }

    const reportItems = Array.isArray(rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription) 
        ? rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription 
        : [rpData.ReportCollectionEntity.reportItemDescriptions.ReportItemDescription];

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
            const reportLocation = item.reportLocation || '';
            const testSuitePath = reportLocation.split('/');
            const testSuiteName = testSuitePath.pop() || 'N/A';
            const testSuiteGroup = testSuitePath.length > 2 ? testSuitePath[testSuitePath.length - 2] : 'N/A';
            const deviceName = item.runConfigDescription?.runConfigurationData?.entry?.find(e => e.key === 'deviceName')?.value || 'N/A';
            const deviceId = item.runConfigDescription?.runConfigurationData?.entry?.find(e => e.key === 'deviceId')?.value || 'N/A';
            const profileName = item.runConfigDescription?.profileName || 'N/A';
            const groupName = item.runConfigDescription?.groupName || 'N/A';
            const configId = item.runConfigDescription?.runConfigurationId || 'N/A';
            const testCaseAmount = item.testCaseAmount || '0';
            
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