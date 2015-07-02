//get muni routes

var getRequest = require('./getRequest.js');

var NEO_db = require('../config/neodb'); 



var getRouteStops = function(routeId, runsArray) {

  for(var i = 0; i < runsArray.length; i++) {

    var callbackWrapper = function(runId) {
      return function(error, response, body) {
        if (!error && response.statusCode === 200) {
          
          body = JSON.parse(body);

          var pathStop = [];
          for(var i = 0; i < body.items.length; i++) {
            pathStop.push({stopCode : body.items[i].id, name : body.items[i].display_name}); 
          }

          //console.log(routeId, runId, pathStop);
   
          var insertStops = function(i) {

           if(i === pathStop.length)
            return;

            NEO_db.cypherQuery(

              //'MATCH (stopOne: Stop { stopCode: {stopCode1} })'
              //+ ' CREATE (stopTwo: Stop { name: {name2} , stopCode: {stopCode2} })<-[ r: `' + routeId + '_' + runId + '` ]-(stopOne)'
              //+ ' RETURN stopOne, stopTwo, r',

              'MERGE (stopOne: Stop { stopCode: {stopCode1}, name: {name1} })'
              + ' MERGE (stopTwo: Stop { stopCode: {stopCode2}, name: {name2} })'
              + ' MERGE (stopOne)-[ r: `' + routeId + '_' + runId + '` ]->(stopTwo)'
              + ' RETURN stopOne, stopTwo, r',   
              {
                stopCode1: pathStop[i - 1].stopCode,
                stopCode2: pathStop[i].stopCode,
                name1: pathStop[i - 1].name,
                name2: pathStop[i].name
              }, function (err, result) {
                if (err) {
                  return console.log(err);
                }
                console.log("stop data: ", result.data); // delivers an array of query results
                console.log("stop cols: ", result.columns); // delivers an array of names of objects getting returned

                insertStops(i + 1);
              }
            );

          };

          insertStops(1);

        }
        else {
          throw error; //will just throw null if no error and status !== 200
        }
        
      };
    };

    getRequest("http://proximobus.appspot.com/agencies/sf-muni/routes/" + routeId + "/runs/" + runsArray[i] + "/stops", "", callbackWrapper(runsArray[i])); 

  }

};


var getRouteRuns = function(routesArray) {

  for(var i = 0; i < routesArray.length; i++) {

    getRequest("http://proximobus.appspot.com/agencies/sf-muni/routes/" + routesArray[i] + "/runs", "", function(error, response, body) {

      if (!error && response.statusCode === 200) {
        body = JSON.parse(body);

        var runsArray = [];
        for(var j = 0; j < body.items.length; j++) {
          runsArray.push(body.items[j].id); 
        }

        getRouteStops(body.items[0].route_id, runsArray);
      }
      else {
        throw error; //will just throw null if no error and status !== 200
      }
      
    }); 

  }

};


var getMuniRoutes = function() {

  getRequest("http://proximobus.appspot.com/agencies/sf-muni/routes", "", function(error, response, body) {

    if (!error && response.statusCode === 200) {
      body = JSON.parse(body);

      var routesArray = [];
      for(var i = 0; i < body.items.length; i++) {
        routesArray.push(body.items[i].id); 
      }

      getRouteRuns(routesArray);
    }
    else {
      throw error; //will just throw null if no error and status !== 200
    }
    
  });

};


getMuniRoutes();


module.exports = getMuniRoutes;