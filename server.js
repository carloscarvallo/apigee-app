const request = require('request'),
	  express = require('express'),
	  app = express(),
	  bodyParser = require('body-parser'),
	  morgan = require('morgan'),
	  mongoose = require('mongoose'),
	  jwt = require('jsonwebtoken'),
	  User = require('./app/models/user'),
	  config = require('./config'),
	  
	  port = process.env.PORT || 8080;
	  
mongoose.connect(config.database);

app.set('superSecret', config.secret);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// connection test
const db = mongoose.connection;
db.on('error', console.error.bind( console, 'connection error: ' ));
db.on('open', function() {
    console.log('Conectado a la base de datos');
});

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