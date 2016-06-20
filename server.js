'use strict';
const request = require('request'),
      express = require('express'),
      app = express(),
      bodyParser = require('body-parser'),
      morgan = require('morgan'),
      mongoose = require('mongoose'),
      bcrypt = require('bcryptjs'),
      nunjucks = require('nunjucks'),
      sessions = require('client-sessions'),
      User = require('./app/models/user'),
      config = require('./config');

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

// template initialization
nunjucks.configure('assets', {
    autoescape: true,
    noCache: true,
    express: app
});

require('dotenv').config();

const port = process.env.PORT || 8080,
      apigeeUser = process.env.APIGEE_USER,
      apigeePass = process.env.APIGEE_PASS;
      
app.use(sessions({
    cookieName: 'session',
    secret: 'crazydiamond',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

app.use(( req, res, next ) => {
    console.log('pasa por aca');
    console.log("token ", req.session.token);
    if (req.session && req.session.user) {
        User.findOne({ email: req.session.user.email }, ( err, user ) => {
            if (err) throw err
            if (user) {
                req.user = user;
                delete req.user.password;
                req.session.user = req.user;
                res.locals.user = req.user;
            }
            next();
        });
    } else {
        next();
    }
});

let requireLogin = ( req, res, next ) => {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
};

app.get('/', ( req, res ) => {
    res.render('index.html');
});

app.get('/register', ( req, res ) => {
    res.render('register.html');
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
            console.log('Usuario creado!');
            res.redirect('/dashboard');
            
        } else {
            console.log('Usuario no creado!');
            if (err.code === 11000) {
                res.render('register.html', { error: 'Este email ya existe prueba con otro' });
            }
        }
    });
});

app.get('/login', ( req, res ) => {
    res.render('login.html');
});

app.post('/login', ( req, res ) => {
    User.findOne({ email: req.body.email }, ( err, user ) => {
        if (err) throw err;
        
        if (!user) {
            res.render('login.html', { error: 'Authentication failed.' });
        } else if (user) {
            // compare password
            if (bcrypt.compareSync(req.body.password, user.password)) {
				req.session.user = user;
                res.redirect('/dashboard');
                
            } else {
                res.render('login.html', { error: 'Authentication failed.' });
            }
        }
    });
});

app.get('/dashboard', requireLogin, ( req, res ) => {
    res.render('dashboard.html');
});

app.get('/logout', function(req, res) {
    req.session.reset();
    res.redirect('/');
});

// API ROUTES ------------------------------------------------------------------

const routes = express.Router();

routes.post('/authenticate', ( req, res ) => {

    User.findOne({ email: req.user.email || req.session.user.email || req.body.email }, ( err, user ) => {
        if (err) throw err;
        
        if (!user) {
            res.json({ success: false, message: 'Authentication failed' })
            
        } else if (user) {
            if ((req.user.password || req.session.user.password) === user.password || bcrypt.compareSync(req.body.password, user.password)) {
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
                    res.render('dashboard.html', { token: token });
                    req.session.token = token;
                    
                });
				
            } else {
            	res.json({ success: false, message: 'Authentication failed. Wrong password' });
            }
        }
    });
});

routes.use(( req, res, next ) => {
    var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.session.token;
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