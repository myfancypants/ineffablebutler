/*
 ** 511xmlfetcher.js
 ** Used for converting SF-MUNI routes XML file into JSON, and then parsing all 164 XML route files from API to store the StopCodes in DB.
 */

var http = require('http');
var express = require('express');
var app = express();
var parseString = require('xml2js').parseString;
var fs = require('fs');
var db = require('../config/db');
var routeCodes = require('../models/routeCodes');

var NEO_db = require('../config/neodb'); 

  /**************
   ** VARIABLES **
   ***************/

//511 api token = token=62e8fbd1-9e0e-4a3c-a906-d5d860daeb83
//new one can be obtained at http://www.511.org/developer-resources_transit-api.asp

//mainUrl XML file for all SF-MUNI routes
var mainUrl = 'http://services.my511.org/Transit2.0/GetRoutesForAgency.aspx?token=62e8fbd1-9e0e-4a3c-a906-d5d860daeb83&agencyName=SF-MUNI';

var routeOptions = {
  hostname: 'services.my511.org',
  path: '/Transit2.0/GetRoutesForAgency.aspx?token=62e8fbd1-9e0e-4a3c-a906-d5d860daeb83&agencyName=SF-MUNI'
};

//Handles all SF-MUNI XML file request
//XML file is then parsed using parseString(xml2js)
var RouteList = http.get(routeOptions, function (response) {
  var completeResponse = "";
  response.on('data', function (chunk) {
    completeResponse += chunk;
  });
  response.on('end', function () {
    //xml2js parses result of get request, which is then sent to parseStopCodes
    parseString(completeResponse, function (err, result) {
      parseStopCodes(result);
    });
  }).on('error', function (e) {
    console.log('problem with request');
  });
});

  /**************
   ** FUNCTIONS **
   ***************/

//parseStopCodes takes parsed SF-MUNI XML file, and creates an array containing all Inbound and Outbound routes of 82 routes
//XML get request is then made for each route; these are also converted to JSON using xml2js
var parseStopCodes = function (mainRoute) {
  var urls = [];

  //runs for loop through main SF-MUNI XML file and populates array with 164 511.org API url parameters (to be attached to hostname/path)
  for (var i = 0; i < mainRoute.RTT.AgencyList[0].Agency[0].RouteList[0].Route.length; i++) {
    urls.push(mainRoute.RTT.AgencyList[0].Agency[0].RouteList[0].Route[i].$.Code + "~Outbound");
    urls.push(mainRoute.RTT.AgencyList[0].Agency[0].RouteList[0].Route[i].$.Code + "~Inbound");
  }

  //now send get request to API with each url in array
  for (var i = 0; i < urls.length; i++) {
    
    var options = {
      hostname: 'services.my511.org',
      path: '/Transit2.0/GetStopsForRoute.aspx?token=62e8fbd1-9e0e-4a3c-a906-d5d860daeb83&routeIDF=SF-MUNI~' + urls[i]
    }

    //make get request to 511 API after attaching url parameter to hostname/path
    //on success, the result is passed to saveJsontoDb (which saves it to database)
    var xmlReq = http.get(options, function (response) {
      var completeResponse = "";
      response.on('data', function (chunk) {
        completeResponse += chunk;
      });
      response.on('end', function () {
        parseString(completeResponse, function (err, result) {
          //saveJsonToDb(result);
          console.log("calling savejson neodb");
          saveJsonToNeoDb(result);
        });
      }).on('error', function (e) {
        console.log('problem with request');
      });
    });
  }
}

//saves route to Database if stop codes are valid
//goes through JSON file until StopCodes are found
  //new route is created to be saved in DB, containing:
    //routeName: Route Code - ex. 28R, 33, etc.
    //routeDir: Inbound or Outbound
    //routeStop: array of all stopCodes for specific routeName
var saveJsonToDb = function (json) {
  console.log("JSON route data ", json);
  if (json.RTT) {
    var path = json.RTT.AgencyList[0].Agency[0].RouteList[0].Route[0];
    var pathStop = path.RouteDirectionList[0].RouteDirection[0].StopList[0].Stop;
    var stops = [];
    for (var i = 0; i < pathStop.length; i++) {
      // console.log(pathStop[i].$)
      stops.push(pathStop[i].$);
    }
    var routeA = new routeCodes({
      routeName: path.$.Code,
      routeDir: path.RouteDirectionList[0].RouteDirection[0].$.Code,
      routeStop: stops
    });
    
    console.log("routeA", routeA);

    routeA.save(function (err, route) {
      if (err) console.log('err', err);
      console.log("route saved", route);
    });
  }
}


