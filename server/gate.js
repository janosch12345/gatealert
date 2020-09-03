"use strict";

var protocol = require('./gateProtocol.js');
var net = require('net');
var config = require('./config.js');
var db = require('./db.js');


var minStatusRequestDelta = config.minStatusRequestDelta; // min time between status requests

module.exports = 

class Gate {

  constructor(host, port, id, peopleCounter) {
    this.debug = true;
    this.host = host;
    this.port = port;
    this.id = id;
    this.avail = false;
    this.alarm = {
      status: undefined,
      statusTS: undefined
    };
    this.counter = peopleCounter ? { "in" : undefined, "out" : undefined, "ts" : undefined} : false;
    this.context = {
      type: undefined,
      msg: undefined,
      responseData: "",
      responsePart: 0,
      resolver: undefined,
      rejecter: undefined,
      closeConnection: true
    };
    this.socket = new net.Socket();
    this.socket.setTimeout(3000);
    
    this.socket.on('connect', () => {
      this.avail = true;
      switch (this.context.type){
        case "toggle":
          this.log("=> toggle request, toggling to " + (this.context.toggleTo === true ? "ON" : "OFF"));
          this.socket.write( this.context.toggleTo === true ? protocol.request.alarmOn : protocol.request.alarmOff );
          break;
        case "status": 
          this.log("=> status request");
          this.socket.write(protocol.request.status);
          break;
        case "getPCValues":
          this.log("=> people counter values request");
          this.socket.write(protocol.request.peopleCounterValues);
          break;
        case "resetPCValues" :
          this.log("=> people counter reset request");
          this.socket.write(protocol.request.resetPeopleCounterValues);
          break;  
      }    
      
    });
    
    this.socket.on('data', (chunk) => {
      let response = chunk.toString("hex").toUpperCase();
      this.context.responseData += response;
      this.log("<= part: " + this.context.responsePart + " data: " + this.context.responseData);

      //chunked data part 
      if (response.length < 1024) {
        switch (this.context.type){
          case "status": // we expect a status response from gate
            
            if (this.context.responseData === protocol.response.statusOn){ // response says alarm is on
              this.setInfoAlarmStatus(true); // save status 
              this.context.resolver(); // and resolve the promise
              this.initContext(); // reset context
              
            } else if (this.context.responseData === protocol.response.statusOff){ // response says alarm is off
              this.setInfoAlarmStatus(false);
              this.avail = true;
              this.context.resolver();
              this.initContext();
              
            } else { // response is not matching our expectations, we reject the promise with an error message
              this.context.rejecter({ errorOn : "statusRequest", error: true, errorMessage: "no valid response from gate" });
              this.initContext();
              
            }
            break;
          
          case "toggle": // we expect an alarm changed response from gate
            if (this.context.responseData === protocol.response.alarmChangeOk){
              // after an alarm change we must du a CPUReset request
              this.log("toggle went well, sending CPU reset request");
              this.socket.write(protocol.request.cpureset);
            } else if (this.context.responseData === protocol.response.cpuResetOk){
              // after a cpu reset ok response request a new status
              this.context.type = "status"; // now we expect a status response
              this.log("CPU reset went well, sending status request");
              this.socket.write(protocol.request.status);
            } else { // no expectations were fullfilled, rejecting the promise
              
              this.context.rejecter({ errorOn : "toggleAlarm", error: true, errorMessage: "no valid response from gate" });
              this.initContext();
            }
            break;
          
          case "getPCValues" :
            // store and filter the values            
            this.setInfoPeopleCounterValues(this.context.responseData); // save people counter values 
            this.context.resolver(); // and resolve the promise
            this.initContext(); // reset context
            break;
          
          case "resetPCValues" :
            // what about retries
            if (this.context.responseData === protocol.response.resetPeopleCounterValuesOK){ // response says reset is done
              this.context.resolver(); // and resolve the promise
              this.initContext(); // reset context
            } else {
              this.context.rejecter({ errorOn : "resetPCValues", error: true, id: this.id ,errorMessage: "no valid response from gate" });
              this.initContext();
            }     
            break;
          
          default: 
            this.log(" default case should not happen!");
        }
        this.context.responsePart = 0;
        this.context.responseData = "";

      } else {
        this.log("DATA: more packages coming: " + response.length);
        this.context.responsePart++;
      } 
    });
    
    this.socket.on('close', (hadError) => { 
      this.log(" CLOSED Event fired. had Error?: " + hadError);
      //this.log(" ctype on closed event: "+ this.context.type) // an der stelle sind bei einem folgecall bereits ein neuer context eingetragen, zb.b bei init
      //reject an existing promise
      if (this.context.rejecter){
        this.context.rejecter({ "errorOn" : "socket", "error": true, "errorMessage": "Socket conection closed while requesting " + this.context.type });
        this.initContext();
      }
    });
    
    this.socket.on('timeout', () => { 
      this.log(" TIMEOUT ");
      this.socket.destroy();
    });
    
    this.socket.on('error', (error) => { 
      this.log("socket on ERROR:"," " +error || ""); 
      /*this.avail = false;
      //reject an existing promise
      if (this.context.rejecter){
        this.context.rejecter({ errorOn : "socket", error: true, errorMessage: error });
        this.initContext();
      }*/
    });
    
  }

    /**
     * resets context of gate client, so that new requests can be made
     * @returns {undefined}
     */
    initContext() {
      
      this.context.responseData = "";
      this.context.responsePart = undefined;
      this.context.type = undefined;
      this.context.msg = undefined;
      this.context.resolver = undefined;
      this.context.rejecter = undefined;
      
      if (this.context.closeConnection){
        this.socket.destroy();
      }
      
      this.context.closeConnection = true;
      
    }
    
