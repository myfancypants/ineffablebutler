/*
 ** auth.js
 ** Used along with Passport.js with GoogleStrategy/FacebookStrategy to authenticate users and to store new users in DB.
 ** Existing users that are authenticated can save their routes in the DB.
 */

var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var UserDB = require('../models/user');
var googleConfig = require('../config/googleConfig');
var facebookConfig = require('../config/facebookConfig');
var authRouter = express.Router();

var NEO_db = require('../config/neodb'); //RENAME THIS!!!!
console.log("got here ", NEO_db);

//if authentication succeeds, a session will be established and a cookie set in user's browser
// serializeUser is only called during authentication, which indicates what user information to store
// deserializeUser is invoked on every request by passport.sessions (making req.user object available in request handler)
passport.serializeUser(function (user, done) {
  console.log("serializeUser");
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  console.log("deserializeUser");
  done(null, obj);
});

//Function that saves new user to UserDB (../models/user.js)
var saveUser = function (accessToken, refreshToken, profile, done) {
  UserDB.findOrCreate({
    loginId: profile.id,
    loginMethod: profile.provider,
    displayName: profile.displayName
  }, function (err, user, created) {
    if (err) {
      console.log("error:", err);
    }
    console.log("created:", created, user, accessToken, refreshToken);
    return done(null, profile);
  });
};

var NEO_saveUser = function (accessToken, refreshToken, profile, done) {

  NEO_db.cypherQuery(
    'MATCH (user: User) WHERE user.loginId = \'' + profile.id + '\' RETURN user',
     function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log(result.data); // delivers an array of query results
      console.log(result.columns); // delivers an array of names of objects getting returned

      if(result.data.length === 0) {
        NEO_db.cypherQuery(
          'CREATE (user: User { loginId: {loginId}, loginMethod: {loginMethod}, displayName: {displayName}, password: {password}, salt: {salt} }) RETURN user',
          {
            loginId: profile.id,
            loginMethod: profile.provider,
            displayName: profile.displayName,
            password: "",
            salt: ""
          }, function (err, result) {
            if (err) {
              return console.log(err);
            }
            console.log(result.data); // delivers an array of query results
            console.log(result.columns); // delivers an array of names of objects getting returned
          }
        );
      }

    }
  );

};


//creates new Google Strategy/Facebook Strategy and passes along clientID/secret from googleConfig/facebookConfig (both obtained from respective Dev Console)
passport.use(new GoogleStrategy(googleConfig, function (accessToken, refreshToken, profile, done) {
  saveUser(accessToken, refreshToken, profile, done);
  NEO_saveUser(accessToken, refreshToken, profile, done);
}));

passport.use(new FacebookStrategy(facebookConfig, function (accessToken, refreshToken, profile, done) {
  saveUser(accessToken, refreshToken, profile, done);
}));

//express routes that send user authentication; upon successful authentication from FB/Google, user is sent back to callback url
authRouter.get('/google', passport.authenticate('google', {
  scope: 'profile'
}));
//after successful authentication, user is sent back to homepage
authRouter.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), function (req, res) {
  console.log("req user", req.user);
  // Successful authentication, redirect home.
  res.redirect('/');
});

authRouter.get('/facebook', passport.authenticate('facebook'));

authRouter.get('/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/'}), 
  function(req, res){
    // Successful authentication, redirect home.
    res.redirect('/');
});

module.exports = authRouter; 

