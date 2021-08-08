require("dotenv").config();
const cors = require("cors");
const PORT = process.env.PORT;

const app = require('express')();
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

const { Server } = require('ws');
const { customAlphabet } = require('nanoid');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 6);
// const Server = require('ws').Server
let CLIENT = {};
const wss = new Server({ server });
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
});

// setInterval(() => {
//     wss.clients.forEach((client) => {
//         client.send(new Date().toTimeString());
//     });
// }, 1006);
