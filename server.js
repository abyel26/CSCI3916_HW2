var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');
var url = require('url') ;


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObject(req) {
    var json = {
        headers: "No Headers",
        key: process.env.UNIQUE_KEY,
        body: "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }
    return json;
}

router.use('/signup', function(req, res) {

    if (req.method == 'POST'){


        if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please pass username and password.'});
        }
        else {
            var newUser = {
                username: req.body.username,
                password: req.body.password
            };
            // save the user
            db.save(newUser); //no duplicate checking
            var o = getJSONObject(req);
            res.json({success: true, msg: 'Successful created new user.', headers: o.headers, body: o.body, environmentVariable: o.key});
        }
    }
    else { //HTTP request not supported.
        res.send("HTTP request not supported.");
        res.end();
    }
});




router.use('/signin', function(req, res) {

    if(req.method == "POST") {
        // var json = getJSONObject(req);
        // res.send(json);

        var user = db.findOne(req.body.username);

        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
            // check if password matches
            if (req.body.password == user.password) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.UNIQUE_KEY);
                var o = getJSONObject(req);
                res.json({success: true, token: 'JWT ' + token, headers: req.headers, body: o.body, env: process.env.UNIQUE_KEY});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        }
    }
    else { //HTTP request not supported.
        res.send("HTTP request not supported.");
        res.end();
    }
});

router.use('/movies',function (req, res) {

    if (req.method == 'GET'){
        res.status(200).send({message:"GET Movies", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
    }
    else if (req.method == 'POST'){
        res.status(200).send({message:"Movie Saved", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});

    }
    else{
        res.send("HTTP request not supported.");
        res.end();
    }
});

app.delete('/movies', passport.authenticate('basic', {
    session: false
}), (req, res) => {
    res.status(200).send({message:"Movie Deleted", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
});

app.put('/movies', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    res.status(200).send({ message:"Movie Updated", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
});



app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing