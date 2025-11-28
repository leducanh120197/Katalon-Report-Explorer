const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { buildTree } = require('../utils/fileSystem');
const { renderTree } = require('../utils/htmlRenderer');

const router = express.Router();

// Trang chủ
router.get('/', async (req, res) => {
    try {
        const config = require('../config');
        const tree = await buildTree(config.reportsDir);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Katalon Reports Viewer</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <h1>Katalon Reports Viewer</h1>
                <form action="/tree" method="get"><button>Tree</button></form>
                ${renderTree(tree)}
                <script src="/scripts.js"></script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error in home route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Xem file
router.get('/view', async (req, res) => {
    const file = req.query.file;
    if (!file) return res.status(404).send('File not found');

    try {
        await fs.stat(file);
        res.sendFile(file);
    } catch (err) {
        res.status(404).send('File not found');
    }
});

module.exports = router;