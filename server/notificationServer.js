"use strict";
var debug = true;
//external ressources
var net = require('net');

var db = require('./db.js');
var lms = require('./lms.js');
var Main = require('./main.js');
var config = require('./config');

var allowedClients = config.gates.map(function(g){return g.host});
allowedClients.push("127.0.0.1");
allowedClients.push(config.notificationServer.host);
// preconfigured dummy items which are also tagged with rfid
// they are triggered by specialRegex1 and specialRegex2 from config.js
// or if no medianumber is found broadcasted as unknown object
const korb = {
  msgType: "alarm",
  medianumber: "123",
  signature: "Korb",
  title: "Korb",
  available: "true"
}
const unknown = {
  msgType: "alarm",
  medianumber: "Unbekannt",
  signature: "Unbekannt",
  title: "Unbekannt",
  available: "true"
}

const alarm = {
  "type": "alarm",
  "data": {
    "origin": undefined, 
    "title": undefined,
    "available": undefined,
    "medianumber": undefined,
    "signature": undefined
  }
}

var testNotification = "0200400022001300010035030008e00401500a203fa300090432010421323131303336343300000000f70000004445444932352d45000000360000000004fe47";
//var testNotification2 = "020087002200730002003e030008e00401001158c5c5000904320101113036303032333033000000007e000000444544f232352d4500000036000000001606929a01c755810002003e030008e00401001158c5c5000904320101113036303032333033000000007e000000444544f232352d450000003600000000160692f901c75581000257cf";

var notificationRegex = config.notificationRegex;
var specialRegex1 = config.specialRegex1;
var specialRegex2 = config.specialRegex2;
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
        log('NOTIFICATION <= ' + sock.remoteAddress + ': ' + data + '  (' + data.length + ')');
        handleNotification(data, sock.remoteAddress);
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
function handleNotification(notification, origin = "127.0.0.1") {

  // catching keepalive message 02000a006e0000004b69
  if (notification === "02000a006e0000004b69"){
    log("KEEPALIVE received");
    return false;
  }

  // retrieve informtion for origin of alarm
  let tmp = config.gates.find( gate => origin === gate.host );
  if (tmp && tmp.hasOwnProperty('id'))
    origin = tmp.id;
  

  // notific: 0200400022001300010035030008e00401500a203fa300090432010421323131303336343300000000f70000004445444932352d45000000360000000004fe47
  // matches: E00401500A203FA3000904320104213231313033363433,E00401500A203FA3,000904,320104213231313033   32,010421,32,31,31,30,33,36,34,33
  // regex:   (E004[0-9A-F]{12})(\d{6})(3\d|44|5A)([0-9]{6})(3\d)(3\d)(3\d)(3\d)(3\d|58)(3\d)(3\d)(3\d)
  notification = notification.toUpperCase();

  //let reg = /(E004[0-9A-F]{12})(\d{6})([0-9A-Z]{32})/g;
  
  var count = 0;
  var matches;
  while (matches = notificationRegex.exec(notification)) {
    
    count++;
    let uid = matches[1];

    let mn = "";
    // user memory 16 bytes but each byte encoded in hex 
    // 32010421323131303336343300000000
    let mem = matches[3];
    // split into pairs like 32 01 04 21 32 ...
    mem = mem.match(/(..?)/g);
    // grep medianumber from mem 32 ...
    // and convert it
    for (let index of config.notificationMedianumberIndex){ 
      mn += getCharFromHexString(mem[index])
    }    
    
    // Spielerei
    log("╔════════════ ALARM ( " + origin + " ) ════════════╗");
    log("║     " + uid + "      " + mn + Array(origin.length).fill(" ").join("") + '║ ');
    log("╚" + Array(origin.length).fill("═").join("") + "════════════════════════════════════╝");

    if (medianumberRegex.test(mn)){

      lms.getMetadata(mn, uid).then(meta =>{
        alarm.data.origin = origin,
        alarm.data.title = meta.title,
        alarm.data.available = meta.available,
        alarm.data.medianumber = meta.medianumber,
        alarm.data.signature = meta.signature
        
        
        // tell listening brwoser clients
        Main.broadcast(JSON.stringify(alarm));
        try {
          db.saveAlarm({medianumber : meta.medianumber, uid : meta.uid, signature : meta.signature, status: meta.available, title: meta.title});
        } catch (exc){
          log("error on saving to AlarmDB", exc)
        }
      }).catch(err => {
        log('Error while fetching metadata, broadcasting unknown alarm');        
        unknown.date = new Date();
        Main.broadcast(JSON.stringify(unknown));
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
  let d = new Date();
  let dString = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+ " " + ("0"+d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);
  if (debug)
    console.log(dString + " NOTIFICATIONSRV:", msg);
  if (msgObject)
    console.log(msgObject);
}



// init is called by main
exports.init = initNotificationServer;
// test alarm triggered by browser client
exports.triggerTestAlarm = function(){  handleNotification(testNotification) }
