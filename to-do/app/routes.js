var mongoose = require('mongoose');
var Task = mongoose.model('Task');
var User = mongoose.model('User');
var List = mongoose.model('List');
var Feedback = mongoose.model('Feedback');
var slug = require('slug');


var id = 0;

module.exports = function(app, passport, transporter) {

	app.get('/', function(req, res) {
		res.render('index');
	});

	// Flash --> Handles potential login issues addressed in passport.js
	app.get('/login', function(req, res) {
		res.render('login', { message: req.flash('login') });
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile',
		failureRedirect : '/login',
		failureFlash : true
	}));

	// Flash --> Handles potential signup issues addressed in passport.js
	app.get('/signup', function(req, res) {
		res.render('signup', { message: req.flash('signup') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	// We can limit what we want "logged in" users vs. "non-logged in" users to see through the use of
	// the isLoggedIn middleware.
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile', {
			user : req.user
		});
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// Load lists specific to the current logged in user.
	app.get('/lists', isLoggedIn, function(req, res){
		User.findOne({email: req.user.email},
					 function(err,list,count){res.render('list',{main_title:'Shoppy Shoperson',title:'Grocery Lists',list:req.user.lists});});
	});

	app.get('/create/list', isLoggedIn, function(req, res){
		res.render('create_list');
	});

	// Create a list under the loggedin user lists array.
	app.post('/create/list', isLoggedIn, function(req, res){
		var new_list = List();
		new_list.name = req.body.list_name;
		new_list.created = req.body.created_by;
		new_list.items = [];
		// Need to take into consideration lists with the same name.
		new_list.slug = slug(new_list.name +"-" + id);
		id++;

		// Map by email value since its unique.
		// Passport allows us to prevent duplicate emails.
		User.findOneAndUpdate(
								{email: req.user.email},
								{$push:{lists: new_list}},
								{safe: true, upsert: true},
								function(err,list,count){res.redirect('/lists');});
		});

	app.get('/list/:slug', isLoggedIn, function(req, res){
		// Search all lists within the list array for the user and see if any of the lists' slugs match the requested list.
		// If so then render information about that specific list.
		var req_list = [];
		for(var i = 0; i < req.user.lists.length; i++){
			if(req.user.lists[i].slug === req.params.slug){
				req_list = req.user.lists[i];
			}
		}
		User.findOne({email: req.user.email},
					 function(err,user,count){
					 	res.render('list_items',{list_name: req_list.name, created_by: req_list.created, list_items: req_list.items});
					 });
	});

	app.post('/list/:slug', isLoggedIn, function(req, res){
		// Similar to a GET only difference is that you want to replace the old list that got an item added
		// With the most current.
		var req_list = [];
		var list_url = "/list/" + req.params.slug;
		for(var i = 0; i < req.user.lists.length; i++){
			if(req.user.lists[i].slug === req.params.slug){
				req_list = req.user.lists[i];
				req_list.items.push(new Task({name: req.body.name, checked: false, slug: req.params.slug}));
				req.user.lists[i] = req_list;
			}
		}

		User.findOneAndUpdate(
								{email: req.user.email},
								{$set:{lists: req.user.lists}},
								{safe: true, upsert: true},
								function(err,list,count){res.redirect(list_url);
		});
	});

	app.post('/item/', isLoggedIn, function(req, res){
		if(typeof req.body['slug'] == 'string'){
			var slug = req.body['slug'];
		}
		else{
			var slug = req.body['slug'][0];
		}

		var removed_items = [];

		// If one item is removed then it will just return a string.
		// If you call .length it will return the length of the string
		// Therefore you have to deal with this single case differently.
		if(typeof(req.body.itemCheckbox) === 'string'){
			removed_items.push(req.body.itemCheckbox);
		}
		// If there is more than one item being removed then
		// an array of strings will be found in req.body.itemCheckbox
		else{
			for(var i = 0; i < req.body.itemCheckbox.length; i++){
				removed_items.push(req.body.itemCheckbox[i]);
			}
		}

		var req_list = [];
		var index = 0;
		for(var i = 0; i < req.user.lists.length; i++){
			if(req.user.lists[i].slug === slug){
				req_list = req.user.lists[i];
				index = i;
			}
		}


		for(var i = 0; i < req_list.items.length; i++){
			for(var j = 0; j < removed_items.length; j++){
				if(req_list.items[i].name === removed_items[j]){
					req_list.items[i].checked = true;
				}
			}
		}

		req.user.lists[index] = req_list;
		User.findOneAndUpdate(
								{email: req.user.email},
								{$set:{lists: req.user.lists}},
								{safe: true, upsert: true},
								function(err,list,count){res.redirect('/list/'+slug);
		});
	});

	app.get('/feedback/',isLoggedIn, function(req, res){
		res.render('feedback');
	});

	app.post('/feedback/',isLoggedIn, function(req, res){
		console.log(req.user.email);
		var feedback = new Feedback();
		feedback.contact = req.user.email;
		feedback.subject = req.body['Subject'];
		feedback.message = req.body['Message'];
		feedback.save(function(err){});

		var mailOptions = {
		    from: req.user.email,
		    to: 'datasetsproject@gmail.com',
		    subject: req.user.email + ": " + req.body['Subject'],
		    text: req.body['Message']
		};
		transporter.sendMail(mailOptions, function(error, info){
		    if(error){
		        console.log(error);
		    }else{
		        console.log('Message sent: ' + info.response);
		    }
		});
		res.render('index');
	});

};

// Middleware that checks if you're logged in. If not you're redirected to the login page.
function isLoggedIn(req, res, next){
	if (req.isAuthenticated())
		return next();
	res.redirect('/login');
}
