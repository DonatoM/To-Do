// Retrieve all necessary objects.
var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var nodemailer = require('nodemailer');

mongoose.connect('mongodb://localhost/tasksdb');
// Pass passport object to our passport configuration file.
require('./config/passport')(passport);

// Set our templating engine. (Handlebars)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Taken from grocery app.js file.
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: true }));


// Taken from Class 17 GitHub Repo
// Required for passport.
app.use(session({ secret: 'secret' }));
app.use(passport.initialize());
app.use(passport.session());
// Use flash to alert users based on specific errors on the login/sign in page.
app.use(flash());

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'email@address.com',
        pass: 'password'
    }
});

// Pass in our app and passport object over to routes.
// After all required content has been passed.
require('./app/routes.js')(app, passport,transporter);

app.listen(8080);
