'use strict'
Pusher.logToConsole = true;
let channelName, pusher, base = "https://sharenetic.vercel.app";
// let channelName, pusher, base = "https://sharenetic.herokuapp.com";
// let channelName, pusher, base = "http://127.0.0.1:3000";
fetch(base + "/connect" + (localStorage.id ? `?id=${localStorage.id}` : ""), {
    "method": "GET",
    "headers": {
        //   "cache-control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded"
    }
})
    .then(function (response) {
        console.log(response.status);
        return response.json();
    }).then(function (data) {
        if (!localStorage.id || localStorage.id != data.id){
            localStorage.id = data.id;
            updateTooltip();}
        channelName = data.channel;
        pusher = new Pusher('892a123070fc89c43124', {
            cluster: 'ap2'
        });
        subscribe();
    })
    .catch(function (error) {
        console.log(error.message);
    });

function subscribe() {
    window.channel = pusher.subscribe(channelName);
    window.channel.bind('pusher:subscription_succeeded', () => { console.log("subscribed") });
    window.channel.bind('pusher:subscription_error', () => { setTimeout(subscribe, 1000); });
    window.channel.bind('message', (mes) => signallingOnMessage(mes));
}
async function signal(mes) {
    return await fetch(base + "/connect", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify({ "id": mes.id, "message": mes })
    });
}
// Remove in production start
function signallingDisconnect() {
    fetch(base + "/disconnect?id=" + localStorage.id, {
        method: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
        .then(function (response) {
            console.log(response.status);
        })
        .catch(function (error) {
            console.log(error.message);
        });
}
window.addEventListener('beforeunload', signallingDisconnect);
// Remove in production end