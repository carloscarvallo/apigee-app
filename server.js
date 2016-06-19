'use strict';
const request = require('request'),
      express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      morgan = require('morgan'),
      mongoose = require('mongoose'),
      bcrypt = require('bcryptjs'),
      User = require('./app/models/user'),
      config = require('./config'),
      nunjucks = require('nunjucks');
	  
mongoose.connect(config.database);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// connection test
const db = mongoose.connection;
db.on('error', console.error.bind( console, 'connection error: ' ));
db.on('open', function() {
    console.log('Conectado a la base de datos');
});

nunjucks.configure('assets', {
    autoescape: true,
    noCache: true,
    express: app
});

require('dotenv').config();

const port = process.env.PORT || 8080,
      apigeeUser = process.env.APIGEE_USER,
      apigeePass = process.env.APIGEE_PASS;

app.get('/', ( req, res ) => {
    res.render('index.html', { message: `La API se encuentra en http://localhost:${port}/api` });
});

app.post('/register', ( req, res ) => {
	// hash password
    const passHashed = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    let user = new User({
        name: req.body.name,
        password: passHashed,
        email: req.body.email
    });
		
    user.save(( err ) => {
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

routes.post('/authenticate', ( req, res ) => {
    
    User.findOne({
        email: req.body.email
    }, function(err, user) {
        if (err) throw err;
        
        if (!user) {
            res.json({ success: false, message: 'Authentication failed' })
            
        } else if (user) {
            // compare password
            if (bcrypt.compareSync(req.body.password, user.password)) {
            	const options = {
                    url: config.oauthUrl,
                    method: 'POST',
                    auth: {
                        user: apigeeUser,
                        pass: apigeePass
                    }
                };
				
                request(options, ( err, response ) => {
                    if (err) throw err

                    let json = JSON.parse(response.body);
                    let token = json.access_token;

                    res.json({
                        success: true,
                        message: 'Token creado!',
                        token: token
                    });
                });
				
            } else {
            	res.json({ success: false, message: 'Authentication failed. Wrong password' });
            }
        }
    });
});

routes.use(( req, res, next ) => {
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