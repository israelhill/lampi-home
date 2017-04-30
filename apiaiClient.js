var apiai = require('apiai');
var config = require('./config');
var client = apiai(config.apiaiToken);
var twilioClient = require('./twilioClient');
var lampiClient = require('./lampi');

exports.fulfillGoogleHomeRequest = function(data, res) {
    console.log("Fulfilling Api.Ai request...");
    var action = data.result.action;
    doWebhookAction(action, data, res);
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
    switch(action) {
        case 'setSpecificBrightness':
            var brightness = data.result.parameters.item;
            console.log('Brightness: ', brightness);
            var speech = data.fulfillment.speech;
            lampiClient.setBrightness(brightness);
            buildAndSendApiAiResponse(speech, res);
            break;
    }
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