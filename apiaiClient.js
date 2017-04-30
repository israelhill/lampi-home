var apiai = require('apiai');
var config = require('./config');
var client = apiai(config.apiaiToken);
var twilioClient = require('./twilioClient');
var lampiClient = require('./lampi');
var schedule = require('node-schedule');
var moment = require('moment');

exports.fulfillGoogleHomeRequest = function(data, res) {
    console.log("Fulfilling Api.Ai request...");
    var action = data.result.action;
    doAction({'action': action, 'data': data, 'phoneNumber': null, 'res': res});
}

exports.fulfillSmsRequest = function(message, sender) {
    var request = client.textRequest(message, {
        sessionId: '33'
    });

    request.on('response', function(response) {
        console.log(response);
        parseResponseAndKickoffAction(response, sender);
    });

    request.on('error', function(error) {
        console.log(error);
        twilioClient.sendSms(sender, 'Sorry an error occured. Please try your request again.');
    });

    request.end();
}

function doAction(obj) {
    var action = obj.action;
    var data = obj.data;
    var res = obj.res;
    var phoneNumber = obj.phoneNumber;
    var speech = data.result.fulfillment.speech;
    console.log("Performing action: ", action);
    console.log(data);

    switch(action) {
        case 'setSpecificBrightnessPercentage':
            var brightness = data.result.parameters.item;
            var brightnessDecimal = convertBrightnessToDecimal(brightness);
            console.log('Brightness: ', brightnessDecimal);
            lampiClient.setBrightness(brightnessDecimal);
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'decreaseBrightness':
            lampiClient.decreaseBrightness();
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'increaseBrightness':
            lampiClient.increaseBrightness();
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'setColor':
            var color = data.result.parameters.item;
            lampiClient.setColor(color);
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'delayedPowerOn':
            var time = data.result.parameters.item;
            var timeUnit = data.result.parameters.item2;
            var jobExecutionTime = moment().add(time, timeUnit);
            var job = schedule.scheduleJob(jobExecutionTime.toDate(), function(){
                console.log('Executing Job: POWER ON');
                lampiClient.setPower(true);
            });
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'delayedPowerOff':
            var time = data.result.parameters.item;
            var timeUnit = data.result.parameters.item2;
            var jobExecutionTime = moment().add(time, timeUnit);
            var job = schedule.scheduleJob(jobExecutionTime.toDate(), function(){
                console.log('Executing Job: POWER OFF');
                lampiClient.setPower(false);
            });
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'turnOff':
            lampiClient.setPower(false);
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        case 'turnOn':
            lampiClient.setPower(true);
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
        default:
            console.log('Action not recognized');
            buildAndSendGoogleHomeResponse(speech, res);
            sendTwilioResponse(speech, phoneNumber);
            break;
    }
}

function buildAndSendGoogleHomeResponse(speech, res) {
    if(res !== null) {
        buildAndSendApiAiResponse(speech, res);
    }
}

function sendTwilioResponse(speech, phoneNumber) {
    if(phoneNumber !== null) {
        twilioClient.sendSms(phoneNumber, speech);
    }
}

function convertBrightnessToDecimal(brightness) {
    brightness = brightness.replace(/%/g, "");
    var brightnessDecimal = parseInt(brightness)/100;
    return brightnessDecimal;
}

function buildAndSendApiAiResponse(speech, res) {
    console.log("Responding with speech: ", speech);
    var data = {};
    data['speech'] = speech;
    res.json(data);
}

function parseResponseAndKickoffAction(response, phoneNumber) {
    var action = response.result.action;
    // remove plus sign from phone number
    var cleanPhoneNumber = phoneNumber.replace(/\+/g, "");
    console.log("SMS from: ", cleanPhoneNumber);
    doAction({'action': action, 'data': response, 'phoneNumber': phoneNumber, 'res': null});
};