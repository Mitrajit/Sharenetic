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
        console.log("remote desc setting");
      }
      else if (mes.offer) {
        const remoteDesc = new RTCSessionDescription(JSON.parse(mes.offer));
        peerConnection.setRemoteDescription(remoteDesc);
        console.log("remote desc setting");
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
  ws.send(JSON.stringify({ from: localStorage.id, id: Recipient.value, 'offer': JSON.stringify(offer)}));
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

let sendChannel = peerConnection.createDataChannel('sendDataChannel');
sendChannel.onopen = () => { console.log("Send channel opened"); };
sendChannel.onclose = () => { console.log("Send channel closed"); };

peerConnection.ondatachannel = receiveChannelCallback;
let receiveChannel;
function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}
function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}
function onReceiveMessageCallback(event) {
  console.log('Received Message: '+event.data);
}