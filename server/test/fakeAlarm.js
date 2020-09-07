'use strict';

const config = require('../config');

var net = require('net');

// Connect to a server @ port 9898
const client = net.createConnection({ host: config.notificationServer.host, port: config.notificationServer.port }, () => {
  console.log('connected to',config.notificationServer.host, config.notificationServer.port);
  client.write('0200400022001300010035030008e00401500a203fa300090432010421323131303336343300000000f70000004445444932352d45000000360000000004fe47','hex');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('CLIENT: I disconnected from the server.');
});