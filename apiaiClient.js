var apiai = require('apiai');
var config = require('./config');
var client = apiai(config.apiaiToken);
var twilioClient = require('./twilioClient');

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
        // handle response here
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
        // intents here
    }
}

function doTwilioAction(action) {
    switch(action) {
        // intents here
    }
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