var express = require('express');
var app = express();
var userRouter = express.Router();
var UserDB = require('../models/user');
var NEO_db = require('../config/neodb');

var authMethods = [{
  name: 'Google',
  url: '/auth/google'
}, {
  name: 'Facebook',
  url: '/auth/facebook'
}];

//creating session routes
userRouter.get('/', function (req, res) {
  console.log("request user ", req.user);
  if (req.user) {
    UserDB.find({
      displayName: req.user.displayName
    }).exec(function (err, user) {
      if (err) {
        console.log('Error: ', err);
      }
      console.log('exec user: ', user);
      res.status(200).send({
        id: user[0]._id,
        displayName: user[0].displayName,
        routes: user[0].routes
      });
    });
    //logged in
    console.log("loggedin");
  } else {
    //not logged in
    //401 not authenticated
    console.log("not loggedin");
    res.status(401).send({
      error: "not authenticated",
      authMethods: authMethods
    });
  }
});
userRouter.put('/', function (req, res) {
  var routes = req.body.routes;
  var routeLength = routes.length;
  var routeObj = routes[routeLength - 1].route;
  var routeDirection = [ routeObj[0], routeObj[2][0] ]; // index 0 is the route name, index 1 is the route direction

  NEO_db.cypherQuery(
    'match (route:Route {name: {routeName}})-[r]-() where type(r) =~ {direction} return type(r)', {
      routeName: routeDirection[0],
      direction: '.*' + routeDirection[1] + '.*'
    }, function(error, result){
      if( error ) return console.log(error);

      if( result.data.length ){
        NEO_db.cypherQuery(
          'match (route:Route {name: {routeName}}) match (user: User {displayName: {displayName}}) merge (user)-[:`' + result.data[0] + '`]->(route)', {
            displayName: req.body.displayName,
            routeName: routeDirection[0]
          }, function(error, result){
            if( error ) return console.log(error);
            console.log('DIS MEAN DA RELATIONSHIP WAS CREATED YO------->', result);
          }
        );
      }
    }
  );

  UserDB.findOneAndUpdate({
    displayName: req.body.displayName
  }, {
    routes: req.body.routes
  }, null, function (err, user) {
    if (err) {
      console.log("put error:", err);
    }
    // console.log('exec user: ', user);
    res.status(200).send({
      id: user._id,
      displayName: user.displayName,
      routes: user.routes
    });
  });
});

module.exports = userRouter;
