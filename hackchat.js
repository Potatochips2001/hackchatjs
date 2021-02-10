var sendMsg;
var myMsg;
var msgData;
var sendJoin;
var ignored = [];
var afkList = [];
let botUptime = 0.0;
var randomColors = false;

sendJoin = {
    "cmd": "join",
    "channel": "CHANNEL",
    "nick": "BOTS_NAME#PASSWORD"
}

const { Console } = require('console');
const { stringify } = require('querystring');
const WebSocket = require('ws');
const ws = new WebSocket('wss://hack.chat/chat-ws');

function send(data) {
    if (ws && ws.readyState == ws.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

ws.on('open', function open() {
    ws.send(JSON.stringify(sendJoin));
});
let firstPacket = true;
setInterval(function () {
    botUptime++;
}, 1000);
ws.on('message', function incoming(event) {
    msgData = JSON.parse(event);
    msgR = String(msgData.text);
    msgNick = String(msgData.nick);
    msgTrip = String(msgData.trip);
    msgFrom = String(msgData.from);
    msgCmd = String(msgData.cmd);
    if (firstPacket == true) {
        usersOnline = String(msgData.nicks);
        firstPacket = false;
    }
    //Help
    if (msgR == "./help" && !ignored.includes(msgNick)) {
        send({"cmd": "chat", "text": "Commands: ./color, ./coloron, ./coloroff, ./random, ./afk, ./uptime\nAdmin: ./ignore, ./accept, ./showafk"})
    }
    //Colors
    if (msgR.startsWith("./color") && !ignored.includes(msgNick)) {
        try {
            send({ "cmd": "chat", "text": "/color " + msgR.replace("./color ", "") });
        }
        catch {
            null
        }
    }
    //Set random colors on
    if (msgR == "./coloron" && !ignored.includes(msgNick)) {
        randomColors = true;
    }
    //Set random colors off
    if (msgR == "./coloroff" && !ignored.includes(msgNick)) {
        randomColors = false;
    }
    //Check if random colors should be used
    if (randomColors == true && msgR.startsWith("./")) {
        myMsg = "/color " + '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
        send({ "cmd": "chat", "text": myMsg });
    }
    //Remove user from AFK once they type
    if (afkList.includes(msgNick)) {
        afkList.splice(afkList.indexOf(msgNick, 1));
        send({ "cmd": "chat", "text": msgNick + " is no longer AFK" });
    }
    //Go AFK
    if (msgR.startsWith("./afk")) {
        afkList.push(msgNick);
        send({ "cmd": "chat", "text": msgNick + " is AFK" });
    }
    //Check if user is AFK when messaged
    for (var i = 0; i < afkList.length; i++){
        if (msgR.includes("@" + afkList[i])) {
            send({ "cmd": "chat", "text": afkList[i] + " is AFK" });
        }
    }
    //Check if kicked
    if (msgR.includes(msgFrom + " whispered: ")) {
        send({ "cmd": "whisper", "nick": msgFrom, "text": "Sent" });
    }
    //Show AFK users
    if (msgR == "./showafk" && msgTrip == "21YRcd") {
        send({ "cmd": "chat", "text": afkList.toString() });
    }
    //Ignore users
    if (msgR.startsWith("./ignore") && msgTrip == "21YRcd") {
        ignored.push(msgR.replace("./ignore ", ""));
    }
    //Accept users
    if (msgR.startsWith("./accept") && msgTrip == "21YRcd") {
        ignored.splice(ignored.indexOf(msgR.replace("./accept ", ""), 1));
    }
    //Show online users
    if (msgR.startsWith("./list") && !ignored.includes(msgNick)) {
        send({ "cmd": "chat", "text": usersOnline });
    }
    //Add user to online list after they join channel
    if (msgCmd == "onlineAdd") {
        usersOnline += "," + msgData.nick;
    }
    //Remove user from online when they exit channel
    if (msgCmd == "onlineRemove") {
        usersOnline = usersOnline.replace(msgNick, "");
    }
    //Random number
    if (msgR.startsWith("./random") && !ignored.includes(msgNick)) {
        if (msgR == "./random") {
            send({ "cmd": "chat", "text": String(Math.random()) });
        }
        else {
            send({ "cmd": "chat", "text": Math.floor(Math.random() * msgR.replace("./random ", "") + 1).toString() });
        }
    }
    //Check uptime
    if (msgR.startsWith("./uptime") & !ignored.includes(msgNick)) {
        var hours = Math.floor(botUptime / 3600);
        var minutes = Math.floor((botUptime - (hours * 3600)) / 60);
        var seconds = botUptime - (hours * 3600) - (minutes * 60);
        botTime = String(hours + "h " + minutes + "m " + seconds + "s");
        send({ "cmd": "chat", "text": botTime });
    }
});
