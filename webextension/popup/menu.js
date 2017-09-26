var options;
var status; //gate status {connection: true/false, sound: true/false}
/**
 * click listener for the menu items
 * @type type
 */
document.addEventListener("click", (e) => {
  /*if (e.target.classList.contains("beast")) {
    
    var chosenBeast = e.target.textContent;
    var chosenBeastURL = beastNameToURL(chosenBeast);

    browser.tabs.executeScript(null, { 
      file: "/content_scripts/beastify.js" 
    });

    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then((tabs) => {
      browser.tabs.sendMessage(tabs[0].id, {beastURL: chosenBeastURL});
    });
  }
  else if (e.target.classList.contains("clear")) {
    browser.tabs.reload();
    window.close();
  }*/
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
      break;
    case "gatealert-menu-settings": 
      browser.runtime.openOptionsPage();
      break;
    default: break;
  }
});

function onMessage(request, sender, sendResponse) {
  
  if (request.type === "status"){
    //displaying alarms
    if (request.alarms.length === 0)
      document.querySelector('#gatealert-alarms').innerHTML = browser.i18n.getMessage("noAlarms");
    else {
      document.querySelector('#gatealert-alarms').innerHTML = "";
      for (let i = request.alarms.length -1; i >= 0; i--){
        let alarm = request.alarms[i];
        /*let content = '<div class="alarm"><span class="date">'+formattedDate(alarm.date) + '</span><br>' +
            browser.i18n.getMessage("title") + " " + alarm.title + "<br>" +
            browser.i18n.getMessage("medianumber") + " " + alarm.medianumber + "<br>" +
            browser.i18n.getMessage("signature") + " " + alarm.signature + "<br>" +
            browser.i18n.getMessage(alarm.available === "true" ? 'available' : 'borrowed') + "</div>";*/
        let content = browser.i18n.getMessage("menuAlarmContent",[formattedDate(alarm.date),alarm.title,alarm.medianumber,alarm.signature,browser.i18n.getMessage(alarm.available === "true" ? 'available' : 'borrowed')])
        document.querySelector('#gatealert-alarms').innerHTML += content;
      }
    }
    
    //gate status
    if (request.status.connection){
      //gate is connected
      //hide the connect button
      document.getElementById("gatealert-menu-state").classList.add('hide');
      //enable soundbutton
      document.getElementById("gatealert-menu-sound").classList.remove('hide');
    } else {
      //gate is not connected
      document.getElementById("gatealert-menu-state").classList.remove('hide');
      //disable sound button
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
    
    status = request.status;
    
    //setting options
    options = request.options;
    
  }  
  //console.log(`received a message: ${request}`);
  log(request,"Menu received a message ")
  //sendResponse({"type": "popup", "data": "dataComplete"});
}

/**
 * returns a printable timestamp in form of HH:MM:SS
 * @param {type} date
 * @returns {String}
 */
function formattedDate(date){
  //date.getDate() + "." + (date.getMonth() + 1 )+ ". " 
  return ("0" + date.getHours()).slice(-2) + ":" +  ("0" + date.getMinutes()).slice(-2) + ":" + ("0" + date.getSeconds()).slice(-2);
}

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


////// start
//fetch status and alarms from background script by sending a message
browser.runtime.sendMessage({"type": "fetchStatus"});

//listener to background/options script messages
browser.runtime.onMessage.addListener(onMessage);

//adding i18n titles to menu buttons
document.getElementById('gatealert-menu-state').title = browser.i18n.getMessage("connectButton");
document.getElementById('gatealert-menu-empty').title = browser.i18n.getMessage("emptyListButton");
document.getElementById('gatealert-menu-external').title = browser.i18n.getMessage("externalButton");
document.getElementById('gatealert-menu-settings').title = browser.i18n.getMessage("settingsButton");
document.getElementById('gatealert-menu-sound').title = browser.i18n.getMessage("unknown");