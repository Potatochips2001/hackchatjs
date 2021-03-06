var sendMsg;
var myMsg;
var msgData;
var sendJoin;
var ignored = [];
var afkList = [];
let botUptime = 0.0;
var randomColors = false;
var getDataRec = "";

sendJoin = {
    "cmd": "join",
    "channel": "CHANNELNAME",
    "nick": "USERNAME#PASSWORD"
}

const { Console } = require('console');
const { stringify } = require('querystring');
const WebSocket = require('ws');
const ws = new WebSocket('wss://hack.chat/chat-ws');
const httpGet = require('https');

function sendGet(uri) {
    httpGet.get(uri, (myResponse) => {
        myResponse.on('data', (recData) => {
            getDataRec += recData;
        });
    }).on('error', (e) => {
        console.log(e);
        getDataRec = null;
    });
}

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

let packetRecTime = null;
let lastMessage = "";
let commandCounter = 0;

ws.on('message', function incoming(event) {
    msgData = JSON.parse(event); //Just the data that was recieved
    msgR = String(msgData.text); //Message
    msgNick = String(msgData.nick); //Who sent the message (use for chat)
    msgTrip = String(msgData.trip); //Trip of user
    msgFrom = String(msgData.from); //Who sent the message (use for whisper)
    msgCmd = String(msgData.cmd); //Command
    if (firstPacket == true) {
        usersOnline = String(msgData.nicks);
        firstPacket = false;
    }
    //Check the most recent message
    if (msgCmd == "chat" && !msgR.startsWith("./lastactive") && msgTrip != "/igodX") {
        packetRecTime = Date.now();
        lastMessage = msgNick + ": " + msgR;
    }
    //Help
    if (msgR == "./help" && !ignored.includes(msgNick)) {
        send({ "cmd": "chat", "text": "$\\red{https://github.com/Potatochips2001/hackchatjs}$\nCommands: ./color, ./coloron, ./coloroff, ./random, ./afk, ./uptime, ./printcolor, ./channel, ./lastactive\nAdmin: ./ignore, ./accept, ./showafk, ./showignored" })
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Colors
    if (msgR.startsWith("./color") && !ignored.includes(msgNick)) {
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
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
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Set random colors off
    if (msgR == "./coloroff" && !ignored.includes(msgNick)) {
        randomColors = false;
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
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
    if (msgR.startsWith("./afk") && !msgR.includes("./afklist")) {
        afkList.push(msgNick);
        send({ "cmd": "chat", "text": msgNick + " is AFK" });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Check if user is AFK when messaged
    for (var i = 0; i < afkList.length; i++){
        if (msgR.includes("@" + afkList[i])) {
            send({ "cmd": "chat", "text": afkList[i] + " is AFK" });
        }
    }
    //Generate a random room
    if (msgR.startsWith("./channel") && !ignored.includes(msgNick)) {
        send({ "cmd": "chat", "text": "?" + Math.random().toString(36).substr(2, 8) });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    if (msgR.includes(msgFrom + " whispered: ./channel")) {
        send({ "cmd": "whisper", "nick": msgFrom, "text": "?" + Math.random().toString(36).substr(2, 8) });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Check if kicked
    if (msgR.includes(msgFrom + " whispered: kicked")) {
        send({ "cmd": "whisper", "nick": msgFrom, "text": "Whisper recieved" });
    }
    //Show AFK users
    if (msgR == "./showafk" && msgTrip == "21YRcd") {
        send({ "cmd": "chat", "text": afkList.toString() });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Show ignored users
    if (msgR == "./showignored" && msgTrip == "21YRcd") {
        send({ "cmd": "chat", "text": ignored.toString() });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Ignore users
    if (msgR.startsWith("./ignore") && msgTrip == "21YRcd") {
        ignored.push(msgR.replace("./ignore ", ""));
        console.log("Ignoring user " + msgR.replace("./ignore ", ""));
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Accept users
    if (msgR.startsWith("./accept") && msgTrip == "21YRcd") {
        ignored.splice(ignored.indexOf(msgR.replace("./accept ", ""), 1));
        console.log("Accepting user " + msgR.replace("./accept ", ""));
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Show online users
    if (msgR.startsWith("./list") && !ignored.includes(msgNick)) {
        send({ "cmd": "chat", "text": usersOnline });
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
    }
    //Add user to online list after they join channel
    if (msgCmd == "onlineAdd") {
        usersOnline += "," + msgData.nick;
    }
    //Remove user from online when they exit channel
    if (msgCmd == "onlineRemove") {
        usersOnline = usersOnline.replace("," + msgNick, "");
    }
    //Random number
    if (msgR.startsWith("./random") && !ignored.includes(msgNick)) {
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
        if (msgR == "./random") {
            send({ "cmd": "chat", "text": String(Math.random()) });
        }
        else {
            send({ "cmd": "chat", "text": Math.floor(Math.random() * msgR.replace("./random ", "") + 1).toString() });
        }
    }
    //Print color
    if (msgR.startsWith("./printcolor") && !ignored.includes(msgNick)) {
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
        if (msgR == "./printcolor") {
            send({ "cmd": "chat", "text": "Enter a fucking hex value" });
        }
        else {
            send({ "cmd": "chat", "text": "$\\def\\b{\\blacksquare\\\\}\\color{" + msgR.replace("./printcolor ", "") + "}{\\b}$" });
        }
    }
    //Check when chat was last active
    if (msgR.startsWith("./lastactive") && !ignored.includes(msgNick)) {
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
        let lastChatMessage = (Date.now() - packetRecTime);
        lastActiveTime = String((lastChatMessage/1000/60) + " Minutes");
        send({ "cmd": "chat", "text": lastActiveTime + "\nLast recieved message: " + lastMessage });
    }
    //Check uptime
    if (msgR.startsWith("./uptime") & !ignored.includes(msgNick)) {
        commandCounter++;
        process.stdout.write("\rTimes used: " + commandCounter);
        var hours = Math.floor(botUptime / 3600);
        var minutes = Math.floor((botUptime - (hours * 3600)) / 60);
        var seconds = botUptime - (hours * 3600) - (minutes * 60);
        botTime = String(hours + "h " + minutes + "m " + seconds + "s");
        send({ "cmd": "chat", "text": botTime });
    }
});
