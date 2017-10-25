# gatealert

Gatealert is an application for libraries which use RFID (HF) for securing their items. 

This application consists of two parts:
1. Application Server (nodejs)
2. Firefox Add-on (webextension)

## Application server

The application server consists of several parts. The main part is a websocket server which will be addressed by the browser add-ons. A socket client is integrated to communicate with each configured gate. Another part is a small server, the notification server, that listens to alarms triggered by the gate.


### Installation

    cd /path/to/server
    npm install
    
### Configuration

All files starting with an underscore character "\_" in the server directory need to be renamed by removing the underscore.
All gates and other settings have to be configured in config.js.

In order to receive alarms from an RFID gate it has to be run in notification mode and to be configured to send alarms to the notification server. This only works with gates / rfid readers from the company FEIG (http://www.feig.de/).

The notifications sent by the gate will differ the ones expected in the standard configuration. Therefor the notificationRegex in config.js has to be adapted to meet your needs. The medianumber (or the userdata at all) comes as an hex ascii value f.e. 30 -> 0 or 39 -> 9 or 5A -> Z.

notificationRegex: 
    
    (E004[0-9A-F]{12})(\d{6})(3\d|44|5A)([0-9]{6})(3\d)(3\d)(3\d)(3\d)(3\d|58)(3\d)(3\d)(3\d)
    UID 16 chars | other data 6 chars | medianumber here 9x2 chars
    E0041234567890AB 000000 D00123454

Also handleNotification in notificationServer has to be adapted to grep the medianumber from the notification message.

### start

Set environment variables in start.sh and run server by

    ./start.sh

## Firefox add-on
 
The add-on connects  to the application server via websocket. When an alarm is triggered and a notification is sent to the application server

1. alarm list - displaying metadata if item which caused an alarm
2. control area - enabling or disabling all gate alarms, settings menu, list erase and link to external application
3. gate area - enable or disable gate alarm for each configured gate

### Installation

Download addon from AMO

or 

1. zip the content of webextension folder.
2. go to about:addons
3. click on the small settings icon in the upper right corner and choose install add-on from file
4. select the zipped file from step 1

