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

require('dotenv').config();

const apigeeUser = process.env.APIGEE_USER,
	  apigeePass = process.env.APIGEE_PASS;

app.get('/', function(req, res) {
	console.log(`La API se encuentra en http://localhost:${port}/api`);
});

app.post('/register', function(req, res) {
		
	var user = new User({
		name: req.body.name,
		password: req.body.password,
		email: req.body.email
	});
		
	user.save(function(err) {
		if (!err) {            
			console.log('User saved!');
			res.json({ success: true, message: 'Usuario creado!' });
				
		} else {
			res.json({ success: false, message: 'Usuario no creado!' });
			if (err.code === 11000) {
				console.log('Este email ya existe prueba con otro');
			}
		}
	});
});

// API ROUTES ------------------------------------------------------------------

const routes = express.Router();

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
				
				const options = {
				    url: config.oauthUrl,
				    method: 'POST',
				    auth: {
				        user: apigeeUser,
				        pass: apigeePass
				    }
				};
				
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
		// TODO: tratar expiracion del Token, etc
		req.token = token;
		next();
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided'
        });
    }
});

routes.get('/', ( req, res ) => {
	res.json({ mensaje: "Bienvenido a la API!" });
});

routes.route('/getusers')
	.get(( req, res ) => {
		
		const options = {
			url: config.serviceUrl,
			auth: {
				'bearer': req.token
			}
		};
		
		request(options, ( err, response ) => {
			res.json(JSON.parse( response.body ));
		});
	});
	
app.use('/api', routes);

app.listen(port, () => {
	console.log('app listening in', port);
});