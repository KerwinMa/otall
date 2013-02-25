
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
  
var settings = require('./settings');
var MongoStore = require('connect-mongo')(express);
var partials = require('express-partials');
var flash = require('connect-flash');

var sessionStore = new MongoStore(
						{
							db: settings.db
						}, 
						function()
						{
							console.log('connect mongodb success…');
						}
					);

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 2000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(partials());
  app.use(flash());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser({
	  uploadDir:'./public/uploads',
 	  limit: '1gb'
  }));
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
		secret : settings.cookie_secret,
		cookie : {
			maxAge : 60000 * 20	//20 minutes
		},
		store : sessionStore
	}));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', routes.index);
app.get('/newPrj', routes.newPrj);
app.post('/newPrj', routes.doNewPrj);
app.get('/p/:project', routes.project);
app.post('/p/:project', routes.upload);



http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
