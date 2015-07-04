var muniButlerApp = angular.module('muniButler', ['ngMap', 'ngResource', 'ngRoute', 'ngMaterial'])
.config(function($routeProvider, $httpProvider) {
  $httpProvider.defaults.withCredentials = true;


  $routeProvider
    .when('/', {
      templateUrl: 'views/home.html',
      controller: 'HomeController'
    })
    .when('/routes', {
      templateUrl: 'views/routes.html',
      controller: 'RoutesController'
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: ''
    })
    .when('/userlist', {
      templateUrl: 'views/userlist.html',
      controller: ''
    })  
    .otherwise({redirectTo: '/'});
    // Your code here
})

