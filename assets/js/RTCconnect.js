"use strict";
async function signallingOnMessage(mes) {
  console.log(mes);
  if (!localStorage.id)
    localStorage.id = mes.id;
  else if (mes.id != localStorage.id)
    console.error("False request. Messaged reached wrong destination.");
  else {
    console.log(mes);
    if (mes.answer) {
      console.log("ANSWER");
      console.log(mes.answer);
      const remoteDesc = new RTCSessionDescription(JSON.parse(mes.answer));
      await peerConnection.setRemoteDescription(remoteDesc);
      console.log("remote desc set");
    }
    else if (mes.offer) {
      console.log("OFFER");
      console.log(mes.offer);
      Recipient.value = mes.from;
      await makeanswer(JSON.parse(mes.offer), mes.from)
    }
    if (mes.icecandidate) {
      mes.icecandidate.forEach(async function (element) {
        try {
          await peerConnection.addIceCandidate(JSON.parse(element));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      });
    }
  }
}

var connectButton = document.getElementById('Connect');
var Recipient = document.getElementById('Recipient');
connectButton.addEventListener('click', () => {
  toggleconnection();
});
var nowConnect = true;
function toggleconnection() {
  if (nowConnect) {
    createConnection();
    makeCall();
  }
  else
    disconnectPeers();
}

// Creating connection
const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
var peerConnection = null;
let theSignal = { icecandidate: [] };
function createConnection() {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onicecandidate = onicecandidate;
  peerConnection.onicegatheringstatechange = onicegatheringstatechange;
  peerConnection.onconnectionstatechange = onconnectionstatechange;
  peerConnection.ondatachannel = receiveChannelCallback;

  sendChannel = peerConnection.createDataChannel('sendDataChannel');
  sendChannel.onopen = () => { console.log("Send channel opened"); };
  sendChannel.onclose = () => {
    console.log("Send channel closed");
    sendInProgress = false;
    sendprogressbar.value = 0;
  };
  sendChannel.bufferedAmountLowThreshold = 5 * 1024 * 1024; // If buffer <=5MB then start sending again
}
//Offering for connection
async function makeCall() {
  const offer = await peerConnection.createOffer();
  console.log("setting local description");
  console.log(offer);
  await peerConnection.setLocalDescription(offer);
  theSignal['from'] = localStorage.id;
  theSignal['id'] = Recipient.value;
  theSignal['offer'] = JSON.stringify(offer);
}

async function makeanswer(offer, from) {
  createConnection();
  const remoteDesc = new RTCSessionDescription(offer);
  peerConnection.setRemoteDescription(remoteDesc);
  console.log("remote desc set");
  const answer = await peerConnection.createAnswer();
  peerConnection.setLocalDescription(answer);
  theSignal['from'] = localStorage.id;
  theSignal['id'] = from;
  theSignal['answer'] = JSON.stringify(answer);
}

function onicecandidate(event) {
  console.log("YES ATLEAST GOING");
  if (event.candidate)
    theSignal.icecandidate.push(JSON.stringify(event.candidate));

}

function onicegatheringstatechange(event) {
  if (peerConnection.iceGatheringState == "complete") {
    signal(theSignal).then(response => {
      if (response.status == 200)
        console.log("Signal sent");
      else
        throw Error('Signalling failed');
    }).catch(error => {
      console.log(error.message);
    });
    theSignal = { icecandidate: [] };
  }
}

function onconnectionstatechange(event) {
  switch (peerConnection.connectionState) {
    case 'connected':
      changeModal({ title: "Peer Connected", body: `Connected to ${Recipient.value}` });
      nowConnect = false;
      connectButton.classList.replace("btn-primary", "btn-danger");
      connectButton.innerText = "Disconnect";
      Recipient.disabled = true;
      break;
    case "disconnected":
      console.log("disconnected");
    case 'closed':
      console.log("Peer connection Closed");
      disconnectPeers();
      break;
    case "failed":
      console.log("failed");
    default:
      console.log(peerConnection.connectionState);
  }
}

// Disconnecting peers
function disconnectPeers() {
  sendChannel.close();
  receiveChannel && receiveChannel.close() && (receiveChannel = null);
  peerConnection.close();
  nowConnect = true;
  connectButton.classList.replace("btn-danger", "btn-primary");
  connectButton.innerText = "Connect";
  Recipient.disabled = false;
  sendButton.disabled = false;
}

// Creating send and receive data channel
let sendChannel = null;

let receiveChannel;
function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.binaryType = 'arraybuffer';
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelClose;
}
function onReceiveChannelClose() {
  console.log("Receive Channel closed");
  receiveprogressbar.value = 0;
  downloadInProgress = false;
  window.writer && writer.abort();
}
function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}
function onReceiveMessageCallback(event) {
  if (typeof (event.data) == "string") {
    console.log(event.data);
    let data = JSON.parse(event.data);
    if (data.confirmed != undefined) {
      if (data.confirmed) {
        initiateSending();
      }
      else {
        clearInterval(statsUpdateInterval);
        sendButton.disabled = false;
        sendInProgress = false;
        changeModal({ title: "File Rejected", body: "File to be sent was failed" });
      }
      return;
    }
    else {
      if (data.files.length == 1)
        changeModal({ title: `Receive request from ${Recipient.value}`, body: `Do you want to download ${data.files[0].fileName}`, confirm: true });
      else
        changeModal({ title: `Receive request from ${Recipient.value}`, body: `Do you want to download ${data.size / 1024}KB of data?`, confirm: true });

    }

  }
  if (!downloadInProgress) {
    initiateDownload(event.data);
  } else {
    progressDownload(event.data);
  }
}

