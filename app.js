var express = require('express');
var path = require('path');
var http = require('http');
var request = require('request');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var db = require('./config/db');
var routes = require('./routes/index');
var authRouter = require('./routes/auth');
var userRouter = require('./routes/user');
var logoutRouter = require('./routes/logout');
var busRouter = require('./routes/bus');
var userlistRouter = require('./routes/userlist');

var app = express();
var user = {};
app.use(logger('dev'));
app.use(cookieParser('mySecretKey'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use('/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/bus', busRouter);
app.use('/api/userlist', userlistRouter);

app.use('/', routes);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
module.exports = app;