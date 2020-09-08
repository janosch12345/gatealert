/**
 * saves the input values from the form in options.html
 * options get saved in an object called gateAlertOptions
 * @param {type} e
 * @returns {undefined}
 */
function saveOptions(e) {
  
  let options = { 
    gateAlertOptions : {
      address: document.querySelector("#server-address").value,
      //port: document.querySelector("#server-port").value,
      notifications: document.querySelector("#notifications-enabled").checked,
      listUrl: document.querySelector("#alarm-list-url").value,
      debug: document.querySelector("#debug-enabled").checked
    }
  };
    
  let save = browser.storage.local.set(options);
  save.then(() => {
    // display a success message
    successButton();
  }).catch();
  e.preventDefault();
  
  // tell background and menu about us, f.e. changed server params cause a reconnect in background script
  browser.runtime.sendMessage({"type": "optionsChanged", "options" : options});
}

/**
 * loads options (by object name gateAlertOptions) from local storage. 
 * The get function returns always a fulfilled promise, even if no options by that name are found
 * @returns {undefined}
 */
function restoreOptions() {
  let gettingItem = browser.storage.local.get('gateAlertOptions');
  gettingItem.then((res) => {
    if (res.gateAlertOptions){
      document.querySelector("#server-address").value = res.gateAlertOptions.address;
      //document.querySelector("#server-port").value = res.gateAlertOptions.port;
      document.querySelector("#notifications-enabled").checked = res.gateAlertOptions.notifications;
      document.querySelector("#alarm-list-url").value = res.gateAlertOptions.listUrl;
      document.querySelector("#debug-enabled").checked = res.gateAlertOptions.debug;
    } else {
      document.querySelector("#server-address").value = '127.0.0.1';
      //document.querySelector("#server-port").value = '1337';
      document.querySelector("#notifications-enabled").checked = true;
      document.querySelector("#alarm-list-url").value = 'http://';
      document.querySelector("#debug-enabled").checked = false;
    }
  }).catch((err) => {
    log(err);
  });
}

/**
 * adds an animation to the save button by adding a class
 * the removal of that class is initiated by setTimeout
 * @returns {undefined}
 */
function successButton(){
  document.getElementById("button-submit-success").classList.add('success');
  setTimeout(standardButton,2000);
}

/**
 * removes the success class from the save button
 * @returns {undefined}
 */
function standardButton(){
  document.getElementById("button-submit-success").classList.remove('success');
}

///////
// start
//////
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);