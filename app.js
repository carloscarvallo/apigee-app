var request = require('request');
var express = require('express');
var app = express();
var config = require('./config');

require('dotenv').config();

var port = process.env.PORT || 8080;
var url = config.serviceUrl;
var apigeeToken = process.env.APIGEE_TOKEN;

var options = {
	url: url,
	auth: {
		'bearer': apigeeToken
	}
};

var router = express.Router();

router.use(function(req, res, next) {
	console.log('...Something happen');
	next();
});

router.get('/', function(req, res) {
	res.json({ mensaje: "bienvenido a mi API" });
});

router.route('/users')
	.get(function(req, res){
		request(options, (err, response) => {
			res.json(JSON.parse(response.body));
		});
	});
	
app.use('/api', router);

app.listen(port, function() {
	console.log('app listening in', port);
});