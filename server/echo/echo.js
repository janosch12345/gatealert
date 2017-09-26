"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-gateAlertServer';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients = [ ];

var alarm = {
  "type" : "alarm",
  "data" : {
    "title" :"RFID Finkenzeller",
    "available" : "true",
    "medianumber": "900000001",
    "signature" : "STM 250 JKI 11"
  }
}
/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});
server.listen(webSocketsServerPort, function() {
  console.log((new Date()) + " Server is listening on port "
      + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket
  // request is just an enhanced HTTP request. For more info 
  // http://tools.ietf.org/html/rfc6455#page-6
  httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
  console.log((new Date()) + ' Connection from origin '
      + request.origin + '.');

  // accept connection - you should check 'request.origin' to
  // make sure that client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin); 
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  
  console.log((new Date()) + ' Connection accepted.');


  // user sent some message
  connection.on('message', function(message) {
    if (message.type === 'utf8') { // accept only text
    // first message sent by user is their name
    console.log(message);
      
        if (message.utf8Data === "alarm"){
          console.log("request for alarm")
          for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(JSON.stringify(alarm));
          }
          
        } else if (message.utf8Data === "randomalarmon"){
          console.log("request for randomalarm")
          timeoutId = setTimeout(randomAlarm, Math.floor(Math.random() * 10) * 1000, 'funky');
          
        } else if (message.utf8Data === "status"){
          console.log("request for status")
          for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(JSON.stringify({"type":"status", "status":(Math.floor(Math.random() * 2) === 0? "off":"on")}));
          }
         } else if (message.utf8Data === '{"status":"turnOn"}'){
          console.log("request for status")
          for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(JSON.stringify({"type":"status", "status":"on"}));
          }
         } else if (message.utf8Data === '{"status":"turnOff"}'){
          console.log("request for status")
          for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(JSON.stringify({"type":"status", "status":"off"}));
          }
          
        } else if (message.utf8Data === "randomalarmoff"){
          console.log("request for randomalarmoff")
          clearTimeout(timeoutId);
          
        } else {
          //just echo the incoming data
          // broadcast message to all connected clients
          //var json = JSON.stringify({ type:'message', data: "foo" });
          for (var i=0; i < clients.length; i++) {
            clients[i].sendUTF(message.utf8Data);
          }
        }
        
     
    }
  });

  // user disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer "
          + connection.remoteAddress + " disconnected.");

    // remove user from the list of connected clients
    console.log(index);
    clients.splice(index, 1);
    //console.log(clients);
  });
});

var timeoutId; 
function randomAlarm(arg) {
  for (var i=0; i < clients.length; i++) {
    clients[i].sendUTF(JSON.stringify(alarm));
  }
  timeoutId = setTimeout(randomAlarm, Math.floor(Math.random() * 10) * 1000 + 10000, 'funky');
}


