/**
 * Katalon Reports Viewer - ApiController
 * Copyright (c) 2025 leducanh120197
 * Licensed under MIT License - see LICENSE file
 */

const ReportModel = require('../models/ReportModel');

/**
 * Controller xử lý các API calls (trả về JSON response)
 * Chịu trách nhiệm xử lý các request AJAX từ client-side JavaScript
 */
class ApiController {
    /**
     * Tạo HTML report từ file RP hoặc JSON
     * @param {Object} req - Express request object (chứa filePath trong body)
     * @param {Object} res - Express response object (trả về JSON)
     */
    static async createHtmlReport(req, res) {
        const { filePath } = req.body;
        
        // Validate input parameters
        if (!filePath) {
            return res.status(400).json({ 
                success: false, 
                message: 'Đường dẫn file không hợp lệ' 
            });
        }
        
        try {
            // Gọi Model để tạo HTML content từ file
            const htmlContent = await ReportModel.createHtmlReport(filePath);
            // Lưu HTML content vào file
            const message = await ReportModel.saveHtmlReport(filePath, htmlContent);
            
            // Trả về JSON success response
            res.json({ success: true, message });
        } catch (err) {
            console.error('Error creating HTML file:', err);
            // Trả về JSON error response
            res.status(500).json({ 
                success: false, 
                message: err.message || 'Có lỗi xảy ra khi tạo file HTML'
            });
        }
    }

    /**
     * Xóa HTML report đã được tạo
     * @param {Object} req - Express request object (chứa filePath trong body) 
     * @param {Object} res - Express response object (trả về JSON)
     */
    static async deleteHtmlReport(req, res) {
        const { filePath } = req.body;
        
        // Validate input parameters
        if (!filePath) {
            return res.status(400).json({ 
                success: false, 
                message: 'Đường dẫn file không hợp lệ' 
            });
        }
        
        try {
            // Gọi Model để xóa file HTML
            const message = await ReportModel.deleteHtmlReport(filePath);
            // Trả về JSON success response
            res.json({ success: true, message });
        } catch (err) {
            console.error('Error deleting HTML file:', err);
            
            // Xử lý các loại lỗi khác nhau
            if (err.code === 'ENOENT') {
                // File không tồn tại
                res.status(404).json({ 
                    success: false, 
                    message: 'File không tồn tại' 
                });
            } else {
                // Lỗi khác (permission, disk full, etc.)
                res.status(500).json({ 
                    success: false, 
                    message: err.message || 'Có lỗi xảy ra khi xóa file'
                });
            }
        }
    }
}

module.exports = ApiController;