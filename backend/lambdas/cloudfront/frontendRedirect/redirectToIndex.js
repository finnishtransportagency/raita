'use strict';
function handler(event) {
  var request = event.request;
  request.uri = '/index.html';
  return request;
}
