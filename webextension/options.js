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
    
  //browser.storage.sync.set(options);
  let save = browser.storage.local.set(options);
  save.then((res) => { 
    successButton();
    
  }).catch();
  e.preventDefault();
  //tell background and menu about us
  browser.runtime.sendMessage({"type": "optionsChanged", "options" : options});
}

function restoreOptions() {
  //var gettingItem = browser.storage.sync.get('gateAlertOptions');
  let gettingItem = browser.storage.local.get('gateAlertOptions');
  gettingItem.then((res) => {
    //let options = res.gateAlertOptions;
    document.querySelector("#server-address").value = res.gateAlertOptions.address || '127.0.0.1';
    document.querySelector("#server-port").value = res.gateAlertOptions.port || '1337';
    document.querySelector("#notifications-enabled").checked = res.gateAlertOptions.notifications || true;
    document.querySelector("#alarm-list-url").value = res.gateAlertOptions.listUrl || 'http://';
    document.querySelector("#debug-enabled").checked = res.gateAlertOptions.debug || false;
  }).catch((err)=>{
    //console.log(err)
    document.querySelector("#server-address").value = '127.0.0.1';
    document.querySelector("#server-port").value = '1337';
    document.querySelector("#notifications-enabled").checked = true;
    document.querySelector("#alarm-list-url").value = 'http://';
    document.querySelector("#debug-enabled").checked = false;
  });
}

function successButton(){
  document.getElementById("button-submit-success").classList.add('success');
  setTimeout(standardButton,2000)
}

function standardButton(){
  document.getElementById("button-submit-success").classList.remove('success');
}

///////
// start
//////
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);