    /**
     * 
     * @param {type} val
     * @returns {undefined}
     */
    setInfoAlarmStatus(val){
      
      this.alarm.status = val;
      this.alarm.statusTS = new Date();
    }
    
    /**
     * extract the in and out values from gates people counter response
     * @param {type} responseByteString
     * @returns {undefined}
     */
    setInfoPeopleCounterValues(responseByteString){
      let values;
      while (values = config.peopleCounterValuesRegex.exec(responseByteString)){
        this.counter.in  = parseInt(values[2], 16) || -1;
        this.counter.out = parseInt(values[3], 16) || -1;
        this.counter.ts = new Date();
      }  
         
    }
    
    /**
     * 
     */
    printInfo(){
      this.log('Gate :'+ this.host + ":" + this.port + " Alarm: " + this.alarm.status );
    }
    
    /**
     * return an object with important gate info
     * @returns {nm$_gateClass.Gate.getInfo.gateClassAnonym$5}
     */
    getInfo(){
      return { 
        host : this.host,
        port : this.port,
        id : this.id, 
        status : this.alarm.status, 
        statusTS : this.alarm.statusTS, 
        avail: this.avail,
        counter : this.counter
      };
    }

    log(msg, msgObject) {
      let d = new Date();
      let dString = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);
      if (this.debug)
        console.log(dString + " GATE(" + this.host + ':' + this.port + "):", msg);
      if (msgObject)
        console.log(msgObject);
    }
    
    /**
     * initializes gateobject and requests for alarm status and if available people counter
     * @returns {Promise}
     */
    init(){

      return new Promise(
      (resolve, reject) => {

        if (this.counter){ // gate has a counter
          // first get alarm status
          this.getAlarmStatus(false) // false will let the connection open for following request
          .then( () => { 
            // and second get counter values
            return this.getPeopleCounterValues();
          }).then(() =>{
            // resolve the promise
            
            return resolve();
          }).catch( err => { 

            return reject( err );
          });
        } else { // gate has no counter
          // get alarm status
          this.getAlarmStatus()
          .then( () => { 
            // resolve the promise
            return resolve();
          })
          .catch( err => { 
            return reject( err );
          });
        }
      });
    }
    
    connect() {
      if (this.socket.destroyed){
        this.socket.setTimeout(3000);
      }
      this.socket.connect(this.port, this.host);
    }
    
    close() {
      if (!this.socket.destroyed){
        //this.socket.destroy();
      }
    }
                            
    /**
      * @param {boolean} closeConnection - closes connection after request preset to true
      * @param {type} newStatus
      * @returns {Promise}
      */
     setAlarmStatus (newStatus, closeConnection = true){

       return new Promise(
       // connect to the gate
       // send a status request
       // wait for response
       // if response is the right response
       // and response is valid
       // resolve the promise
       // else 
       (resolve, reject) => {
         if (this.context.type)
           return reject({ id : this.id, errorOn : "setAlarmStatus", error: true, errorMessage: "request in progress: "+this.context.type });

         //save resolve and reject for async use
         this.context.resolver = resolve;
         this.context.rejecter = reject;
         this.context.type = "toggle";
         this.context.toggleTo = newStatus;
         this.context.closeConnection = closeConnection;

         // if socket is not available the promise will be rejected by error event of socket
         this.connect();

       });

     }

     /**
      * @param {boolean} closeConnection - closes connection after request preset to true
      * @returns {Promise}
      */ 
     getAlarmStatus (closeConnection = true){
       return new Promise(

       // connect 
       // then send a status request
       // then wait for response
       // if response is the right response
       // and response is valid
       // resolve the promise
       // else 
       (resolve, reject) => {
         // prevent multiple requests on gate
         // the last request for status is not long ago, we respond with the last result
         if ((new Date()) - this.alarm.statusTS < minStatusRequestDelta && typeof this.alarm.status !== "undefined" && typeof this.alarm.statusTS !== "undefined"){
           return resolve();//{status: this.alarm.status, statusTS : this.alarm.statusTS, id: this.id}
         }
         if (this.context.type){
           return reject({ id : this.id, errorOn : "getAlarmStatus", error: true, errorMessage: "request in progress: "+this.context.type });
         }
         //save resolve and reject for async use
         this.context.resolver = resolve;
         this.context.rejecter = reject;
         this.context.type = "status";
         
         this.context.closeConnection = closeConnection;
         // if socket is not available the promise will be rejected by error event of socket
         this.connect();
       });  
     }

     /**
      * 
      * @param {type} closeConnection
      * @returns {Promise}
      */
     resetPeopleCounterValues (closeConnection = true){

       return new Promise(
       (resolve, reject) => {
         if (this.context.type)
           return reject({ id : this.id, errorOn : "resetPeopleCounterValues", error: true, errorMessage: "request in progress: "+this.context.type });

         //save resolve and reject for async use
         this.context.resolver = resolve;
         this.context.rejecter = reject;
         this.context.type = "resetPCValues";
         this.context.closeConnection = closeConnection;
         // if socket is not available the promise will be rejected by error event of socket
         this.connect();

       });

     }

     /**
      * @param {boolean} closeConnection - closes connection after request preset to true   
      * @returns {Promise}
      */
     getPeopleCounterValues (closeConnection = true){
       return new Promise(
       (resolve, reject) => {
         // prevent multiple requests on gate
         if (this.context.type){
           return reject({ id : this.id, errorOn : "getPeopleCounterValues", error: true, errorMessage: "request in progress: "+this.context.type });
         }

          //save resolve and reject for async use
         this.context.resolver = resolve;
         this.context.rejecter = reject;
         this.context.type = "getPCValues";
         this.context.closeConnection = closeConnection;
         this.connect();

       });  
     }

  };
