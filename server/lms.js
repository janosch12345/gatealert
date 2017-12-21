"use strict";

var config = require('./config.js');
var medianumberRegex = config.medianumberRegex;

if (config.useXHRForMetadata){
  var http = require('http');
  var getMetadata = getMetadataByXHR;
} else {
  var Sybase = require('sybase');
  var db = new Sybase(process.env.LMSDBHOST, process.env.LMSDBPORT, process.env.LMSDBNAME, process.env.LMSDBUSER, process.env.LMSDBPASS , false);
  var getMetadata = getMetadataByDB;
  var SQL = require('./SQL.js');
}

/*
 * returns metadata to a given medianumber by sending an http xml request to a corresponding webservice
 * @param {type} medianumber
 * @param {type} uid
 * @param {type} callback
 * @returns {unresolved}
 */
function getMetadataByXHR(medianumber,uid,callback){
  // fist we check if the medianumber 
  if (!medianumberRegex.test(medianumber))
    return callback({ error: true, errorOn : "getMetadatabyDB", errorMessage: "medianumber is not passing the regex", args : { medianumber: medianumber, uid: uid}});
    
  console.log( (new Date()) + " LMS requesting metadata for " + medianumber + " by HTTP request to " )
  console.log( (new Date()) + "  " + config.XHREndpoint + medianumber)
  return http.get(config.XHREndpoint + medianumber
    , function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            let meta = {
              medianumber : medianumber,
              uid : uid,
              signature : parsed.signature,
              title : parsed.title,
              //mtyp : mtyp,
              available : parsed.available === 'true' ? true : false
              
            }
            callback(null,meta);
        });
    });  
}

/*
 * returns metadata object for a given medienumber by sql 
 * @param {type} medianumber
 * @param {type} uid
 * @param {type} callback
 * @returns {unresolved}
 */
function getMetadataByDB (medianumber,uid,callback){
  
  // fist we check if the medianumber 
  if (!medianumberRegex.test(medianumber))
    return callback({ error: true, errorOn : "getMetadatabyDB", errorMessage: "medianumber is not passing the regex", args : { medianumber: medianumber, uid: uid}});
  
  
  console.log( (new Date()) + " LMS requesting metadata for " + medianumber + " by DB query" )
  
  db.connect(function (err) {
    if (err) return callback({ error: true, errorOn : "getMetadatabyDB", errorMessage: err, arguments : { medianumber: medianumber, uid: uid}});
  
    // sybase module does not support prepared statements
    db.query(SQL.getQuery(medianumber) ,function (err, data) {
      if (err) 
        return callback({ error: true, errorOn : "getMetadatabyDB", errorMessage: err, arguments : { medianumber: medianumber, uid: uid}});

      if (data.length === 0) 
        return callback({ error: true, errorOn : "getMetadatabyDB", errorMessage: "no item found by medianumber", arguments : { medianumber: medianumber, uid: uid}});

      let meta = {
        medianumber : medianumber,
        uid : uid,
        signature : data[0].signature,
        title : data[0].title,
        //mtyp :  data[0].d01mtyp,
        available : data[0].available === 0 ? true : false
      }
      db.disconnect();
      
      return callback(null,meta);
    });
  });
}

module.exports.getMetadata = getMetadata;