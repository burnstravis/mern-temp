const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const tokenHandler = require('./createJWT.js');

require('dotenv').config();
const MONGO_DB_URI = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(MONGO_DB_URI);
client.connect();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
    }
});

var api = require('./api.js');
api.setApp(app, client, io);

app.use((req, res, next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

io.use((socket, next) => {
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!rawToken) {
        return next(new Error('Authentication required'));
    }

    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

    if (tokenHandler.isExpired(token)) {
        return next(new Error('Token expired'));
    }

    const decoded = require('jsonwebtoken').decode(token);

    if (!decoded?.id) {
        return next(new Error('Invalid token payload'));
    }

    socket.data.userId = decoded.id.toString();
    next();
});

io.on('connection', (socket) => {
    const userId = socket.data.userId;

    if (userId) {
        socket.join(`user:${userId}`);
    }

    socket.on('join:conversation', (conversationId) => {
        if (!conversationId) return;
        socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId) => {
        if (!conversationId) return;
        socket.leave(`conversation:${conversationId}`);
    });
});

server.listen(3000);