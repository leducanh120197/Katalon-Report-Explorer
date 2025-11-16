const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const xml2js = require('xml2js'); // Cần cài đặt thêm thư viện này: npm install xml2js
const app = express();
const port = 3000;

const reportsDir = path.join(__dirname, '..', '..', 'Reports');

// Kiểm tra xem một node có chứa file cần hiển thị không (đệ quy)
const hasDisplayableFile = node => {
    if (!node?.children?.length) return false;
    return node.children.some(child => 
        child?.isFile || hasDisplayableFile(child)
    );
};

// Tạo cây thư mục
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
        } else {
            const lowerCaseFile = file.toLowerCase();
            if (lowerCaseFile.endsWith('.html') || 
                lowerCaseFile.endsWith('.json') || 
                lowerCaseFile.endsWith('.rp')) {
                item.children.push({ 
                    name: file, 
                    path: fullPath, 
                    isFile: true,
                    fileType: path.extname(file).substring(1) // Lấy phần mở rộng không có dấu chấm
                });
            }
        }
    }
    
    item.children = item.children.filter(Boolean).reverse();
    return item;
};

// Kiểm tra xem đường dẫn có nằm trong thư mục _Collection không
const isInCollectionFolder = filePath => {
    return filePath.includes('\\_Collection\\');
};

// Render cây thư mục
const renderTree = tree => !tree?.children?.length ? '' : `
    <ul>
        ${tree.children.map(node => {
            if (!node) return '';
            
            if (node.isFile) {
                const isInCollection = isInCollectionFolder(node.path);
                const isJsonOrRp = node.fileType === 'json' || node.fileType === 'rp';
                const createHtmlButton = isInCollection && isJsonOrRp ? 
                    `<button class="create-html-btn" data-path="${encodeURIComponent(node.path)}">Tạo HTML</button>` : '';
                
                return `<li>
                    <a href="/view?file=${encodeURIComponent(node.path)}" target="_blank">${node.name}</a>
                    ${createHtmlButton}
                </li>`;
            } else {
                return `<li>
                    <span class="toggle-folder">${node.name}</span>
                    <div class="folder-content" style="display:${hasDisplayableFile(node) ? 'block' : 'none'}">
                        ${renderTree(node)}
                    </div>
                </li>`;
            }
        }).join('')}
    </ul>
`;

// Phân tích file XML (.rp)
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

// Tạo bảng từ dữ liệu file .rp
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

// Trang chủ
app.get('/', async (req, res) => {
    const tree = await buildTree(reportsDir);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Katalon Reports Viewer</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                ul { list-style-type: none; padding-left: 20px; }
                .toggle-folder { cursor: pointer; color: blue; }
                .toggle-folder::before { content: "▶ "; }
                .open .toggle-folder::before { content: "▼ "; }
                .create-html-btn { 
                    margin-left: 10px; 
                    background-color: #4CAF50; 
                    color: white; 
                    border: none; 
                    padding: 2px 8px; 
                    border-radius: 3px; 
                    cursor: pointer; 
                }
                .create-html-btn:hover {
                    background-color: #45a049;
                }
            </style>
        </head>
        <body>
            <h1>Katalon Reports Viewer</h1>
            <form action="/tree" method="get"><button>Tree</button></form>
            ${renderTree(tree)}
            <script>
                document.querySelectorAll('.toggle-folder').forEach(f => {
                    f.onclick = () => {
                        const li = f.parentElement;
                        const content = li.querySelector('.folder-content');
                        content.style.display = content.style.display === 'none' ? 'block' : 'none';
                        li.classList.toggle('open');
                    };
                    // Thêm class 'open' cho các thư mục được mở sẵn
                    if (f.nextElementSibling.style.display === 'block') {
                        f.parentElement.classList.add('open');
                    }
                });
                
                // Xử lý sự kiện cho nút "Tạo HTML"
                document.querySelectorAll('.create-html-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.preventDefault();
                        const filePath = decodeURIComponent(btn.getAttribute('data-path'));
                        try {
                            const response = await fetch('/create-html', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ filePath })
                            });
                            
                            const result = await response.json();
                            alert(result.message);
                            
                            // Nếu tạo thành công, làm mới trang để hiển thị file HTML mới
                            if (result.success) {
                                location.reload();
                            }
                        } catch (error) {
                            alert('Có lỗi xảy ra: ' + error.message);
                        }
                    };
                });
            </script>
        </body>
        </html>
    `);
});

// Xem file
app.get('/view', async (req, res) => {
    const file = req.query.file;
    if (!file) return res.status(404).send('File not found');

    try {
        await fs.stat(file);
        res.sendFile(file);
    } catch (err) {
        res.status(404).send('File not found');
    }
});

// API để tạo file HTML từ file JSON và RP
app.post('/create-html', express.json(), async (req, res) => {
    const { filePath } = req.body;
    
    if (!filePath) {
        return res.status(400).json({ success: false, message: 'Đường dẫn file không hợp lệ' });
    }
    
    try {
        // Xác định đường dẫn file HTML dựa trên file JSON
        const dirPath = path.dirname(filePath);
        const htmlFilePath = path.join(dirPath, 'collection.html');
        
        // Kiểm tra xem file HTML đã tồn tại chưa
        try {
            await fs.access(htmlFilePath);
            // Nếu không có lỗi, file đã tồn tại
            return res.json({ success: false, message: 'File HTML đã tồn tại' });
        } catch (err) {
            // File chưa tồn tại, tiếp tục xử lý
        }
        
        // Xác định đường dẫn file JSON và RP
        let jsonFilePath = '';
        let rpFilePath = '';
        
        if (filePath.toLowerCase().endsWith('.json')) {
            jsonFilePath = filePath;
            rpFilePath = path.join(dirPath, path.basename(dirPath) + '.rp');
        } else if (filePath.toLowerCase().endsWith('.rp')) {
            rpFilePath = filePath;
            jsonFilePath = path.join(dirPath, 'collection.json');
        }
        
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
        let rpData = null;
        let rpTableHtml = '';
        try {
            rpData = await parseRpFile(rpFilePath);
            rpTableHtml = createRpTable(rpData);
        } catch (err) {
            console.error('Error processing RP file:', err);
            rpTableHtml = '<p>Không thể đọc dữ liệu từ file .rp</p>';
        }
        
        // Tạo nội dung HTML từ dữ liệu JSON và RP
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
        
        // Ghi nội dung HTML vào file
        await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
        
        res.json({ success: true, message: 'Đã tạo file HTML thành công' });
    } catch (err) {
        console.error('Error creating HTML file:', err);
        res.status(500).json({ success: false, message: `Lỗi: ${err.message}` });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));