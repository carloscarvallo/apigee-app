var request = require('request');
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

request(options, (err, res) => {
	console.log(JSON.parse(res.body));
});