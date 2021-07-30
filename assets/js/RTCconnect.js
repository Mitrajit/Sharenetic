// console.log("Hello world");
// const peerConnection = new RTCPeerConnection();

// sendChannel = localConnection.createDataChannel('sendDataChannel');
let HOST = "http://127.0.0.1:3000".replace(/^http/, 'ws');
if (localStorage.id)
  HOST += `?id=${localStorage.id}`
let ws, el;
connect();
function connect() {
  ws = new WebSocket(HOST);
  ws.onerror = () => { setTimeout(connect, 1000); }
  ws.onmessage = async function (mes) {
    mes = JSON.parse(mes.data);
    if (!localStorage.id)
      localStorage.id = mes.id;
    else if (mes.id != localStorage.id)
      console.log("false request");
    else {
      console.log(mes);
      if (mes.answer) {
        const remoteDesc = new RTCSessionDescription(JSON.parse(mes.answer));
        await peerConnection.setRemoteDescription(remoteDesc);
        console.log("remote desc set");
      }
      else if (mes.offer) {
        const remoteDesc = new RTCSessionDescription(JSON.parse(mes.offer));
        peerConnection.setRemoteDescription(remoteDesc);
        console.log("remote desc set");
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        Recipient.value = mes.from;
        ws.send(JSON.stringify({ from: localStorage.id, id: mes.from, 'answer': JSON.stringify(answer) }));
      }
      else if (mes.icecandidate) {
        try {
          await peerConnection.addIceCandidate(JSON.parse(mes.icecandidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    }
  }
}

let connectButton = document.getElementById('Connect');
let Recipient = document.getElementById('Recipient');
connectButton.addEventListener('click', () => {
  console.log("sending");
  makeCall();
});

const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
const peerConnection = new RTCPeerConnection(configuration);
async function makeCall() {
  const offer = await peerConnection.createOffer();
  console.log("setting local rescription");
  console.log(offer);
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ from: localStorage.id, id: Recipient.value, 'offer': JSON.stringify(offer) }));
}

peerConnection.onicecandidate = (event) => {
  console.log("YES ATLEAST GOING");
  if (event.candidate) {
    ws.send(JSON.stringify({ from: localStorage.id, id: Recipient.value, 'icecandidate': JSON.stringify(event.candidate) }));
  }
}

peerConnection.addEventListener('connectionstatechange', event => {
  if (peerConnection.connectionState === 'connected') {
    console.log("PEER REALLY CONNECTED");
  }
});

// Creating send and receive data channel
let sendChannel = peerConnection.createDataChannel('sendDataChannel');
sendChannel.onopen = () => { console.log("Send channel opened"); };
sendChannel.onclose = () => { console.log("Send channel closed"); };

peerConnection.ondatachannel = receiveChannelCallback;
let receiveChannel;
function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.binaryType = 'arraybuffer';
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}
function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}
function onReceiveMessageCallback(event) {
  if (typeof (event.data) == "string")
    console.log(event.data);
  if (downloadInProgress === false) {
    startDownload(event.data);
  } else {
    progressDownload(event.data);
  }
}

// Send file
const BYTES_PER_CHUNK = 1200;
var file;
var currentChunk;
var fileInput = document.querySelector('input#file');
var fileReader = new FileReader();

function readNextChunk() {
  var start = BYTES_PER_CHUNK * currentChunk;
  var end = Math.min(file.size, start + BYTES_PER_CHUNK);
  fileReader.readAsArrayBuffer(file.slice(start, end));
}

fileReader.onload = function () {
  sendChannel.send(fileReader.result);
  currentChunk++;
  sendprogressbar.max = file.size;
  sendProgress.value += BYTES_PER_CHUNK;
  if (BYTES_PER_CHUNK * currentChunk < file.size) {
    readNextChunk();
  }
  else
    sendProgress.value = 0;
};

fileInput.addEventListener('change', function () {
  file = fileInput.files[0];
  currentChunk = 0;
  // send some metadata about our file
  // to the receiver
  sendChannel.send(JSON.stringify({
    fileName: file.name,
    fileSize: file.size
  }));
  readNextChunk();
});

// receive file
var incomingFileInfo;
var incomingFileData;
var bytesReceived;
var downloadInProgress = false;
let receiveprogressbar = document.querySelector("progress#receiveProgress");
let sendprogressbar = document.querySelector("progress#sendProgress");
function startDownload(data) {
  incomingFileInfo = JSON.parse(data.toString());
  incomingFileData = [];
  bytesReceived = 0;
  downloadInProgress = true;
  console.log('incoming file <b>' + incomingFileInfo.fileName + '</b> of ' + incomingFileInfo.fileSize + ' bytes');
  receiveprogressbar.max = incomingFileInfo.fileSize;
}

function progressDownload(data) {
  bytesReceived += data.byteLength;
  incomingFileData.push(data);
  receiveprogressbar.value = bytesReceived;
  if (bytesReceived === incomingFileInfo.fileSize) {
    endDownload();
  }
}

function endDownload() {
  downloadInProgress = false;
  var blob = new window.Blob(incomingFileData);
  var anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  console.log(anchor.href);
  anchor.download = incomingFileInfo.fileName;
  anchor.textContent = 'Click to download';
  receiveprogressbar.value = 0;
  if (anchor.click) {
    anchor.click();
  } else {
    let evt = document.createEvent('MouseEvents');
    evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    anchor.dispatchEvent(evt);
  }
}