var saveJsonToNeoDb = function (json) {
  console.log("JSON route data");
  if (json.RTT) {
    var path = json.RTT.AgencyList[0].Agency[0].RouteList[0].Route[0];
    var pathStop = path.RouteDirectionList[0].RouteDirection[0].StopList[0].Stop;

    // NEO_db.cypherQuery(
    //   'MERGE (route: Route { routeName: {routeName} }) RETURN route',
    //   {
    //     routeName: path.$.Code
    //   }, function (err, result) {
    //     if (err) {
    //       return console.log(err);
    //     }
    //     console.log("route data: ", result.data); // delivers an array of query results
    //     console.log("route columns: ", result.columns); // delivers an array of names of objects getting returned

    //     if(result.data.length > 0) {
    //       var appendLabel;

    //       if(path.RouteDirectionList[0].RouteDirection[0].$.Code === 'Inbound')
    //       {
    //         appendLabel = '_INBOUND';
    //       }
    //       else if(path.RouteDirectionList[0].RouteDirection[0].$.Code === 'Outbound')
    //       {
    //         appendLabel = '_OUTBOUND';
    //       }

    //       for (var i = 1; i < pathStop.length; i++) {

    //        //console.log("a for Leon: ", pathStop[i - 1].$.StopCode);
    //        //console.log("b for Leon: ", pathStop[i].$.StopCode);
    //        //console.log("c for Leon: ", pathStop[i - 1].$.name);
    //        //console.log("d for Leon: ", pathStop[i].$.name);
    //        //console.log("e for Leon: ", path.$.Code + appendLabel);

    //         NEO_db.cypherQuery(
    //           'MERGE (stop1: Stop { stopCode: {stopCode1}, name: {name1} })' +
    //           'MERGE (stop2: Stop { stopCode: {stopCode2}, name: {name2} })' +
    //           'CREATE (stop1)-[ r: {newRoute} ]->(stop2)' +
    //           'RETURN stop1, stop2, r',
    //           {
    //             stopCode1: pathStop[i - 1].$.StopCode,
    //             stopCode2: pathStop[i].$.StopCode,
    //             name1: pathStop[i - 1].$.name,
    //             name2: pathStop[i].$.name,
    //             newRoute: path.$.Code + appendLabel
    //           }, function (err, result) {
    //             if (err) {
    //               return console.log(err);
    //             }
    //             console.log("stop data: ", result.data); // delivers an array of query results
    //             console.log("stop cols: ", result.columns); // delivers an array of names of objects getting returned
    //           }
    //         );

    //       }

    //     }
    //   }
    // );



          var appendLabel;

          if(path.RouteDirectionList[0].RouteDirection[0].$.Code === 'Inbound')
          {
            appendLabel = 'INBOUND_';
          }
          else if(path.RouteDirectionList[0].RouteDirection[0].$.Code === 'Outbound')
          {
            appendLabel = 'OUTBOUND_';
          }


          var insertStops = function(i) {

           if(i === pathStop.length)
            return;

           console.log("a for Leon: ", pathStop[i - 1].$.StopCode);
           console.log("b for Leon: ", pathStop[i].$.StopCode);
           console.log("c for Leon: ", pathStop[i - 1].$.name);
           console.log("d for Leon: ", pathStop[i].$.name);
           console.log("e for Leon: ", (appendLabel + path.$.Code.toString()) );

            NEO_db.cypherQuery(
              'MERGE (stopOne: Stop { stopCode: {stopCode1}, name: {name1} })' +
              ' MERGE (stopTwo: Stop { stopCode: {stopCode2}, name: {name2} })' +
              ' CREATE (stopOne)-[ r:' +  (appendLabel + path.$.Code.toString()) + ' ]->(stopTwo)' +
              ' RETURN stopOne, stopTwo, r',
              {
                stopCode1: pathStop[i - 1].$.StopCode,
                stopCode2: pathStop[i].$.StopCode,
                name1: pathStop[i - 1].$.name,
                name2: pathStop[i].$.name
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
}


