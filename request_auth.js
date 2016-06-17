var request = require('request');
var fs = require('fs');
var config = require('./config');

require('dotenv').config();

var apigeeUser = process.env.APIGEE_USER;
var apigeePass = process.env.APIGEE_PASS;

var options = {
    url: config.oauthUrl,
    method: 'POST',
    auth: {
        user: apigeeUser,
        pass: apigeePass
    }
};

request(options, (err, res) => {
    var json = JSON.parse(res.body);
    
    fs.appendFile('.env', '\nAPIGEE_TOKEN=' + json.access_token, (err) => {
        if (err) console.error(err);
        console.log('Access Token saved to .env => ', json.access_token);
    });
    
});