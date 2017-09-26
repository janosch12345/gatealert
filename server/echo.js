var http = require('http');

http.createServer(function (request, response) {

  response.writeHead(200);

  request.on('data', function (message) {
    console.log("data"+message)
    response.write(message);

  });

  request.on('end', function () {

    response.end();
  });
}).listen(8080);
console.log("done")