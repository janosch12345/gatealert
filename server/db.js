"use strict";

var config = require('./config');
var mysql = require('mysql');

var debug = config.debug || true;

var dbConnection = mysql.createConnection(config.alarmDB);

var db = {
  
    saveAlarm : function(alarm){
      if (config.alarmDB.saveAlarms === false)
        return 

      dbConnection = mysql.createConnection(config.alarmDB);
      dbConnection.connect();

      // alarm = {medianumber : medianumber, uid : uid, signature : signature, status: available, title: title}
      dbConnection.query('INSERT INTO alarms SET ?', alarm, function (error, result) {
        if (error) log("error on DB insert",error);
        else {
          //log(result);
        }
      });

      dbConnection.end();
    },
    
    savePeopleCounterValues : function(counter){
      dbConnection = mysql.createConnection(config.alarmDB);
      dbConnection.connect();

      // alarm = {medianumber : medianumber, uid : uid, signature : signature, status: available, title: title}
      dbConnection.query('INSERT INTO peoplecounter SET ?', counter, function (error, result) {
        if (error) log("error on DB insert",error);
        else {
          //log(result);
        }
      });

      dbConnection.end();
    }
  
}

dbConnection.on('error', function(err) {
  log("Error on mysql connection",err)
});


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
    console.log((dString) + " DB:", msg);
  if (msgObject)
    console.log(msgObject);
}

module.exports = db;