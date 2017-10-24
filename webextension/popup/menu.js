/**
 * click listener for the menu items
 * @type type
 */
document.addEventListener("click", (e) => {
  switch (e.target.id){
    case "gatealert-menu-state": 
      //reconnect
      browser.runtime.sendMessage({"type": "reconnect"});
      break;
    case "gatealert-menu-sound": 
      browser.runtime.sendMessage({"type": "sound", "toStatus" : !overallStatus, "all" : true });
      break;
    case "gatealert-menu-empty": 
      browser.runtime.sendMessage({"type": "emptyList"});
      break;
    case "gatealert-menu-external": 
      browser.runtime.sendMessage({"type": "openExternal"});
      window.close();
      break;
    case "gatealert-menu-settings": 
      browser.runtime.openOptionsPage();
      window.close();
      break;
    default: break;
  }
});

/**
 * parses messages from background script, 
 * is called each time the popup is opened or when a notify() in gateAlert script is fired
 * changes the structure of buttons in control area and displays the alarms
 * @param {type} request
 * @param {type} sender
 * @param {type} sendResponse
 * @returns {undefined}
 */
function onMessage(request) {
                  
  if (request.type === "status"){
    // display alarms 
    // first empty the list
    while (alarmList.firstChild) {
        alarmList.removeChild(alarmList.firstChild);
    }
    if (request.alarms.length === 0)
      alarmList.insertAdjacentHTML('beforeend',browser.i18n.getMessage("noAlarms"));
    else {
      
      for (let i = request.alarms.length -1; i >= 0; i--){
        let alarm = request.alarms[i];
        let content = browser.i18n.getMessage("menuAlarmContent",[formattedDate(alarm.date),alarm.title,alarm.medianumber,alarm.signature,browser.i18n.getMessage(alarm.available === "true" || alarm.available === true ? 'available' : 'borrowed')])
        alarmList.insertAdjacentHTML('beforeend', content);
      }
    }
    
    // reconnect button: if connection to websocket is established - hide the reconnect button
    if (request.status.connection === true){
      //hide the connect button
      document.getElementById("gatealert-menu-state").classList.add('hide');   
    } else {
      //gate is not connected, show reconnect connect button
      document.getElementById("gatealert-menu-state").classList.remove('hide');
      document.getElementById("gatealert-menu-sound").classList.add('hide');
    }
    
    // overall sound button: if no gates configured/reachable - hide the overall sound button
    if (typeof request.status.displayStatus === "undefined"){
      //hide sound button
      document.getElementById("gatealert-menu-sound").classList.add('hide');
    } else {
      // icon of overall sound button depending on the states of the gates
      if (request.status.displayStatus === true){
        // on each gate sound is ON, we offer a button to turn all OFF
        overallStatus = true;
        document.getElementById("gatealert-menu-sound-img").src = '/icons/bell-slash-o.svg';
        document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("buttonTurnOffSoundAll");
      } else {
        // on each gate sound is OFF or we have MIXED sound settings, we offer a button to turn all ON
        overallStatus = false;
        document.getElementById("gatealert-menu-sound-img").src = '/icons/bell-o.svg';
        document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("buttonTurnOnSoundAll");
      }
      // show overall sound control button
      document.getElementById("gatealert-menu-sound").classList.remove('hide');
    }
    
    // gate list under copntrol area
    // left: button to toggle sound for that gate right: name/id of the gate from server config
    // first remove old entries
    while (gateList.firstChild) {
        gateList.removeChild(gateList.firstChild);
    }    
    for (let i = 0; i < request.status.gates.length; i++){
      // block element
      let row = document.createElement('div');
      row.className = "row";
      // flex container
      let gate = document.createElement('div');
      gate.className = "gate";
      gate.dataset.id = request.status.gates[i].id;
      // toggle button
      let button = document.createElement('button');
      button.className = "button";
      // disable button when websocket is offline or gate not connected
      button.disabled = request.status.connection === false || request.status.gates[i].avail === false ? true : false; 
      // icon for button
      let img = document.createElement('img');
      img.className = "status";
      
      if (request.status.gates[i].avail === false){
        button.title = browser.i18n.getMessage("gateNotConnected");
        img.src = "/icons/exclamation-triangle.svg";
      }
      else if (request.status.gates[i].status  === true){ 
        // sound of that gate is ON
        button.title = browser.i18n.getMessage("buttonTurnOffSound");
        img.src = "/icons/bell-o.svg";
        button.addEventListener('click',() => { browser.runtime.sendMessage({"type": "sound", "id":request.status.gates[i].id, "toStatus" : false}); });
      } else { 
        // sound of that gate is OFF
        button.title = browser.i18n.getMessage("buttonTurnOnSound");
        img.src = "/icons/bell-slash-o.svg";
        button.addEventListener('click',() => { browser.runtime.sendMessage({"type": "sound", "id":request.status.gates[i].id, "toStatus" : true}); });
      }
      // name/id 
      let idDiv = document.createElement('div');
      idDiv.className = "gatealert-gate-id";
      idDiv.appendChild(document.createTextNode(request.status.gates[i].id));
      
      button.appendChild(img);
      gate.appendChild(button);
      gate.appendChild(idDiv);
      row.appendChild(gate);
      gateList.appendChild(row);
    } // end of gate info 
  }   
}

/**
 * returns a printable timestamp in form of HH:MM:SS
 * @param {type} date
 * @returns {String}
 */
function formattedDate(date){
  return ("0" + date.getHours()).slice(-2) + ":" +  ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

//////
// start
//////
//on opening the menu fetch status and alarms from background script
var alarmList = document.getElementById('gatealert-alarms');
var gateList = document.getElementById('gatealert-gates');
var overallStatus = undefined;

browser.runtime.sendMessage({"type": "fetchStatus"});

//listener to background/options script messages
browser.runtime.onMessage.addListener(onMessage);

//adding i18n titles to menu buttons
document.getElementById('gatealert-menu-state').title = browser.i18n.getMessage("connectButton");
document.getElementById('gatealert-menu-empty').title = browser.i18n.getMessage("emptyListButton");
document.getElementById('gatealert-menu-external').title = browser.i18n.getMessage("externalButton");
document.getElementById('gatealert-menu-settings').title = browser.i18n.getMessage("settingsButton");
document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("unknown");