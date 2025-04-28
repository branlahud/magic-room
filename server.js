console.log('Starting server.js');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
if (!fs.existsSync(publicPath)) {
    console.log('Public directory does not exist:', publicPath);
} else {
    fs.readdir(publicPath, (err, files) => {
        if (err) {
            console.log('Error reading public directory:', err);
        } else {
            console.log('Files in public/:', files);
        }
    });
}
app.use('/public', express.static(publicPath, {
    extensions: ['html'],
    index: false
}));

app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.send('Server is running!');
});

app.get('/public/:file', (req, res, next) => {
    console.log('Request for file:', req.params.file);
    const filePath = path.join(publicPath, req.params.file);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log('File not found:', filePath);
        } else {
            console.log('File exists:', filePath);
        }
    });
    next();
});

const codes = {
    '5920': 'video1',
    '1346799352': 'video2',
    '288': 'video3',
    '15100': 'video4'
};

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected. Total clients:', wss.clients.size);
    ws.on('message', (message) => {
        try {
            console.log('Raw message received:', message.toString());
            const data = JSON.parse(message);
            console.log('Parsed message:', data);
            const video = codes[data.code];
            if (video) {
                console.log('Valid code received:', data.code, 'Triggering video:', video);
                const response = JSON.stringify({ event: 'playVideo', video: video });
                console.log('Broadcasting to clients:', response);
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                        console.log('Sent to client:', client._socket.remoteAddress);
                    }
                });
            } else {
                console.log('Invalid code received:', data.code);
                ws.send(JSON.stringify({ event: 'wrongCode' }));
            }
        } catch (err) {
            console.error('Error processing WebSocket message:', err);
        }
    });
    ws.on('close', () => {
        console.log('WebSocket client disconnected. Total clients:', wss.clients.size);
    });
    ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
    });
});

wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
});

server.listen(process.env.PORT || 8080, () => {
    console.log('Server running on port ' + (process.env.PORT || 8080));
});
