/**
 * Katalon Reports Viewer - MVC Web Application
 * Copyright (c) 2025 leducanh120197
 * Licensed under MIT License - see LICENSE file
 */

const express = require('express');
const path = require('path');
const config = require('./src/config');
const mainRoutes = require('./src/routes/main');
const apiRoutes = require('./src/routes/api');
const AutoLauncher = require('./src/utils/autoLauncher');

const app = express();

// Khởi tạo AutoLauncher
const autoLauncher = new AutoLauncher(config);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Thêm autoLauncher vào app để có thể sử dụng trong routes
app.locals.autoLauncher = autoLauncher;

// Use routes
app.use('/', mainRoutes);
app.use('/', apiRoutes);

// Start server
app.listen(config.port, async () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`Reports directory: ${config.reportsDir}`);
    
    // Khởi tạo auto-start theo cấu hình
    try {
        await autoLauncher.initializeFromConfig();
        const isAutoStartEnabled = await autoLauncher.isEnabled();
        console.log(`Auto-start: ${isAutoStartEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
        console.error('Error initializing auto-start:', error);
    }
});

module.exports = app;