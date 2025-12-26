/**
 * Katalon Reports Viewer - MainController
 * Copyright (c) 2025 leducanh120197
 * Licensed under MIT License - see LICENSE file
 */

const fs = require('fs').promises;
const config = require('../config');
const FileTreeModel = require('../models/FileTreeModel');
const MainView = require('../views/MainView');

/**
 * Controller xử lý các trang chính của ứng dụng
 * Chịu trách nhiệm điều phối giữa Model và View cho các trang UI
 */
class MainController {
    /**
     * Hiển thị trang chủ với danh sách file reports
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async showHomePage(req, res) {
        try {
            // Lấy dữ liệu report table từ Model
            const reportTableData = await FileTreeModel.getReportTableData(config.reportsDir);
            // Gọi View để render HTML từ data
            const html = MainView.renderHomePage(reportTableData);
            // Trả về HTML response
            res.send(html);
        } catch (error) {
            console.error('Error in home page:', error);
            // Hiển thị trang lỗi nếu có exception
            res.status(500).send(MainView.renderErrorPage(error.message));
        }
    }

    /**
     * Hiển thị trang JSON tree với thông tin chi tiết
     * @param {Object} req - Express request object  
     * @param {Object} res - Express response object
     */
    static async showTreeJson(req, res) {
        try {
            // Lấy cấu trúc JSON tree với metadata đầy đủ
            const jsonTree = await FileTreeModel.getJsonTree(config.reportsDir);
            // Render trang HTML hiển thị JSON tree
            const html = MainView.renderJsonTreePage(jsonTree, config.reportsDir);
            res.send(html);
        } catch (error) {
            console.error('Error in tree-show page:', error);
            res.status(500).send(MainView.renderErrorPage(error.message));
        }
    }

    /**
     * Xem file report đã được tạo
     * @param {Object} req - Express request object (chứa query param 'file')
     * @param {Object} res - Express response object
     */
    static async viewFile(req, res) {
        const file = req.query.file;
        // Kiểm tra parameter file có tồn tại không
        if (!file) return res.status(404).send('File not found');

        try {
            // Kiểm tra file có tồn tại trên file system không
            await fs.stat(file);
            // Trả về file content trực tiếp
            res.sendFile(file);
        } catch (err) {
            // File không tồn tại hoặc không thể đọc
            res.status(404).send('File not found');
        }
    }
}

module.exports = MainController;