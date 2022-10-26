'use strict';

const config = require('../config');

var net = require('net');

// Connect to a server @ port 9898
const client = net.createConnection({ host: config.notificationServer.host, port: config.notificationServer.port }, () => {
  console.log('connected to',config.notificationServer.host, config.notificationServer.port);
  //client.write('0200400022001300010035030008e00401500a203fa300090432010421323131303336343300000000f70000004445444932352d45000000360000000004fe47','hex');
  //client.write('0200400022001300010035030008E0040150219C19A300090432010111303431303530343500000000f70000004445444932352d45000000360000000004fe47','hex');
  //client.write('0200400022001300010035030008E0040150219C19A300090432010111323231303238393600000000f70000004445444932352d45000000360000000004fe47','hex');
  client.write('0200400022001300010035030008E0040150219C3D8000090432010111303531303039383300000000f70000004445444932352d45000000360000000004fe47','hex');  
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('CLIENT: I disconnected from the server.');
});
