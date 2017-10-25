"use strict";

var hello = { "type": "init", "other": "hello" }; // standard response on connection to server, will respond with info to all gates
var alarms = []; // list of recent alarms - only alarms per session are displayed
var gates; // holds status of all server connected gates

var _websocket = null;
var reconnectTimeoutID = false;

// state of addon - will be send to popup menu
var gateAlert = {
  connection : false,
  displayStatus : undefined,
  gates : []
}

var options = { "debug" : true }; // initial options object - will be overwritten by stored options

/*
 * initial function that restores options from local storage 
 * by successful loading opens websocket
 * by failure shows information in browser action
 * @returns {undefined}
 */
function restoreOptions() {
  var gettingItem = browser.storage.local.get('gateAlertOptions');
  gettingItem.then((res) => {
    if (res.gateAlertOptions){
      options = res.gateAlertOptions;
      wsConnect(); 
    } else {
      // there were no options found in storage
      // warn user with browser action badge
      browser.browserAction.setBadgeBackgroundColor({color: "red"});
      browser.browserAction.setBadgeText({text: "init"});
      browser.browserAction.setTitle({title: browser.i18n.getMessage("offline")});
      log("No stored options found. Please go to settings and set options.");
    }
  }).catch((err) => {
    log(err);
  });
}

/**
 * notifies menu by sending a message including
 *  alarmlist
 *  options 
 *  gate status
 * @returns {undefined}
 */
function notify(){
  if (gateAlert.connection && typeof gateAlert.displayStatus !== "undefined"){
    if (alarms.length > 0){
      //adding a badge to the status icon
      browser.browserAction.setBadgeBackgroundColor({color: "red"});
      browser.browserAction.setBadgeText({text: " " + alarms.length});
    } else {
      browser.browserAction.setBadgeBackgroundColor({color: "red"});
      browser.browserAction.setBadgeText({text: ""});
    }
  }
  // tell menu/popup
  log({"type": "status", "alarms" : alarms, "status" : gateAlert},"Notify:")
  browser.runtime.sendMessage({"type": "status", "alarms" : alarms, "status" : gateAlert}).then().catch((err)=>{log(err,"Notifying menu/popup: runtime.sendMessage  maybe no popup visible")}); 
}

/*
 * connection to server is made
 * removes all warnings from browser action
 * @returns {undefined}
 */
function showOnlineMode (){
  browser.browserAction.setBadgeText({text: ""});
}

/*
 * no connection to server
 * show warnings in browser action
 * @returns {undefined}
 */
function showOfflineMode(){
  browser.browserAction.setBadgeBackgroundColor({color: "red"});
  browser.browserAction.setBadgeText({text: "offline"});
  browser.browserAction.setTitle({title: browser.i18n.getMessage("offline")});
  gateAlert.displayStatus = undefined;
}

/*
 * connection to server is online, but server is not connected to any gates
 * show warnings in brwoser action
 * @returns {undefined}
 */
function showNoGatesMode(){
  browser.browserAction.setBadgeBackgroundColor({color: "red"});
  browser.browserAction.setBadgeText({text: "NO GATES"});
  browser.browserAction.setIcon({path: "icons/bell-o.svg"});
  browser.browserAction.setTitle({title: browser.i18n.getMessage("noGates")});
}


/**
 * initializes and handles websocket  
 * @returns {undefined}
 */
function wsConnect() {
  
  if (_websocket) {
    _websocket.close(3001);
  } else {
    _websocket = new WebSocket("ws://" +options.address + ":" + options.port);
    
    _websocket.onopen = function() {
      log('Websocket connection opened');
      gateAlert.connection = true;
      
      _websocket.send(JSON.stringify(hello));
      showOnlineMode();
           
    };
    
    _websocket.onmessage = function(msg) {
      log(msg.data,"Websocket onmessage: ");
      let message;
      try { 
        message = JSON.parse(msg.data);
        log(message,"parseJSON: ");
      }
      catch(exception){
        log(exception,"parseJSON error: ");
        message = { "type" : null }
      }
      
      if (message.type === "alarm" || message.msgType === "alarm"){
        if (message.data)
          onAlarm(message.data); 
        else
          onAlarm(message); //old style {"msgType":"alarm","medianumber":"101892808","signature":"Unbekannt","title":"Unbekannt","available":"true","date":"2017-09-19T12:01:28.887Z"}
      } else 
      if (message.type === "status" || message.msgType === "status"){
        gateAlert.gates = message.gates;
        if (message.gates.length === 0)
          showNoGatesMode();
        else
          onGatesStatus();
        
        
      }
      notify();
    };

    _websocket.onclose = function(evt) {
      if (evt.code == 3001) {
        log('Websocket closed');
      } else {
        //no server found
        log('Websocket connection error - server not found');
      }
      gateAlert.connection = false;
      showOfflineMode();
      _websocket = null;
      // reconnect in 15seconds
      reconnectTimeoutID = setTimeout(wsConnect,15000);
    };

    _websocket.onerror = function(evt) {
      if (_websocket.readyState == 1) {
        log('Websocket normal error: ' + evt.type);
      }
    };
  }
}

