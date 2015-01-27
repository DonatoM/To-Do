var mongoose = require('mongoose');
var URLSlugs = require('mongoose-url-slugs');
var bcrypt   = require('bcrypt-nodejs');

var Feedback = mongoose.Schema({
    contact: String,
    subject: String,
    message: String
});

var Task = mongoose.Schema({
    name: String,
    checked: Boolean,
    slug: String
});

var List = mongoose.Schema({
    name: String,
    created: String,
    slug: String,
    items: [Task]
});

var User = mongoose.Schema({
    first_name: String,
    middle_name: String,
    last_name: String,
    email: String,
    password: String,
    lists: [List]
});

// Generate a hash for the password.
User.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// Compares Hashed password with passed in password.
User.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

List.plugin(URLSlugs('name'));

module.exports = mongoose.model('Feedback', Feedback);
module.exports = mongoose.model('Task', Task);
module.exports = mongoose.model('List', List);
module.exports = mongoose.model('User', User);
