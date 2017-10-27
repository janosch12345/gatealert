"use strict";
var debug = true;
//external ressources
var net = require('net');
var mysql = require('mysql');
var lms = require('./lms.js');
var Main = require('./main.js');
var config = require('./config');

var allowedClients = config.gates.map(function(g){return g.host});

var dbConnection = mysql.createConnection(config.alarmDB);


// preconfigured dummy items which are also tagged with rfid
// they are triggered by specialRegex1 and specialRegex2 from config.js
// or if no medianumber is found broadcasted as unknown object
var korb = {
  msgType: "alarm",
  medianumber: "123",
  signature: "Korb",
  title: "Korb",
  available: "true"
}
var unknown = {
  msgType: "alarm",
  medianumber: "Unbekannt",
  signature: "Unbekannt",
  title: "Unbekannt",
  available: "true"
}

var testNotification = "0200400022001300010035030008e00401500a203fa300090432010421323131303336343300000000f70000004445444932352d45000000360000000004fe47";
//var testNotification2 = "020087002200730002003e030008e00401001158c5c5000904320101113036303032333033000000007e000000444544f232352d4500000036000000001606929a01c755810002003e030008e00401001158c5c5000904320101113036303032333033000000007e000000444544f232352d450000003600000000160692f901c75581000257cf";

var notificationRegex = config.notificationRegex;
var specialRegex1 = config.korbRegex1;
var specialRegex2 = config.korbRegex2;
var medianumberRegex = config.medianumberRegex;

var notificationServerHost = config.notificationServer.host;
var notificationServerPort = config.notificationServer.port;

function initNotificationServer() {
  net.createServer(function (sock) {
    sock.setEncoding('hex');

    if (allowedClients.indexOf(sock.remoteAddress) === -1) {
      log("blocked connection attempt from " + sock.remoteAddress);
      sock.destroy();
    } else {
      // We have a connection - a socket object is assigned to the connection automatically
      log('CONNECTION OPENED: ' + sock.remoteAddress + ':' + sock.remotePort);

      // Add a 'data' event handler to this instance of socket
      sock.on('data', function (data) {
        log(' ALARM <= ' + sock.remoteAddress + ': ' + data + '  (' + data.length + ')');
        handleNotification(data);
        //getMedianumbers(data);
      });

      // Add a 'close' event handler to this instance of socket
      sock.on('close', function (data) {
        log('CONNECTION CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
      });
    }

  }).listen(notificationServerPort, notificationServerHost);
  log('listening on :' + notificationServerHost + ":" + notificationServerPort);

  // testmessage
  //handleNotification(testNotification)
}

/**
 * saving an alarm in a corresponding database
 * @param {type} alarm
 * @returns {undefined}
 */
function saveAlarm(alarm){
  
  if (config.alarmDB.saveAlarms === false)
    return 
  
  dbConnection = mysql.createConnection(config.alarmDB);
  dbConnection.connect();
 
  // alarm = {medianumber : medianumber, uid : uid, signature : signature, status: available, title: title}
  dbConnection.query('INSERT INTO alarms SET ?', alarm, function (error, result) {
    if (error) console.error(error);
    else log(result);
  });
 
  dbConnection.end();
}

/**
 *  returns a char from a given hex-String
 * @param {type} bs
 * @returns {String}
 */
function getCharFromHexString(bs) {
  // f.e. bs = "44" 
  // first parse hex to decimal 44h -> 68d by parseInt(hex,16)
  // then String.fromCharCode(dec) to get ASCII chararcter
  return String.fromCharCode(parseInt(bs, 16));
}

/**
 * handles the alarm/notification by 
 * comparing data to regex and extracting uid, medianumber
 * if a valid medianumber is found metadata will be retrieved from library management system
 * save alarm in a database if configured
 * @param {type} notification
 * @returns {undefined}
 */
function handleNotification(notification) {
  
  notification = notification.toUpperCase();
  
  var count = 0;
  var matches;
  while (matches = notificationRegex.exec(notification)) {
    count++;
    var mn = "", uid = "";
    mn += getCharFromHexString(matches[3]);
    mn += getCharFromHexString(matches[8]);
    mn += getCharFromHexString(matches[7]);
    mn += getCharFromHexString(matches[6]);
    mn += getCharFromHexString(matches[5]);
    mn += getCharFromHexString(matches[12]);
    mn += getCharFromHexString(matches[11]);
    mn += getCharFromHexString(matches[10]);
    mn += getCharFromHexString(matches[9]);
    uid += matches[1];
      
    log("ALARM ---> " + uid + " " + mn + ' <---');
    
    if (medianumberRegex.test(mn)){
      lms.getMetadata(mn, uid, function (err, meta) {
        if (err)
          return console.error(err);

        let alarm = {
          "type": "alarm",
          "data": {
            "title": meta.title,
            "available": meta.available,
            "medianumber": meta.medianumber,
            "signature": meta.signature
          }
        }
        
        // tell listening brwoser clients
        Main.broadcast(JSON.stringify(alarm));
        try {
          saveAlarm({medianumber : meta.medianumber, uid : meta.uid, signature : meta.signature, status: meta.available, title: meta.title});
        } catch (exc){
          log("error on saving to AlarmDB", exc)
        }
      });
    }
    
  }
  // there was no valid medianumber we check for special cases
  if (count === 0) {
    //Körbe und andere Sachen
    if (specialRegex1.exec(notification) !== null || specialRegex2.exec(notification) !== null) {
      korb.date = new Date();
      Main.broadcast(JSON.stringify(korb));
    } else {
      unknown.date = new Date();
      Main.broadcast(JSON.stringify(unknown));
    }
  }
}

/**
 * logging helper
 * @param {type} msg
 * @param {type} msgObject
 * @returns {undefined}
 */
function log (msg,msgObject){
  if (debug)
    console.log((new Date()) + " NOTIFICATIONSRV:", msg);
  if (msgObject)
    console.log(msgObject);
}

dbConnection.on('error', function(err) {
  log("Error on mysql connection",err)
});

// init is called by main
exports.init = initNotificationServer;
// test alarm triggered by browser client
exports.triggerTestAlarm = function(){  handleNotification(testNotification) }