/*
 * determines sound status of each gate and sets displayStatus which will be evaluated by menu.js
 * @param {type} gates
 * @returns {undefined}
 */
function onGatesStatus(){
  
  let overallState = undefined;  
  
  // loop through all gates 
  for (let i = 0; i < gateAlert.gates.length; i++){
    
    // first call will set overallState
    if (typeof overallState === "undefined")
      overallState = gateAlert.gates[i].status;
    
    // if state of actual gate differs overallState > mixed mode
    if (gateAlert.gates[i].status !== overallState){
      gateAlert.displayStatus = "mixed";
      browser.browserAction.setIcon({path: "icons/bell-o-mix.svg"}); // icon with marker
      browser.browserAction.setTitle({title: browser.i18n.getMessage("alarmMixed")});
      return
    } 
  }
  
  // overallState did not change during loop
  gateAlert.displayStatus = overallState;
  if (overallState){
    browser.browserAction.setIcon({path: "icons/bell-o.svg"}); // standard bell ON
    browser.browserAction.setTitle({title: browser.i18n.getMessage("alarmOn")});
  } else {
    browser.browserAction.setIcon({path: "icons/bell-slash-o.svg"}); //  standard bell OFF - strikethough
    browser.browserAction.setTitle({title: browser.i18n.getMessage("alarmOff")});
  } 
  
}

/**
 * received an alarm message - will show a operating system notification if enabled
 * https://developer.mozilla.org/en-US/Add-ons/WebExtensions/user_interface/Notifications
 * @param {type} alarm
 * @returns {undefined}
 */
function onAlarm(alarm){
  //add a date to alarm and cut off the alarms list to only 3 alarms
  alarm.date = new Date();
  alarms.push(alarm);
  alarms = alarms.slice(-3);
  
  //display native system notification if enabled in options
  if (options.notifications){
    var title = browser.i18n.getMessage("notificationTitle");
    var content = browser.i18n.getMessage("notificationContent", [ alarm.title, alarm.medianumber, alarm.signature, browser.i18n.getMessage(alarm.available === "true" || alarm.available === true ? 'available' : 'borrowed') ]);
    browser.notifications.create({
      "type": "basic",
      "iconUrl": browser.extension.getURL("icons/bell-o.svg"),
      "title": title,
      "message": content
    });
  } 
}

/**
 * click on notification /menu->external opens the overview website in a new tab
 * @returns {undefined}
 */
function openExternal() {
  var creating = browser.tabs.create({
    url: options.listUrl
  });
  creating.then((evt)=>{ log(evt,"onNotificationClick clicked") },(error)=>{ log(error,"onNotificationClick error")});
  
}


/**
 * Register message listener 
 * f.e. menu.js will fetch alarms here
 * or request an sound change
 */
browser.runtime.onMessage.addListener((msg) => {
  
  log(msg,"received message:");
  
  // popup/menu is just opened and requests status and alarms
  if (msg.type === "fetchStatus"){
    // send standard notify
    notify();
  } 
  
  // popup triggers a manual reconnect
  if (msg.type === "reconnect"){
    // reconnects are usually handledby settimeout every 15sec
    // interrupt settimeout if necessary
    if (reconnectTimeoutID)
      clearTimeout(reconnectTimeoutID);
    reconnectTimeoutID = false;
    
    wsConnect();
  } 
  
  // popup triggers sound ON/OFF
  if (msg.type === "sound"){
    if (msg.all){ // for ALL gates
      _websocket.send(JSON.stringify({"type":"status", "all":true , "toStatus" : msg.toStatus}));
    } else { // just ONE gate by id
      _websocket.send(JSON.stringify({"type":"status", "id":msg.id, "toStatus" : msg.toStatus}));
    }
  }
  
  // empty the list for this session
  if (msg.type === "emptyList"){
    alarms = []; 
    notify();
  }
  
  // open external application defined in options
  if (msg.type === "openExternal"){
    openExternal();
  } 
  
  // logging from menu
  if (msg.type === "log"){
    log(msg.log, msg.intro);
  } 
  
  // options have changed by options.js
  if (msg.type === "optionsChanged"){
    
    // server adress/port was changed, forces a reconnect
    if (options.address !== msg.options.gateAlertOptions.address || options.port !== msg.options.gateAlertOptions.port){
      log("new connection details, going to restart websocket");
      options = msg.options.gateAlertOptions;
      wsConnect();
    } else {
      options = msg.options.gateAlertOptions;
    }   
    //notify();
  }
});

/**
 * logging helper
 * @param {type} message
 * @param {type} intro
 * @returns {undefined}
 */
function log(message,intro) {
  if (options.debug === true){
    if (intro)
      console.log(intro + " -->");
    console.log(message);
  }
}


///////////////
// start
///////////////
document.addEventListener('DOMContentLoaded', restoreOptions);
browser.notifications.onClicked.addListener(openExternal);
