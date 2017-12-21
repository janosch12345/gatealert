#!/usr/bin/node

"use strict";

var debug = true; 

var config = require('./config');

// port where we'll run the websocket server
var webSocketsServerPort = config.mainServer.port;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

// cronjob like scheduler to upload counter values
var schedule = require('node-schedule');

// Gate client class and notification server
var Gate = require('./gateClass.js');
var NotificationServer = require('./notificationServer.js');

/**
 * Global variables
 */
// list of currently connected clients (users)
var clients = [];

// list of configured gates
var gates = [];
var peopleCounterIntervalId = false;

/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});
server.listen(webSocketsServerPort, function () {
  log("WS Server is listening on port "
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
wsServer.on('request', function (request) {
  
  // prevent unknown clients 
  if (!clientIsPermitted(request.remoteAddress)){
    log('WS Connection rejected remote: ' + request.remoteAddress);
    request.reject();
    return;
  }
  
  log('WS Connection from origin '+ request.origin + '. Address: ' + request.remoteAddress);
  
  var connection = request.accept(null, request.origin);
  // we need to know client index to remove them on 'close' event
  //console.log(connection);
  
  var index = clients.push(connection) - 1;
  log('WS Connection accepted.');
  
  connection.on('message', function (message) {
    
    if (message.type === 'utf8') { // accept only text
      log("WS <= " + JSON.stringify(message));
      
      // parse msg.utf8Data to JSON
      let msg = { "type" : undefined };
      try { 
        msg = JSON.parse(message.utf8Data);
      } catch (exc) {
        log("WS Error on JSON.parse",exc);
      }
      
      // on a new client the status of all gates is requested and broadcasted
      if (msg.type === "init"){

        // wait for all the gates to return their status, only on available gates
        Promise.all(gates.map(function(gate){/*if (gate.avail)*/ return gate.getAlarmStatus()}))
        .then(() => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        })
        .catch(() => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        });
                
      }
      
      // check availability of a gate,  triggered by click on button in ui
      if (msg.type === "gateCheck"){ 
          
        let singleGate = gates.find(function(gate){return msg.id === gate.id});

        singleGate.getAlarmStatus()
        .then( () => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        })
        .catch( () => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        });
        
      }
      
      // request to turn ON or OFF sound 
      if (msg.type === "status"){
        
        // request for sound change on ALL gates
        if (msg.all){  
          
          // wait for all the gates to set and return their new status, only on available gates
          Promise.all(gates.map(function(gate){ /*if (gate.avail)*/ return gate.setAlarmStatus(msg.toStatus)}))
          .then(() => {
            broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
          })
          .catch(() => {
            broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
          });;
            
        } 
        // request for sound change on a SINGLE gate, identified by gate.id, , only on available gates
        else if (msg.id){ 
          
          let singleGate = gates.find(function(gate){return msg.id === gate.id});
          
          if (singleGate.avail){
            singleGate.setAlarmStatus(msg.toStatus)
            .then( () => {
              broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
            })
            .catch( () => {
              broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
            })
          }
        }
      }

      // test and debug messages
      if (msg.type === "test") {
        if (msg.test === "on") {
          timeoutId = setTimeout(randomAlarm, Math.floor(Math.random() * 10) * 1000, 'funky');
        } else if (msg.test === "off"){
          clearTimeout(timeoutId);
        } else if (msg.test === "alarm"){
          testAlarm(); 
        } else if (msg.test === "peopleCounter"){
          //console.log(gates)
          Promise.all(gates.map(function(gate){if (gate.counter) return gate.getPeopleCounterValues()}))
          .then(() => {
            broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
          })
          .catch(() => {
            broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
          });
        }
      }
      // not yet implemented in add on
      if (msg.type === "getPeopleCounterValues"){

        // wait for all the gates to return their status, only on available gates
        Promise.all(gates.map(function(gate){if (gate.counter) return gate.getPeopleCounterValues()}))
        .then(() => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        })
        .catch(() => {
          broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
        });
                
      }
    }
    
    
    
  });

  // user disconnected
  connection.on('close', function (connection) {
    log("WS Peer "
            + connection.remoteAddress + " disconnected.");
    // remove user from the list of connected clients
    // clients.splice(index, 1);
    
  });
});


