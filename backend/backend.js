"use strict";
require("dotenv").config();
const express = require('express');
const app = express();
const errorHandler = require("errorhandler");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");
const PORT = process.env.PORT;
const Pusher = require('pusher');
var pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTlS: true
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

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
app.use(helmet());

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

app.get("/connect", function (req, res) {
    let id = req.query.id;
    if (!id)
        id = nanoidcustom();
    // CLIENT[id] = id + nanoid();
    console.log("Connected"+id);
    res.send({ id, channel: id });
});
app.post("/connect", function (req, res) {
    let id = req.body.id;
    let message = req.body.message;
    pusher.trigger(id, "message", message).catch(e => console.log(e));
    res.sendStatus(200);
});

app.post("/disconnect", function (req, res) {// tested
    if (req.get('x-pusher-key') == process.env.PUSHER_VERIFICATION_KEY && crypto.createHmac("sha256", process.env.PUSHER_VERIFICATION_SECRET).update(JSON.stringify(req.body)).digest("hex") == req.get('X-Pusher-Signature')) {
        req.body.events.forEach(event => {
            if (event.name == 'channel_vacated') {
                let id = event.channel.slice(0, 6);
                delete CLIENT[id];
                console.log("Disconnected: " + id);
            }
        });
    }
    res.sendStatus(200); // Even send 200 for malacious request
});
const nid = require("nanoid");
const nanoid = nid.nanoid;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoidcustom = nid.customAlphabet(alphabet, 6);
// const Server = require('ws').Server
let CLIENT = {};