// Send file
const BYTES_PER_CHUNK = 16 * 1024; // 16KB
const BUFFER_FULL_THRESHOLD = 15 * 1024 * 1024; //15MB
var file, files;
var currentChunk;
var fileInput = document.querySelector('input#file');
var webRTCMessageQueue = [];
let sendInProgress;

async function initiateSending() {
  console.log("Initiate sending");
  for (let i = 0; i < files.length; i++) {
    file = files[i];
    currentChunk = 0;
    await readNextChunk();
  }
}
async function readNextChunk() {
  while (BYTES_PER_CHUNK * currentChunk < file.size) {
    let start = BYTES_PER_CHUNK * currentChunk;
    let end = Math.min(file.size, start + BYTES_PER_CHUNK);
    let arrayBuffer = await readFileAsArrayBuffer(file.slice(start, end));
    webRTCMessageQueue.push(arrayBuffer);
    currentChunk++;
    sendMessageQueued();
  }
}

async function readFileAsArrayBuffer(f) {
  let result_arraybuffer = await new Promise((resolve) => {
      let fileReader = new FileReader();
      fileReader.onload = (e) => resolve(fileReader.result);
      fileReader.readAsArrayBuffer(f);
  });
  return result_arraybuffer;
}

function sendMessageQueued() {
  let message = webRTCMessageQueue.shift();

  while (message) {
    if (sendChannel.bufferedAmount && sendChannel.bufferedAmount > BUFFER_FULL_THRESHOLD) {
      webRTCMessageQueue.unshift(message);

      const listener = () => {
        sendChannel.removeEventListener('bufferedamountlow', listener);
        sendMessageQueued();
      };

      sendChannel.addEventListener('bufferedamountlow', listener);
      return;
    }

    try {
      sendChannel.send(message);
      sendprogressbar.value += BYTES_PER_CHUNK;
      if (sendprogressbar.value >= sendprogressbar.max) {
        sendprogressbar.value = 0;
        clearInterval(statsUpdateInterval);
        sendButton.disabled = false;
        sendInProgress = false;
      }
      message = webRTCMessageQueue.shift();
    } catch (error) {
      throw new Error(`Error send message, reason: ${error.name} - ${error.message}`);
    }
  }
}

