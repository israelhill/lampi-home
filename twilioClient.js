var config = require('./config');
var client = require('twilio')(config.accountSid, config.authToken);

exports.sendSms = function (to, message) {
    client.messages.create({
        body: message,
        to: to,
        from: config.sendingNumber
    }, function (err, data) {
        if (err) {
            console.error('Could not send message.');
            console.error(err);
        } else {
        }
    });
};