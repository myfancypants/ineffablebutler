//get muni routes

var getRequest = require('./getRequest.js');

var NEO_db = require('../config/neodb'); 



var getRouteStops = function(routeId, runsArray) {

  for(var i = 0; i < runsArray.length; i++) {

    var callbackWrapper = function(runId) {
      return function(error, response, body) {
        if (!error && response.statusCode === 200) {
          
          body = JSON.parse(body);

          var firstStop = {stopCode : body.items[0].id, name : body.items[0].display_name};

          console.log(routeId, runId, firstStop);

          NEO_db.cypherQuery(

          'MERGE (route: Route { name: {routeName} })' 
          + ' MERGE (stop: Stop { stopCode: {stopCode} })' 
          + ' MERGE (route)-[ r:`' + routeId + '_' + runId + '` ]->(stop)' 
          + ' RETURN route, stop, r',
          // 'CREATE (route: Route { name: {routeName} })-[ r: `' + routeId + '_' + runId + '` ]->(stop: Stop { name: {stopName} , stopCode: {stopCode} })'
          // + ' RETURN route, stop, r',
          {
            routeName: routeId,
            stopName: firstStop.name,
            stopCode: firstStop.stopCode
          }, function (err, result) {
            if (err) {
              return console.log(err);
            }
            console.log("route data: ", result.data); // delivers an array of query results
            console.log("route columns: ", result.columns); // delivers an array of names of objects getting returned

          });

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
