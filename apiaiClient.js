var apiai = require('apiai');
var config = require('./config');
var client = apiai(config.apiaiToken);
var twilioClient = require('./twilioClient');
var lampiClient = require('./lampi');
var schedule = require('node-schedule');
var moment = require('moment');
var twilio = require('twilio');

exports.fulfillGoogleHomeRequest = function(data, res) {
    console.log("Fulfilling Api.Ai request...");
    var action = data.result.action;
    doAction({'action': action, 'data': data, 'res': res, 'agent': 'google'});
}

exports.fulfillSmsRequest = function(message, sender, res) {
    var request = client.textRequest(message, {
        sessionId: '<33>'
    });

    request.on('response', function(response) {
        parseResponseAndKickoffAction(response, sender, res);
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
    var speech = data.result.fulfillment.speech;
    var agent = obj.agent;
    console.log("Performing action: ", action);
    console.log(data);
    switch(action) {
        case 'setSpecificBrightnessPercentage':
            var brightness = data.result.parameters.item;
            var brightnessDecimal = convertBrightnessToDecimal(brightness);
            console.log('Brightness: ', brightnessDecimal);
            lampiClient.setBrightness(brightnessDecimal);
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'decreaseBrightness':
            lampiClient.decreaseBrightness();
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'increaseBrightness':
            lampiClient.increaseBrightness();
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'setColor':
            var color = data.result.parameters.item;
            lampiClient.setColor(color);
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'delayedPowerOn':
            var time = data.result.parameters.item;
            var timeUnit = data.result.parameters.item2;
            var jobExecutionTime = moment().add(time, timeUnit);
            var job = schedule.scheduleJob(jobExecutionTime.toDate(), function(){
                console.log('Executing Job: POWER ON');
                lampiClient.setPower(true);
            });
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'delayedPowerOff':
            var time = data.result.parameters.item;
            var timeUnit = data.result.parameters.item2;
            var jobExecutionTime = moment().add(time, timeUnit);
            var job = schedule.scheduleJob(jobExecutionTime.toDate(), function(){
                console.log('Executing Job: POWER OFF');
                lampiClient.setPower(false);
            });
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'turnOff':
            lampiClient.setPower(false);
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        case 'turnOn':
            lampiClient.setPower(true);
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent);
            break;
        default:
            console.log('Action not recognized');
            buildAndSendGoogleHomeResponse(speech, res, agent);
            sendTwilioResponse(speech, res, agent)
            break;
    }
}

function buildAndSendGoogleHomeResponse(speech, res, agent) {
    if(agent === 'google') {
        buildAndSendApiAiResponse(speech, res);
    }
}

function sendTwilioResponse(speech, res, agent) {
    if(agent == 'twilio') {
        console.log("******* Inside twilio response function **********");
        // respond to twilio using twiml
        var twimlResponse = twilio.TwimlResponse();
        twimlResponse.message(speech);
        res.send(twimlResponse.toString());
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

function parseResponseAndKickoffAction(response, res) {
    var action = response.result.action;
    doAction({'action': action, 'data': response, 'res': res, 'agent': 'twilio'});
};