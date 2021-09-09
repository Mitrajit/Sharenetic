'use strict'
Pusher.logToConsole = false;
let channelName, pusher, base = "https://sharenetic.vercel.app";
fetch(base + "/connect" + (localStorage.id ? `?id=${localStorage.id}` : ""), {
    "method": "GET",
    "headers": {
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