var mqtt = require('mqtt');
var fs = require('fs');
var websocketsPort = 50002;
var deviceId = 'b827eb37a0cd';
var lampChangedTopic = "/devices/" + deviceId + "/lamp/changed";
var setConfigTopic = "/devices/" + deviceId + "/lamp/set_config";
var host = 'wss://ec2-52-11-88-168.us-west-2.compute.amazonaws.com:50002';
var KEY = fs.readFileSync('/etc/keys/client.key');
var CERT = fs.readFileSync('/etc/keys/client.crt');
var CAfile = fs.readFileSync('/etc/keys/ca.crt');
var Color = require('color');


// var clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
var clientId = '0.7678878316189812_web_client';
var options = {
    keepalive: 10,
    clientId: clientId,
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: false,
    ca: CAfile,
    key: KEY,
    cert: CERT
};


var client = mqtt.connect(host, options);
var lampState = {
    'color' : {
        'h': 0.99,
        's': 0.99
    },
    'brightness' : 0.99,
    'on': true

};


client.on('connect', function (err) {
    console.log('MQTT: Connecting to host');
    client.subscribe(lampChangedTopic);
    console.log('MQTT: Subscribed to ', lampChangedTopic);
});

client.on('message', function (topic, message) {
    console.log('MQTT: Received a message');
    console.log('MQTT Message: ', message.toString());
    var currentState = JSON.parse(message.toString());
    lampState = currentState;
    console.log("Updated lampState: ", lampState);
});

client.on('error', function(message){
    console.log("ERROR: ", message);
    client.end();
});

function sendStateToLamp() {
    var msg = JSON.stringify(lampState);
    client.publish(setConfigTopic, msg, {qos: 2});
}

exports.setBrightness = function(brightness) {
    lampState.brightness = brightness;
    sendStateToLamp();
}

exports.setColor = function(color) {
    color = color.toLowerCase();
    try {
        var newColor = Color(color);
        var newColorHSV = newColor.hsv();
        lampState.color.h = newColorHSV.color[0]/360;
        lampState.color.s = newColorHSV.color[1]/100;
        console.log("Setting hue and saturation: ", newColorHSV.color[0], newColorHSV.color[1]);
        sendStateToLamp();
    }
    catch(e) {
        console.log("Could not find color: ", color);
    }
}

exports.setPower = function(power) {
    lampState.on = power;
    sendStateToLamp();
}

exports.decreaseBrightness = function() {
    var currentBrightness = lampState.brightness;
    var newBrightness = (currentBrightness - 0.3 > 0) ? (currentBrightness - 0.3) : 0.1;
    lampState.brightness = newBrightness;
    sendStateToLamp();
}

exports.increaseBrightness = function() {
    var currentBrightness = lampState.brightness;
    var newBrightness = (currentBrightness + 0.3 < 1) ? (currentBrightness + 0.3) : 1;
    lampState.brightness = newBrightness;
    sendStateToLamp();
}

