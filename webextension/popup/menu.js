//var status; //gate status {connection: true/false, sound: true/false}
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
      browser.runtime.sendMessage({"type": "sound"});
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
 * 
 * @param {type} request
 * @param {type} sender
 * @param {type} sendResponse
 * @returns {undefined}
 */
function onMessage(request) {
                  
  if (request.type === "status"){
    //displaying alarms
    //empty the list
    while (alarmList.firstChild) {
        alarmList.removeChild(alarmList.firstChild);
    }
    if (request.alarms.length === 0)
      alarmList.insertAdjacentHTML('beforeend',browser.i18n.getMessage("noAlarms"));
    else {
      
      for (let i = request.alarms.length -1; i >= 0; i--){
        let alarm = request.alarms[i];
        let content = browser.i18n.getMessage("menuAlarmContent",[formattedDate(alarm.date),alarm.title,alarm.medianumber,alarm.signature,browser.i18n.getMessage(alarm.available === "true" ? 'available' : 'borrowed')])
        alarmList.insertAdjacentHTML('beforeend', content);
      }
    }
    
    //gate status
    if (request.status.connection){
      //gate is connected
      //hide the connect button
      document.getElementById("gatealert-menu-state").classList.add('hide');
      //show soundbutton
      document.getElementById("gatealert-menu-sound").classList.remove('hide');
    } else {
      //gate is not connected, show connect button
      document.getElementById("gatealert-menu-state").classList.remove('hide');
      //hide sound button
      document.getElementById("gatealert-menu-sound").classList.add('hide');
    }
    
    if (request.status.sound){
      //gate sound is on change icon in menu to 'switch on'
      document.getElementById("gatealert-menu-sound-img").src = '/icons/bell-slash-o.svg';
      document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("buttonTurnOffSound");
    } else {
      //gate sound is off change icon in menu to 'switch off'
      document.getElementById("gatealert-menu-sound-img").src = '/icons/bell-o.svg';
      document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("buttonTurnOnSound");
    }
    
    //status = request.status;
    
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

browser.runtime.sendMessage({"type": "fetchStatus"});

//listener to background/options script messages
browser.runtime.onMessage.addListener(onMessage);

//adding i18n titles to menu buttons
document.getElementById('gatealert-menu-state').title = browser.i18n.getMessage("connectButton");
document.getElementById('gatealert-menu-empty').title = browser.i18n.getMessage("emptyListButton");
document.getElementById('gatealert-menu-external').title = browser.i18n.getMessage("externalButton");
document.getElementById('gatealert-menu-settings').title = browser.i18n.getMessage("settingsButton");
document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("unknown");