var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');
var url = require('url') ;
require("dotenv").load();


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObject(req) {
    var json = {
        headers : "No Headers",
        key: process.env.UNIQUE_KEY,
        body : "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {

    if (req.method = 'POST'){
        var json = getJSONObject(req);
        res.send(json);

        if (!req.body.username || !req.body.password) {
            res.json({success: false, msg: 'Please pass username and password.'});
        } else {
            var newUser = {
                username: req.body.username,
                password: req.body.password
            };
            // save the user
            db.save(newUser); //no duplicate checking
            res.json({success: true, msg: 'Successful created new user.'});
        }

    }
    else { //HTTP request not supported.
        res.send("HTTP request not supported.");
        res.end();
    }
});

router.post('/signin', function(req, res) {

    if(req.method == "POST") {
        var json = getJSONObject(req);
        res.send(json);

        var user = db.findOne(req.body.username);
        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
            // check if password matches
            if (req.body.password == user.password) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        }
    }
    else{
        res.send("HTTP request not supported.");
        res.end();
    }
});

router.post('/movies',function (req, res) {

    if (req.method = 'GET'){
        res.json({status:200, message:"GET Movies", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
    }
    else if (req.method = 'POST'){
        res.json({status:200, message:"Movie Saved", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});

    }

    else if (req.method = 'PUT'){
        authJwtController.isAuthenticated, function (req, res){
            res.json({status:200, message:"Movie Updated", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
        }
    }

    else if (req.method = 'DELETE'){
        authController.isAuthenticated, function (req, res) {
            res.json({status:200, message:"Movie Deleted", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
        }
    }
    else{
        res.send("HTTP request not supported.");
        res.end();
    }
});

router.post('/*', function (req, res) {
    //No base URL requests allowed.
    res.json({status:401, message:"No base URL requests allowed", headers: req.headers, query: req.query});
});


app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing