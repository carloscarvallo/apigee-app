var request = require('request');
var express = require('express');
var app = express();
var config = require('./config');

require('dotenv').config();

var url = config.serviceUrl;
var apigeeToken = process.env.APIGEE_TOKEN;

var options = {
	url: url,
	auth: {
		'bearer': apigeeToken
	}
};

app.get('/', function(req, res) {
	request(options, (err, response) => {
		res.json(JSON.parse(response.body));
	});
});

app.listen(4000, function() {
	console.log('app listening');
});