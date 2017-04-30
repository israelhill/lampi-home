var apiai = require('apiai');
var config = require('./config');
var client = apiai(config.apiaiToken);
var twilioClient = require('./twilioClient');
var lampiClient = require('./lampi');
var schedule = require('node-schedule');

exports.fulfillGoogleHomeRequest = function(data, res) {
    console.log("Fulfilling Api.Ai request...");
    var action = data.result.action;
    doGoogleHomeAction(action, data, res);
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
        // send error text
    });

    request.end();
}

function doGoogleHomeAction(action, data, res) {
    console.log("Performing action: ", action);
    console.log(data);
    var speech = data.result.fulfillment.speech;
    switch(action) {
        case 'setSpecificBrightnessPercentage':
            var brightness = data.result.parameters.item;
            var brightnessDecimal = convertBrightnessToDecimal(brightness);
            console.log('Brightness: ', brightnessDecimal);
            lampiClient.setBrightness(brightnessDecimal);
            buildAndSendApiAiResponse(speech, res);
            break;
        case 'decreaseBrightness':
            lampiClient.decreaseBrightness();
            buildAndSendApiAiResponse(speech, res);
            break;
        case 'increaseBrightness':
            lampiClient.increaseBrightness();
            buildAndSendApiAiResponse(speech, res);
            break;
        case 'setColor':
            var color = data.result.parameters.item;
            lampiClient.setColor(color);
            buildAndSendApiAiResponse(speech, res);
            break;
        case 'delayedPowerOn':
            break;
        case 'turnOff':
            lampiClient.setPower(false);
            buildAndSendApiAiResponse(speech, res);
            break;
        case 'turnOn':
            lampiClient.setPower(true);
            buildAndSendApiAiResponse(speech, res);
            break;
    }
}

function convertBrightnessToDecimal(brightness) {
    brightness = brightness.replace(/%/g, "");
    var brightnessDecimal = parseInt(brightness)/100;
    return brightnessDecimal;
}

function doTwilioAction(action) {
    switch(action) {
        // intents here
    }
}

function buildAndSendApiAiResponse(speech, res) {
    console.log("Responding with speech: ", speech);
    var data = {};
    data['speech'] = speech;
    res.json(data);
}

function parseResponseAndKickoffAction(response, phoneNumber) {
    var responseResult = response.result;
    var responseSpeech = responseResult.fulfillment.speech;
    var responseItem = responseResult.parameters.item;
    var action = responseResult.action;
    // remove plus sign from phone number
    var cleanPhoneNumber = phoneNumber.replace(/\+/g, "");
    console.log("SMS from: ", cleanPhoneNumber);

    twilioClient.sendSms(cleanPhoneNumber, responseSpeech);
    doTwilioAction(action);
};