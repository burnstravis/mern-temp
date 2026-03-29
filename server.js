const express = require('express');
const cors = require('cors');

require('dotenv').config();
const MONGO_DB_URI = process.env.MONGODB_URI;
const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(MONGO_DB_URI);
client.connect();

const app = express();
app.use(cors());
app.use(express.json());

var api = require('./api.js');
api.setApp( app, client );

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

app.listen(3000);