"use strict";

var protocol = require('./gateProtocol.js');
var net = require('net');
var config = require('./config.js');

//var socket = new net.Socket(); 
//socket.setTimeout(3000);

var minStatusRequestDelta = config.minStatusRequestDelta; // min time between status requests

module.exports = class Gate{
   
  constructor(host,port,id){
    this.debug = true;
    this.host = host;
    this.port = port;
    this.id = id;
    this.avail = false;
    this.alarm = {
      status : undefined,
      statusTS : undefined
    };
    this.context = {
      type : undefined,
      msg : undefined,
      responseData : "",
      responsePart : 0,
      resolver : undefined,
      rejecter : undefined
    };
    this.socket = new net.Socket(); 
    this.socket.setTimeout(3000);
    this.socket.on('data', chunk => {
      let response = chunk.toString("hex").toUpperCase();
      this.context.responseData += response;
      this.log("<= part: " + this.context.responsePart + " data: " + this.context.responseData);

      //chunked data part 
      if (response.length < 1024) {
        switch (this.context.type){
          case "status": // we expect a status response from gate
            this.socket.destroy(); //we cut the connection due to an received response
            
            if (this.context.responseData === protocol.response.statusOn){ // response says alarm is on
              this.setGateInfoAlarmStatus(true); // save status 
              this.avail = true;
              this.context.resolver(); // and resolve the promise
              this.initContext(); // reset context
            } else if (this.context.responseData === protocol.response.statusOff){ // response says alarm is off
              this.setGateInfoAlarmStatus(false);
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
              this.socket.destroy();
              this.context.rejecter({ errorOn : "toggleAlarm", error: true, errorMessage: "no valid response from gate" });
              this.initContext();
            }
            break;
        }
        this.context.responsePart = 0;
        this.context.responseData = "";

      } else {
        this.log("DATA: more packages coming: " + response.length);
        this.context.responsePart++;
      } 
    }); 
    this.socket.on('connect', () => { 
      switch (this.context.type){
        case "toggle":
          this.log("=> toggle request, toggling to " + (this.context.toggleTo === true ? "ON" : "OFF"));
          this.socket.write( this.context.toggleTo === true ? protocol.request.alarmOn : protocol.request.alarmOff );
          break;
        case "status": 
          this.log("=> status request");
          this.socket.write(protocol.request.status);
          break;
      }
      
    });
    this.socket.on('close', () => { 
      this.socket.destroy();
      
    });
    this.socket.on('error', (error) => { 
      this.log("socket on ERROR:"," " +error.code || ""); 
      this.avail = false;
      //reject an existing promise
      if (this.context.rejecter){
        this.context.rejecter({ errorOn : "socket", error: true, errorMessage: error });
        this.initContext();
      }
    });
    
  }
  
  log (msg,msgObject){
    if (this.debug)
      console.log((new Date()) + " GATE(" + this.host+':' + this.port + "):", msg);
    if (msgObject)
      console.log(msgObject);
  }

  /**
   * resets context of gate client, so that new requests can be made
   * @returns {undefined}
   */
  initContext(){
    this.context.responseData = "";
    this.context.responsePart = undefined;
    this.context.type = undefined;
    this.context.msg = undefined;
    this.context.resolver = undefined;
    this.context.rejecter = undefined;
    
  }
  
  /**
   * 
   * @param {type} val
   * @returns {undefined}
   */
  setGateInfoAlarmStatus(val){
    this.alarm.status = val;
    this.alarm.statusTS = new Date();
  }
  
  /**
   * 
   * @returns {undefined}
   */
  printInfo(){
    this.log('Gate :'+ this.host + ":" + this.port + " Alarm: " + this.alarm.status );
  }
  
  /**
   * return an object with important gate info
   * @returns {nm$_gateClass.Gate.getGateInfo.gateClassAnonym$5}
   */
  getGateInfo(){
    return { 
      host : this.host,
      port : this.port,
      id : this.id, 
      status : this.alarm.status, 
      statusTS : this.alarm.statusTS, 
      avail: this.avail
    }
  }
  
  /**
   * 
   * @param {type} callback
   * @returns {undefined}
   */
  init(callback){
    this.log("INIT ");
    //this.printInfo();
    this.getAlarmStatus()
      .then( () => { 
        this.avail = true;
        callback(null) 
      })
      .catch( err => { 
        callback(err) 
      });
  }
  
  /**
   * 
   * @param {type} newStatus
   * @returns {Promise}
   */
  setAlarmStatus (newStatus){
    
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
        return reject({ errorOn : "setAlarmStatus", error: true, errorMessage: "request in progress" });

      //save resolve and reject for async use
      this.context.resolver = resolve;
      this.context.rejecter = reject;
      this.context.type = "toggle";
      this.context.toggleTo = newStatus;
     
      // if socket is not available the promise will be rejected by error event of socket
      this.socket.connect(this.port, this.host);
      

    });
  
  }
   
  /**
   * 
   * @returns {Promise}
   */ 
  getAlarmStatus (){
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
        return reject({ errorOn : "getAlarmStatus", error: true, errorMessage: "request in progress" });
      }
      //save resolve and reject for async use
      this.context.resolver = resolve;
      this.context.rejecter = reject;
      this.context.type = "status";
      
      // if socket is not available the promise will be rejected by error event of socket
      this.socket.connect(this.port, this.host);
      

    });
    
  }
};

