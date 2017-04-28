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


// var websocketOptions = {host:'mqtts://ec2-52-11-88-168.us-west-2.compute.amazonaws.com', port:5002};
// var options = {clientId: 'israel_nodejs', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout:1000,
//     debug:true, };

// var options = {clientId: 'israel_nodejs', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout:1000,
//     debug:true, rejectUnauthorized: false, host: 'ec2-52-11-88-168.us-west-2.compute.amazonaws.com', port:50002};

var clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
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
    color : {
        h: "50",
        s: "50"
    },
    brightness : "50",
    on: true
};


client.on('connect', function (err) {
    console.log(err);
    console.log('MQTT: Connecting to host');
    client.subscribe(lampChangedTopic);
    console.log('MQTT: Subscribed to ', lampChangedTopic);
    // sendTestMessage();
});

client.on('message', function (topic, message) {
    console.log('MQTT: Received a message');
    // message is Buffer
    console.log('MQTT Message: ', message.toString());
});

client.on('error', function(message){
    console.log("ERROR: ", message);
    client.end();
});

exports.sendMessage = function(state) {
    client.publish(setConfigTopic, state);
}

function sendTestMessage() {
    console.log("Publishing a message");
    client.publish(setConfigTopic, lampState, { qos: 0, retain: false });
}




// var state = {};
// const topic = "/devices/" + deviceId + "/lamp/set_config";
// client.publish(topic, state);
