muniButlerApp.factory('GoogleMaps', function ($q) {
  var googleMaps = {};
  googleMaps.getRouteOptions = function (from, to) {
    /*
    return options = {
      routes: [{
        lines: ['38R', '6th Ave & Geary', 'Inbound'],
        duration: '28 min'
      },
      {
        lines: ['38', '6th Ave & Geary', 'Inbound'],
        duration: '44 min'
        }
      ]
    }


    */

    console.log(from, to);

    return $q(function (resolve, reject) {

      console.log(from, to);

      // Create Google Maps Direction Service object
      var directions = new google.maps.DirectionsService();
      // Create the Directions Request Object needed to request directions from Google Maps API
      var directionsRequest = {
        origin: from,
        destination: to,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
          modes: [google.maps.TransitMode.BUS]
        },
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        durationInTraffic: true,
        provideRouteAlternatives: true,
        avoidHighways: false,
        avoidTolls: false
      };
      // Create the Google Maps Directions Renderer object which will be used to display
      // directions results on the map of routes.html
      var directionsDisplay = new google.maps.DirectionsRenderer();
      // Create the map options object to set map settings
      var mapOptions = {
        zoom: 18,
        center: new google.maps.LatLng(37.783724, -122.408978)
      };
      // Create the map with the mapOptions object
      var map = new google.maps.Map(document.getElementById('routes-map'), mapOptions);
      directionsDisplay.setMap(map);
      // Make the call to get the route options from Google Maps API
      directions.route(directionsRequest, function (results, status) {
        if (!status === "OK") {
          throw status;
        }
        // render the directions on the map
        directionsDisplay.setDirections(results);
        // array to store all possible direction route objects
        var routes = [];
        // iterate through possible routes to take
        angular.forEach(results.routes, function (route, index, obj) {
          // create an object to store all info related to this route
          // it will be added to the options.routes array
          var routeObj = {};
          // define the array to store tuples of bus line numbers, stop names, and directions
          // for the given route
          routeObj.lines = [];
          routeObj.duration = route.legs['0'].duration.text;
          // iterate over the steps in each route to find the bus line(s)
          // in the given route option and the direction (inbound or outbound)
          var steps = route.legs['0'].steps;
          for (var key in steps) {
            if (steps[key].travel_mode === "TRANSIT") {
              var busNumber = route.legs['0'].steps[key].transit.line.short_name;
              var stopName = route.legs['0'].steps[key].transit.departure_stop.name;
              var endName = route.legs['0'].steps[key].transit.arrival_stop.name;

              // Find out if the bus is heading 'Inbound' or 'Outbound'
              var arrivalLocation = route.legs['0'].steps[key].transit.arrival_stop.location.F;
              var departureLocation = route.legs['0'].steps[key].transit.departure_stop.location.F;
              var direction = '';

              if (arrivalLocation > departureLocation) {
                direction = "Inbound";
              } else {
                direction = "Outbound";
              }
              // Check to make sure only steps involving busses are added to the route.lines array
              // This is to prevent adding a "WALKING" travel_mode route to the route.lines array
              if (busNumber) {
                routeObj.lines.push([busNumber, stopName, direction, endName]);
              }
            }
          }
          // Add route object to options.routes array
          if (routeObj.lines.length > 0){
            routes.push(routeObj);
          }
        });

        if (routes.length > 0){
          resolve(routes);
        } else {
          reject("No options found");
        }

      });
    });
  }; // end of getRouteOptions
return googleMaps;
});
