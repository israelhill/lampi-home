var express = require('express');
var bodyParser = require('body-parser');
var apiaiClient = require('./apiaiClient');
var twilio = require('twilio');


// initialize express server
var app = express();
app.use(bodyParser.urlencoded({extended: false}));

app.get('/test', function(req, res){
    res.json({'test': 'server is working'});
});


app.listen(3000, function(){
    console.log('App Started!');
})


// webhook for apiai
var json_body_parser = bodyParser.json();
app.post('/google_home_message', json_body_parser, function(req, res) {
    if(typeof req.body.originalRequest === 'undefined') {
        // this request is from sms... ignore it. It is already being handles by twilio endpoint
        console.log('Webhook request from SMS... ignoring');
    }
    else if(req.body.originalRequest.source === 'google') {
        console.log('Request from Google Home');
        chatbot.fulfillRequest(req.body, res);
    }
});

// webhook for twilio
app.post('/sms_message' function(req, res) {
    console.log("Received a Message From User");
    var message = req.body.Body;
    var senderPhoneNumber = req.body.From;
    apiaiClient.fulfillSmsRequest(message, senderPhoneNumber);

    // respond to twilio using twiml
    var twimlResponse = twilio.TwimlResponse();
    twimlResponse.message("");
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twimlResponse.toString());
});