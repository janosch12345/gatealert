# gatealert

Gatealert is an application for libraries which use RFID (HF) for securing their items. 

This application consists of two parts:
1. Firefox Add-on (webextension)
2. Server ( nodejs )


## Firefox add-on
 
The add-on consists of two parts: 

1. a small control area for enabling or disabling gate alarms, settings menu
2. alarm list

### Installation

Download addon from AMO

or 

1. zip the content of webextension folder.
2. go to about:addons
3. click on the small settings icon in the upper right corner and choose install add-on from file
4. select the zipped file from step 1

## Server

Nodejs, websockets

### Installation

    cd /path/to/server
    npm install
    
### Configuration

Rename _config.js to config.js and change settings inside the file.