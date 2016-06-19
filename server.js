const request = require('request'),
	  express = require('express'),
	  app = express(),
	  morgan = require('morgan');
	  config = require('./config');

/*
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
*/

const router = express.Router();

router.use(( req, res, next ) => {
	console.log('...Something happen');
	next();
});

router.get('/', ( req, res ) => {
	res.json({ mensaje: "Bienvenido a la API!" });
});

router.route('/users')
	.get(( req, res ) => {
		request(options, ( err, response ) => {
			res.json(JSON.parse( response.body ));
		});
	});
	
app.use('/api', router);

app.listen(port, () => {
	console.log('app listening in', port);
});