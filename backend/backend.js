require('dotenv').config();
const express = require('express');

const app = express();
const errorHandler = require('errorhandler');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const nid = require('nanoid');

const { nanoid } = nid;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoidcustom = nid.customAlphabet(alphabet, 6);

const { PORT } = process.env;
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  useTlS: true,
});

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const whitelist = process.env.ORIGIN.split(' ');
const corsOptions = {
  origin(origin, callback) {
    if (!origin || whitelist.indexOf(new URL(origin).hostname) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200, // For legacy browser support
};
app.use(cors(corsOptions));
app.use(helmet());

app.use(express.urlencoded({
  extended: true,
}));
app.use(express.json());

app.use(errorHandler({
  dumpExceptions: true,
  showStack: true,
}));

const CLIENT = {};
app.get('/connect', (req, res) => {
  let { id } = req.query;
  if (!id || CLIENT[id] !== undefined) { id = nanoidcustom(); }
  CLIENT[id] = id + nanoid();
  console.log(`${id} ${CLIENT[id]}`);
  res.send({ id, channel: CLIENT[id] });
});
app.post('/connect', (req, res) => {
  const { id } = req.body;
  const { message } = req.body;
  if (CLIENT[id]) pusher.trigger(CLIENT[id], 'message', message).catch((e) => console.log(e));
  res.sendStatus(200);
});
// Remove in production start
app.get('/disconnect', (req, res) => {
  const { id } = req.query;
  if (id && CLIENT[id] !== undefined) {
    console.log(`Disconnected: ${id}`);
    delete CLIENT[id];
    res.status(200).send(`Deleted ${id}`);
  } else { res.sendStatus(201); }
});
// Remove in production end
app.post('/disconnect', (req, res) => { // tested
  if (req.get('x-pusher-key') === process.env.PUSHER_VERIFICATION_KEY && crypto.createHmac('sha256', process.env.PUSHER_VERIFICATION_SECRET).update(JSON.stringify(req.body)).digest('hex') === req.get('X-Pusher-Signature')) {
    req.body.events.forEach((event) => {
      if (event.name === 'channel_vacated') {
        const id = event.channel.slice(0, 6);
        delete CLIENT[id];
        console.log(`Disconnected: ${id}`);
      }
    });
  }
  res.sendStatus(200); // Even send 200 for malacious request
});
const { Server } = require('ws');
// const Server = require('ws').Server
const wss = new Server({
  maxPayload: 16 * 1024, // 16KB max payload
  server,
});
wss.on('connection', (ws, req) => {
  // let abc=0;
  // CLIENT[abc]=ws;
  let wsid = req.url.slice(req.url.indexOf('id=') + 3);
  if (req.url.indexOf('id=') !== -1 && CLIENT[wsid] === undefined) {
    CLIENT[wsid] = ws;
  } else {
    wsid = nanoidcustom();
    CLIENT[wsid] = ws;
    ws.send(JSON.stringify({ id: wsid }));
  }
  console.log(`${wsid} Connected`);
  ws.on('message', (mes) => {
    const { id } = JSON.parse(mes);
    if (CLIENT[id]) CLIENT[JSON.parse(mes).id].send(mes);
  });
  ws.on('close', () => {
    delete CLIENT[wsid];
    console.log('Client disconnected');
  });
  ws.on('error', (error) => { console.log(`websocket: ${error.code}`); });
});
wss.on('error', (error) => { console.log(`Websocket server: ${error.code}`); });
