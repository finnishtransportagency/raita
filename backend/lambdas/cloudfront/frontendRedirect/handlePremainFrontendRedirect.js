'use strict';

function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var cookies = request.cookies;

  const originalUri = request.uri;
  // fix for serving premain env under /premain
  request.uri = request.uri.replace('/premain/', '/');
  request.uri = request.uri.replace('/premain', '/');

  var index = request.uri === '/' || request.uri === '/reports.html';
  var isFile = request.uri.split('.').length > 1;

  if (!index && isFile) {
    return request;
  }

  /* Check for return cookie, if present then proceed with request */
  var isReturnedRequest = cookies && cookies['Return'];
  if (isReturnedRequest) {
    return request;
  }
  var host = headers.host && headers.host.value;
  if (!host) {
    return request;
  }
  var encodedRedirectUrl = encodeURIComponent(`${originalUri}`);
  var response = {
    statusCode: 302,
    statusDescription: 'Found',
    headers: {
      location: {
        value: `https://${host}/api/return-login?redirect_url=${encodedRedirectUrl}`,
      },
    },
  };
  return response;
}
