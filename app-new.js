const express = require('express');
const path = require('path');
const config = require('./src/config');
const mainRoutes = require('./src/routes/main');
const apiRoutes = require('./src/routes/api');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/', mainRoutes);
app.use('/', apiRoutes);

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
    console.log(`Reports directory: ${config.reportsDir}`);
});

module.exports = app;