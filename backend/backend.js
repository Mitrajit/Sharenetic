"use strict";
require("dotenv").config();
const express = require('express');
const app = express();
const errorHandler = require("errorhandler");
const cors = require("cors");
const PORT = process.env.PORT;
const Pusher = require('pusher');
var pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTlS: true
});

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

let whitelist = process.env.ORIGIN.split(' ');
let corsOptions = {
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(new URL(origin).hostname) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200 // For legacy browser support
}
app.use(cors(corsOptions));

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

app.post("/connect", function (req, res) {
    var socketId = req.body.socketId;
    var channel = req.body.channel;
    var message = req.body.message;

    pusher.trigger(channel, "message", {message: message}).catch((e)=>console.log(e));

    res.send(200);
});

const { Server } = require('ws');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 6);
// const Server = require('ws').Server
let CLIENT = {};
const wss = new Server({
    maxPayload: 16 * 1024, // 16KB max payload
    server
});
wss.on('connection', (ws, req) => {
    // let abc=0;
    // CLIENT[abc]=ws;
    if (req.url.indexOf("id=") != -1 && CLIENT[ws.id = req.url.slice(req.url.indexOf("id=") + 3)] == undefined) {
        CLIENT[ws.id] = ws;
    }
    else {
        ws.id = nanoid();
        CLIENT[ws.id] = ws;
        ws.send(JSON.stringify({ id: ws.id }));
    }
    console.log(ws.id + " Connected");
    ws.on('message', (mes) => {
        let id = JSON.parse(mes).id;
        CLIENT[id] && CLIENT[JSON.parse(mes).id].send(mes);
    });
    ws.on('close', () => {
        delete CLIENT[ws.id];
        console.log('Client disconnected');
    });
    ws.on("error", (error) => { console.log("websocket: " + error.code); });
});
wss.on("error", (error) => { console.log("Websocket server: " + error.code) });

