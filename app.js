
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
  app.set('port', process.env.PORT || settings.appport);
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
			//maxAge : 60000 * 20	//20 minutes
			maxAge : 1000
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
app.get('/login', routes.login);
app.post('/login', routes.doLogin);
app.get('/logout', routes.logout);
app.get('/reg', routes.reg);
app.post('/reg', routes.doReg);
app.get('/newPrj', routes.newPrj);
app.post('/newPrj', routes.doNewPrj);
app.get('/p/:project', routes.project);
app.post('/p/:project', routes.project);
app.get('/up/:project', routes.upload);
app.post('/up/:project', routes.doUpload);
app.get('/configPrj/:project', routes.configPrj);
app.post('/configPrj/:project', routes.doConfigPrj);
app.get('/del/:project/:filename', routes.deleteItem);
app.get('/edit/:project/:filename', routes.editItem);
app.post('/edit/:project/:filename', routes.doEditItem);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
