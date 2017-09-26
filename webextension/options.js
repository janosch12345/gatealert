function saveOptions(e) {
  let options = { 
      gateAlertOptions : {
        address: document.querySelector("#server-address").value,
        port: document.querySelector("#server-port").value,
        notifications: document.querySelector("#notifications-enabled").checked,
        listUrl: document.querySelector("#alarm-list-url").value,
        debug: document.querySelector("#debug-enabled").checked
      }
    };
    
  browser.storage.sync.set(options);
  e.preventDefault();
  //tell background and menu about us
  browser.runtime.sendMessage({"type": "optionsChanged", "options" : options});//.then().catch((err)=>{log(err,"runtime.sendMessage")}); 
}

function restoreOptions() {
  var gettingItem = browser.storage.sync.get('gateAlertOptions');
  gettingItem.then((res) => {
    //let options = res.gateAlertOptions;
    document.querySelector("#server-address").value = res.gateAlertOptions.address || '127.0.0.1';
    document.querySelector("#server-port").value = res.gateAlertOptions.port || '1337';
    document.querySelector("#notifications-enabled").checked = res.gateAlertOptions.notifications || true;
    document.querySelector("#alarm-list-url").value = res.gateAlertOptions.listUrl || 'http://';
    document.querySelector("#debug-enabled").checked = res.gateAlertOptions.debug || false;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);