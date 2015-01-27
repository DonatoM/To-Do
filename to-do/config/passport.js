var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // Using default strategies.
    passport.use('local-signup', new LocalStrategy({
        // Overriding local strategy fields to our liking.
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        // Check if form email matches an email in our users collection.
        User.findOne({'email':  email }, function(err, user) {
            // check to see if theres already a user with that email
            if (user)
                return done(null, false, req.flash('signup', 'That email is already taken. Try a new one.'));

            else {
                var newUser = new User();
                newUser.first_name = req.body.first_name;
                newUser.middle_name = req.body.middle_name;
                newUser.last_name = req.body.last_name;
                newUser.email    = email;
                newUser.password = newUser.generateHash(password);
                newUser.lists = [];

                newUser.save(function(err) {
                    return done(null, newUser);
                });
            }
        });
    }));


    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, email, password, done) {
        // Check if form email matches an email in our users collection.
        User.findOne({ 'email' : email }, function(err, user) {
            // Alert the user if no such email exists.
            if (!user)
                return done(null, false, req.flash('login', 'No user found. Check your email! '));

            // Alert user if the username is valid but the password is wrong.
            if (!user.validPassword(password))
                return done(null, false, req.flash('login', 'Wrong Password!'));

            return done(null, user);
        });

    }));

};
