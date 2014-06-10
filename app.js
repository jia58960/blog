
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
//var user = require('./routes/user');
var http = require('http');
var path = require('path');
var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(flash());
app.use(express.favicon());
app.use(express.logger('short'));
app.use(express.bodyParser({keepExtension: true,uploadDir: './public/images'}));
app.use(express.methodOverride());

app.use(express.cookieParser());

app.use(express.session({
	secret:settings.cookieSecret,
	key:settings.db, //cookie name
	cookie: {maxAge: 1000 * 60 * 60 * 24}, // 1 day
	store: new MongoStore({
		db: settings.db
	})
}));



app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// app.get('/', routes.index);
// app.get('/users', user.list);
routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
