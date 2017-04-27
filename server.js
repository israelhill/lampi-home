var express = require('express');
var bodyParser = require('body-parser');


// initialize express server
var app = express();
app.use(bodyParser.urlencoded({extended: false}));

app.get('/test', function(req, res){
    res.json({'test': 'server is working'});
});


app.listen(3000, function(){
    console.log('App Started!');
})
