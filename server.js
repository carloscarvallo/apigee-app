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

app.get('/', function(req, res) {
	console.log(`La API se encuentra en http://localhost:${port}/api`);
});

const router = express.Router();

routes.post('/authenticate', function(req, res) {
    
    User.findOne({
        name: req.body.name
    }, function(err, user) {
        if (err) throw err;
        
        if (!user) {
            res.json({ success: false, message: 'Authentication failed' })
            
        } else if (user) {
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password' });
                
            } else {
				
				request(options, (err, res) => {
					if (err) throw err
					
				    let json = JSON.parse(res.body);
					let token = json.access_token;
					
					res.json({
						success: true,
						message: 'Token creado!',
						token: token
					});
				});
                
            }
        }
    });
});

routes.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    
    if (token) {
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (!err) {
                req.decoded = decoded;
                next();
            } else {
                return res.json({ success: false, message: 'Token invalido' });
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }
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