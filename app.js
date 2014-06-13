
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

var fs = require('fs');
var accessLog = fs.createWriteStream('accessLog.log', {flags:'a'});
var errorLog = fs.createWriteStream('errorLog.log',{flags:'a'});

var app = express();

var passport = require('passport'),
		githubStrategy = require('passport-github').Strategy;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(flash());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.logger({stream: accessLog}));

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


app.use(passport.initialize()); //初始化Passport
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (err,req,res,next){
	var meta = '[' + new Date + ']' + req.url + '\n';
	errorLog.write(meta + err.stack + '\n');
	next();
})

passport.use(new githubStrategy({
	clientID: "5cac2a070e6e4e084f39",
	clientSecret: "324bef48317df2357caae0c7192e2d553e1e63af",
	callbackURL: "http://localhost:3000/login/github/callback"
}, function(accessToken, refreshToken, profile, done) {
	done(null, profile);
}));

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
