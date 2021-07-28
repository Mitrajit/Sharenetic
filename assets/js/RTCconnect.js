// console.log("Hello world");
// const peerConnection = new RTCPeerConnection();

// sendChannel = localConnection.createDataChannel('sendDataChannel');
let HOST = "http://127.0.0.1:3000".replace(/^http/, 'ws');
if (localStorage.id)
  HOST += `?id=${localStorage.id}`
let ws,el;
function connect(){
  ws = new WebSocket(HOST);
  ws.onerror=()=>{setTimeout(connect, 1000);}
  ws.onmessage = function (mes) {
    mes = JSON.parse(mes.data);
    if (!localStorage.id)
      localStorage.id = mes.id;
    else if (mes.id != localStorage.id)
      console.log("false request");
    else{
      console.log(mes);
    }
  }
}

let connectButton = document.getElementById('Connect');
let Recipient = document.getElementById('Recipient');
connectButton.addEventListener('click', () => {
  console.log("sending");
  ws.send(JSON.stringify({from:localStorage.id,id:Recipient.value,mes:"HELLO WE R TALKING"}));
});