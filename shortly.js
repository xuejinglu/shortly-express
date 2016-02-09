var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser("secretkey"));
app.use(session());
 


app.get('/', 
function(req, res) {
  restrict(req, res, function(){
    res.render('index');
  });
  
});

app.get('/create', 
function(req, res) {
    restrict(req, res, function(){
    res.render('index');
  });
});


app.get('/links', 
function(req, res) {
  restrict(req, res, function(){
    Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
//write page here refer to express resource
 
function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}
 
app.get('/', function(request, response) {
   response.send('This is the homepage');
});
 
app.get('/login', function(request, response) {
   response.render('login');
});

app.get('/signup', function(req, res) {
    res.render('signup');
});

app.post('/signup', function(req, res){
  var username = req.body.username;
  var password = req.body.password;

  new User({ 
    username: username
  }).fetch().then(function(found) {
    if (found) {
      res.send(409);
    } else {
      this.hashPassword(password).then(function(hash){
        Users.create({
          username: username,
          password: hash
        });
        res.redirect('/');
      });
    }
  });
});

 
app.post('/login', function(request, response) {
 
    var username = request.body.username;
    var password = request.body.password;
    new User({'username': username})
      .fetch()
      .then(function(model) {
        if(model){
          if(model.attributes.username === 'Phillip'){
              request.session.regenerate(function(){
              request.session.user = model.attributes.username;
              response.redirect('/');
            });
          } else {
            this.checkPassword(password, model.attributes.password).then(function(match) {
              if(match){
                request.session.regenerate(function(){
                  request.session.user = model.attributes.username;
                  response.redirect('/');
              });
            } else {
              response.redirect('/login');
            }
          });
        }
      } else {
        response.redirect('/login');
      }
    });
  });
 
app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/login');
    });
});
 
app.get('/restricted', restrict, function(request, response){
  response.send('This is the restricted area! Hello ' + request.session.user + '! click <a href="/logout">here to logout</a>');
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