/**
 * init all gates configured in config 
 */
for (let i in config.gates){
  let aGate = new Gate(config.gates[i].host,config.gates[i].port, config.gates[i].id, config.gates[i].counter);
  // call for status of the gate
  
  aGate.init().then(() => {
    gates.push(aGate);
    log("init of Gate(" + config.gates[i].host +":"+config.gates[i].port + ") done: " + JSON.stringify(aGate.getInfo()));
    if (gates.length === config.gates.length && !peopleCounterIntervalId && config.peopleCounterReadingInterval != false){
      //peopleCounterIntervalId = setInterval(getPeopleCounterValues, config.peopleCounterReadingInterval);
      var j = schedule.scheduleJob(config.peopleCounterReadingInterval, getPeopleCounterValues);
      log("PeopleCounter scheduler started: " + config.peopleCounterReadingInterval);
    }
  }).catch( err => {
    
    gates.push(aGate);
    log("ERROR during init of Gate(" + config.gates[i].host +":"+config.gates[i].port + ") failed: " + JSON.stringify(err));
    if (gates.length === config.gates.length && !peopleCounterIntervalId && config.peopleCounterReadingInterval != false){
      //peopleCounterIntervalId = setInterval(getPeopleCounterValues, config.peopleCounterReadingInterval);
      //log("PeopleCounterPollingInterval started: " + peopleCounterIntervalId);
      var j = schedule.scheduleJob(config.peopleCounterReadingInterval, getPeopleCounterValues);
      log("PeopleCounter scheduler started: " + config.peopleCounterReadingInterval);
    }
  });
  
}

// 

/**
 * start the Notification server
 */
NotificationServer.init();


/*
 * Helpers
 */
function getGateStates(){
  return gates.map( function(gate){return gate.getInfo() });
}

function getPeopleCounterValues(){
  Promise.all(gates.map(function(gate){if (gate.counter) return gate.getPeopleCounterValues(config.alarmDB.savePeopleCounterValues)}))
  .then(() => {
    broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
  })
  .catch(() => {
    broadcast(JSON.stringify({"type":"status", "gates" : getGateStates() }));
  });
}


//// debugging messages
var timeoutId;
function randomAlarm(arg) {
  NotificationServer.triggerTestAlarm();
  timeoutId = setTimeout(randomAlarm, Math.floor(Math.random() * 10) * 1000 + 10000);
}

function testAlarm(arg) {
  NotificationServer.triggerTestAlarm();
}

/**
 * function that sends the given STRING to all listening ws-clients
 * @param {type} messageString
 * @returns {undefined}
 */
function broadcast(messageString) {
  log("WS Broadcasting: " + messageString);
  for (var i = 0; i < clients.length; i++) {
    try {
      clients[i].sendUTF(messageString);
    } catch (exception){
      log("WS Broadcasting error Client not available - removing from list.");
      clients.splice(i,1);
    }
    
  }
}

/**
 * 
 * @param {type} address
 * @returns {undefined}
 */
function clientIsPermitted(address){
  
  // pattern is part of address
  if (config.permittedClients.pattern.active === true){
    if (address.indexOf(config.permittedClients.pattern.pattern) > -1)
      return true;
  }
  
  // address is in list of permitted clients
  if (config.permittedClients.list.active === true){
    if (config.permittedClients.list.list.indexOf(address) > -1)
      return true;
  }
  
  return false;
}

function log (msg,msgObject){
  let d = new Date();
  let dString = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+ " " + ("0"+d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);
  
  if (debug)
    console.log(dString + " MAIN:", msg);
  if (msgObject)
    console.log(msgObject);
}

/*
 * exporting broadcast so loaded modules like gateClass can call it
 */
exports.broadcast = broadcast;
