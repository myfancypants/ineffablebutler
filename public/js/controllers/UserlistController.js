muniButlerApp.controller('UserlistController', function ($scope, $location, $http, User, Autocomplete) {

  $scope.inUserlist = false;
  $scope.username = User.displayName;

  $scope.befriend = function(userName1, userName2) {
    
    if(userName1 === userName2)
      return;

    if(userName2.charAt(userName2.length - 1) === '*') //remove last char if it is a * (assume no usernames end in *)
    {
      userName2 = userName2.substring(0, userName2.length - 1);
    }

    $http.post('/api/userlist/', {user1: userName1, user2: userName2}).
    success(function(data, status, headers, config) {
    
    }); 

    $scope.getUserlist();
  }; 

  //change page function
  $scope.routeToUserlist = function() {

    if($scope.inUserlist === false)
    {
      $location.path('/userlist');
      $scope.inUserlist = true;
    }
    else
    {
      $location.path('/');
      $scope.inUserlist = false;
    }
    
  };

  $scope.getUserlist = function () {

    $scope.userlist = $http.get('/api/userlist/').success(function (data) {
      $scope.userlist = data.userlist;

        //should use get but too lazy to parse url
        $http.post('/api/userlist/friends/', {username: $scope.username}).
        success(function(data, status, headers, config) {

          var friendsObj = {};

          for(var i = 0; i < data.friendslist.length; i++) {
            friendsObj[data.friendslist[i].displayName] = true;
          }

          for(var i = 0; i < $scope.userlist.length; i++) {
            if(friendsObj.hasOwnProperty($scope.userlist[i][0]) === true) {
              $scope.userlist[i][0] += '*';
            }
          }

        });       

      //console.log($scope.userlist);
      //setTimeout($scope.getUserlist, 30000);
    });
  };
 
});