const sendButton = document.getElementById('Send');
sendButton.addEventListener('click', function () {
  files = fileInput.files;
  let metadata = { size: 0, files: [] };
  let i;
  for (let i = 0; i < files.length; i++) {
    metadata.size += files[i].size;
    metadata.files.push({ fileName: files[i].name, fileSize: files[i].size });
  }
  console.log(metadata.size);
  sendprogressbar.max = metadata.size;
  currentChunk = 0;
  timestampPrev = new Date().getTime();
  statsUpdateInterval = stats();
  this.disabled = true;
  sendInProgress = true;
  // send some metadata about our file
  // to the receiver
  sendChannel.send(JSON.stringify(metadata));
});

// receive file
var incomingFileInfo;
var incomingFiles;
var bytesReceived;
var downloadInProgress = false;
let receiveprogressbar = document.querySelector("progress#receiveProgress");
let sendprogressbar = document.querySelector("progress#sendProgress");
streamSaver.mitm = "assets/js/mitm.html";
function initiateDownload(data) {
  let incomingfiles = JSON.parse(data);
  receiveprogressbar.max = incomingfiles.size;
  timestampPrev = new Date().getTime();
  statsUpdateInterval = stats();
  downloadInProgress = true;
  incomingFiles = incomingfiles.files;
  startDownload();
}

function startDownload() {
  incomingFileInfo = incomingFiles.shift();
  bytesReceived = 0;
  console.log('incoming file <b>' + incomingFileInfo.fileName + '</b> of ' + incomingFileInfo.fileSize + ' bytes');
  window.fileStream = streamSaver.createWriteStream(`${incomingFileInfo.fileName}`, {
    size: incomingFileInfo.fileSize,
    // writableStrategy: new ByteLengthQueuingStrategy({ highWaterMark: 1024000 }),
    // readableStrategy: new ByteLengthQueuingStrategy({ highWaterMark: 1024000 })
  });
  window.writer = fileStream.getWriter();
}

async function progressDownload(data) {
  try {
    await writer.write(new Uint8Array(data));
    bytesReceived += data.byteLength;
    receiveprogressbar.value += data.byteLength;
    if (bytesReceived === incomingFileInfo.fileSize) {
      endDownload();
    }
  }
  catch (error) {
    console.log("Writer aborted");
  }
}

function endDownload() {
  writer.close();
  if (incomingFiles.length == 0) {
    downloadInProgress = false;
    receiveprogressbar.value = 0;
    clearInterval(statsUpdateInterval);
  }
  else
    startDownload();
}

window.addEventListener('unload', () => {
  writableStream.abort();
  writer.abort();
  disconnectPeers();
});

window.addEventListener('beforeunload', evt => {
  if (downloadInProgress || sendInProgress)
    evt.returnValue = `Are you sure you want to leave?`;
});

// display bitrate statistics.
var timestampPrev, RTCbytesRecPrev = 0, RTCbytesSentPrev;
const upload_spd = document.getElementById('upload-spd');
const download_spd = document.getElementById('download-spd');
const stats = () => setInterval(displayStats, 500);
var statsUpdateInterval;
async function displayStats() {
  if (peerConnection && peerConnection.iceConnectionState === 'connected') {
    const statis = await peerConnection.getStats();
    let activeCandidatePair;
    statis.forEach(report => {

      if (window.webkitRTCPeerConnection) {
        if (report.type === 'transport')
          activeCandidatePair = report
      }
      else
        if (report.type === 'candidate-pair') {
          activeCandidatePair = report;
        }
    });
    if (activeCandidatePair) {
      if (timestampPrev === activeCandidatePair.timestamp) {
        return;
      }
      // calculate current bitrate
      const RTCbytesRecNow = activeCandidatePair.bytesReceived;
      const RTCbytesSentNow = activeCandidatePair.bytesSent;
      download_spd.innerText = `${((RTCbytesRecNow - RTCbytesRecPrev) / (activeCandidatePair.timestamp - timestampPrev) / 1024).toFixed(2)} MB/s`;
      upload_spd.innerText = `${((RTCbytesSentNow - RTCbytesSentPrev) / (activeCandidatePair.timestamp - timestampPrev) / 1024).toFixed(2)} MB/s`;
      timestampPrev = activeCandidatePair.timestamp;
      RTCbytesRecPrev = RTCbytesRecNow;
      RTCbytesSentPrev = RTCbytesSentNow;
    }
  }
}