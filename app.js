const request = require('request'),
	  express = require('express'),
	  app = express(),
	  config = require('./config');

require('dotenv').config();

const port = process.env.PORT || 8080,
	  url = config.serviceUrl,
	  apigeeToken = process.env.APIGEE_TOKEN;

const options = {
	url: url,
	auth: {
		'bearer': apigeeToken
	}
};

const middleware = ( req, res, next ) => {
	console.log('...Something happen');
	next();
};

const greet = ( req, res ) => {
	res.json({ mensaje: "bienvenido a mi API" });
};

const getService = ( req, res ) => {
	request(options, ( err, response ) => {
		res.json(JSON.parse( response.body ));
	});
};

const router = express.Router();

router.use( middleware );

router.get('/', greet);

router.route('/users')
	.get( getService );
	
app.use('/api', router);

app.listen(port, () => {
	console.log('app listening in', port);
});