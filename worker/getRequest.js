//function to execute a get request using the passed in url, parameters, and callback

var request = require('request');

var getRequest = function(url, parameters, callback) {

  var req_url = url;
  req_url += ".json?";
  req_url = (parameters !== undefined && parameters !== null && parameters !== "") ? req_url + parameters : req_url;

  request(req_url, callback);
};

module.exports = getRequest;