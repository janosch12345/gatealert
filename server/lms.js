"use strict";

var config = require('./config.js');
var medianumberRegex = config.medianumberRegex;
const debug = true;



if (config.useXHRForMetadata) {
  var http = require('http');
  var axios = require('axios');
  var getMetadata = getMetadataByXHR;
} else {
  var Sybase = require('sybase');
  var db = new Sybase(process.env.LMSDBHOST, process.env.LMSDBPORT, process.env.LMSDBNAME, process.env.LMSDBUSER, process.env.LMSDBPASS, false);
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
async function getMetadataByXHR(medianumber, uid, callback) {

  return new Promise(function (resolve, reject) {
    // fist we check if the medianumber 
    if (!medianumberRegex.test(medianumber))
      return reject({ error: true, errorOn: "getMetadatabyDB", errorMessage: "medianumber is not passing the regex", args: { medianumber: medianumber, uid: uid } });

    log("LMS requesting metadata for " + medianumber + " by HTTP request to ")
    log("-> " + config.XHREndpoint + medianumber);
    axios.get(config.XHREndpoint + medianumber).then(function (response) {
      let meta = {
        medianumber: medianumber,
        uid: uid,
        signature: response.data.signature,
        title: response.data.title,
        //mtyp : mtyp,
        available: response.data.available === 'true' ? true : false

      }
      return resolve(meta)
    })
      .catch(function (error) {
        log("<- " + error.response.status);
        reject(error);
      })
      .then(function () {
        // always executed
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
function getMetadataByDB(medianumber, uid) {

  return new Promise(function (resolve, reject) {
    // fist we check if the medianumber 
    if (!medianumberRegex.test(medianumber))
      return reject({ error: true, errorOn: "getMetadatabyDB", errorMessage: "medianumber is not passing the regex", args: { medianumber: medianumber, uid: uid } });


    log("LMS requesting metadata for " + medianumber + " by DB query")
    db.connect(function (err) {
      if (err) return reject({ error: true, errorOn: "getMetadatabyDB", errorMessage: err, arguments: { medianumber: medianumber, uid: uid } });

      // sybase module does not support prepared statements
      db.query(SQL.getQuery(medianumber), function (err, data) {
        if (err)
          return reject({ error: true, errorOn: "getMetadatabyDB", errorMessage: err, arguments: { medianumber: medianumber, uid: uid } });

        if (data.length === 0)
          return reject({ error: true, errorOn: "getMetadatabyDB", errorMessage: "no item found by medianumber", arguments: { medianumber: medianumber, uid: uid } });

        let meta = {
          medianumber: medianumber,
          uid: uid,
          signature: data[0].signature,
          title: data[0].title,
          //mtyp :  data[0].d01mtyp,
          available: data[0].available === 0 ? true : false
        }
        db.disconnect();

        return resolve(null, meta);
      });
    });
  });

}

/**
 * logging helper
 * @param {type} msg
 * @param {type} msgObject
 * @returns {undefined}
 */
function log(msg, msgObject) {
  let d = new Date();
  let dString = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);
  if (debug)
    console.log(dString + " LMS:", msg);
  if (msgObject)
    console.log(msgObject);
}

module.exports.getMetadata = getMetadata;