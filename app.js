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

var middleware = (req, res, next) => {
	console.log('...Something happen');
	next();
};

var greet = (req, res) => {
	res.json({ mensaje: "bienvenido a mi API" });
};

var getService = (req, res) => {
	request(options, (err, response) => {
		res.json(JSON.parse(response.body));
	});
};

var router = express.Router();

router.use(middleware);

router.get('/', greet);

router.route('/users')
	.get(getService);
	
app.use('/api', router);

app.listen(port, () => {
	console.log('app listening in', port);
});