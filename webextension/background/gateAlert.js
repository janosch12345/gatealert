/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var hello = { "type": "status", "other": "client says hello" };
var alarms = [];
var gate = { "connection" : false, "sound" : false };
var _websocket = null;
var options = { "debug" : false };

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
    }
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
  // modifies browser action badge
  // offline
  if (!gate.connection){ 
    browser.browserAction.setBadgeBackgroundColor({color: "red"});
    browser.browserAction.setBadgeText({text: "offline"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("offline")});
  }
  // online 
  else if (alarms.length > 0){
    //adding a badge to the status icon
    browser.browserAction.setBadgeBackgroundColor({color: "red"});
    browser.browserAction.setBadgeText({text: " " + alarms.length});
  } else {
    browser.browserAction.setBadgeBackgroundColor({color: "red"});
    browser.browserAction.setBadgeText({text: ""});
  }
  // tell menu
  browser.runtime.sendMessage({"type": "status", "alarms" : alarms, "status" : gate}).then().catch((err)=>{log(err,"Notifying menu/popup: runtime.sendMessage  maybe no popup visible")}); 
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
      gate.connection = true;
      _websocket.send(JSON.stringify(hello));
      browser.browserAction.setBadgeText({text: ""});
           
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
        if (message.data)
          onGateStatus(message.data); //new api
        else
          onGateStatus(message.status); //old style
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
      gate.connection = false;
      notify();
      _websocket = null;
      setTimeout(wsConnect,15000);
    };

    _websocket.onerror = function(evt) {
      if (_websocket.readyState == 1) {
        log('Websocket normal error: ' + evt.type);
      }
    };
  }
}




/**
 * shows whether alarm/sound of the gate is ON or OFF by changing the icon in status bar
 * @param {type} status
 * @returns {undefined}
 */
function onGateStatus(status){
  //sound and other info
  if (status === "on"){
    gate.sound = true;
    browser.browserAction.setIcon({path: "icons/bell-o.svg"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("alarmOn")});
  } else {
    gate.sound = false;
    browser.browserAction.setIcon({path: "icons/bell-slash-o.svg"});
    browser.browserAction.setTitle({title: browser.i18n.getMessage("alarmOff")});
  }
  
}

/**
 * received an alarm message - will show a browser notification if enabled
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
    var content = browser.i18n.getMessage("notificationContent", [ alarm.title, alarm.medianumber, alarm.signature, browser.i18n.getMessage(alarm.available === "true" ? 'available' : 'borrowed') ]);
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
 * Register message listener f.e. popup.js will fetch alarms here
 */
browser.runtime.onMessage.addListener((msg) => {
  
  log(msg,"received message:");
  
  //popup/menu opens requests status and alarms
  if (msg.type === "fetchStatus"){
    notify();
  } 
  
  //popup triggers reconnect
  if (msg.type === "reconnect"){
    wsConnect();
  } 
  
  //popup triggers sound
  if (msg.type === "sound"){
    if (gate.sound === false)
      _websocket.send(JSON.stringify({"type":"status", "status" : "turnOn"}));
    if (gate.sound === true)
      _websocket.send(JSON.stringify({"type":"status","status" : "turnOff"}));
  }
  
  //empty the list
  if (msg.type === "emptyList"){
    alarms = []; 
    notify();
  }
  
  //open external application
  if (msg.type === "openExternal"){
    openExternal();
  } 
  
  //logging from menu
  if (msg.type === "log"){
    log(msg.log, msg.intro);
  } 
  
  //options have changed by options.js
  if (msg.type === "optionsChanged"){
    if (options.address !== msg.options.gateAlertOptions.address || options.port !== msg.options.gateAlertOptions.port){
      log("new connection details, going to restart websocket");
      options = msg.options.gateAlertOptions;
      wsConnect();
    } else {
      options = msg.options.gateAlertOptions;
    }   
    notify();
  }
});

/**
 * logging helper
 * @param {type} message
 * @param {type} intro
 * @returns {undefined}
 */
function log(message,intro) {
  
  if (options.debug){
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
options = { "debug" : false };

