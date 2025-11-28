const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { generateHtmlReport } = require('../templates/reportTemplate');

const router = express.Router();

// API để tạo file HTML từ file JSON và RP
router.post('/create-html', express.json(), async (req, res) => {
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
        
        // Tạo nội dung HTML từ dữ liệu JSON và RP
        const htmlContent = await generateHtmlReport(jsonFilePath, rpFilePath);
        
        // Ghi nội dung HTML vào file
        await fs.writeFile(htmlFilePath, htmlContent, 'utf8');
        
        res.json({ success: true, message: 'Đã tạo file HTML thành công' });
    } catch (err) {
        console.error('Error creating HTML file:', err);
        res.status(500).json({ success: false, message: `Lỗi: ${err.message}` });
    }
});

module.exports = router;