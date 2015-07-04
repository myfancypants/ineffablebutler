var express = require('express');
var app = express();
var userlistRouter = express.Router();
var NEO_db = require('../config/neodb');

userlistRouter.get('/', function (req, res) {
 
  NEO_db.cypherQuery(
    'MATCH (user: User) RETURN user.displayName, user.loginId, user.loginMethod',
     function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log("USERS", result.data); // delivers an array of query results
      console.log(result.columns); // delivers an array of names of objects getting returned

      res.send({userlist: result.data});

  });

});

userlistRouter.post('/friends/', function (req, res) {
 
  var username1 = req.body.username;

  console.log("BODY", username1);

  NEO_db.cypherQuery(
     'MATCH (user1: User {displayName: \'' + username1 + '\'})-[:Friends]-(user2: User) RETURN user2',
     function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log("FRIENDS", result.data); // delivers an array of query results
      console.log(result.columns); // delivers an array of names of objects getting returned

      res.send({friendslist: result.data});

  });

});

userlistRouter.post('/', function (req, res) {

  var username1 = req.body.user1;
  var username2 = req.body.user2; 

  NEO_db.cypherQuery(
    'MATCH (user1: User {displayName: \'' + username1 + '\'})-[:Friends]-(user2: User {displayName: \'' + username2 + '\'}) RETURN user1, user2',
     function (err, result) {
      if (err) {
        return console.log(err);
      }
      console.log(result.data); // delivers an array of query results
      console.log(result.columns); // delivers an array of names of objects getting returned

      if(result.data.length === 0) {
        //console.log(result.data);

        NEO_db.cypherQuery(

          'MATCH (user1: User) where user1.displayName=\'' + username1 + '\''
          + ' MATCH (user2: User) where user2.displayName=\'' + username2 + '\''
          + ' MERGE (user1)-[r:Friends]-(user2)'
          + ' RETURN user1, user2, r',

          function (err, result) {
            if (err) {
              return console.log(err);
            }
            console.log("CREATED R", result.data); // delivers an array of query results
            console.log(result.columns); // delivers an array of names of objects getting returned

     
            res.send({friends: result.data});


        });

      }
      else
      {
          NEO_db.cypherQuery(
          'MATCH (user1: User {displayName: \'' + username1 + '\'})-[r:Friends]-(user2: User {displayName: \'' + username2 + '\'}) DELETE r RETURN user1, user2',

          function (err, result) {
            if (err) {
              return console.log(err);
            }

            console.log("DELETED R", result.data); // delivers an array of query results
            console.log(result.columns); // delivers an array of names of objects getting returned

            res.send({friends: result.data});

        }); 
      }

  });

});

module.exports = userlistRouter;
