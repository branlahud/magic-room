console.log('Starting server.js');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from 'public' folder
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
fs.readdir(publicPath, (err, files) => {
    if (err) {
        console.log('Error reading public directory:', err);
    } else {
        console.log('Files in public/:', files);
    }
});
app.use(express.static(publicPath));

// Debug route
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.send('Server is running!');
});

// Debug file requests
app.get('/public/:file', (req, res, next) => {
    console.log('Request for file:', req.params.file);
    next();
});

const codes = {
    '5920': 'video1',
    '1346799352': 'video2',
    '288': 'video3',
    '15100': 'video4'
};

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log('Received message:', message);
        const data = JSON.parse(message);
        const video = codes[data.code];
        if (video) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ event: 'playVideo', video: video }));
                }
            });
        } else {
            ws.send(JSON.stringify({ event: 'wrongCode' }));
        }
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log('Server running on port ' + (process.env.PORT || 8080));
});