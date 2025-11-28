const { parseRpFile, createRpTable } = require('../utils/xmlParser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Tạo nội dung HTML từ dữ liệu JSON và RP
 */
async function generateHtmlReport(jsonFilePath, rpFilePath) {
    // Đọc nội dung file JSON
    let jsonData = {};
    try {
        const jsonContent = await fs.readFile(jsonFilePath, 'utf8');
        jsonData = JSON.parse(jsonContent);
    } catch (err) {
        console.error('Error reading JSON file:', err);
        jsonData = {};
    }
    
    // Đọc và phân tích file RP
    let rpTableHtml = '';
    try {
        const rpData = await parseRpFile(rpFilePath);
        rpTableHtml = createRpTable(rpData);
    } catch (err) {
        console.error('Error processing RP file:', err);
        rpTableHtml = '<p>Không thể đọc dữ liệu từ file .rp</p>';
    }
    
    return `
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
}

module.exports = {
    generateHtmlReport
};