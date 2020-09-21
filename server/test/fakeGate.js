'use strict';

var net = require('net');
const protocol = require('../gateProtocol.js');

let fakeGates = [
  {
    id: "Fake1",
    ip: "127.0.0.1",
    port: "10001",
    status: true
  },
  {
    id: "Fake2",
    ip: "127.0.0.1",
    port: "10002",
    status: true
  },
  {
    id: "Fake3",
    ip: "127.0.0.1",
    port: "10003",
    status: true
  }
]

let status = true;

for (let fakeGate of fakeGates) {

  let server = net.createServer(function (socket) {

    // check remote Address  

    console.log(fakeGate.id, socket.remoteAddress + " connection opened");
    // echo
    //socket.pipe(socket);

    socket.on('data', function (data) {
      //log("MAIN","incoming data",data); //<Buffer 64 61 74 61 0a>
      let textChunk = data.toString('hex');

      //console.log("<", " Last charCode:" + textChunk.charCodeAt(textChunk.length-1)); //<Buffer 64 61 74 61 0a>
      //console.log(textChunk,protocol.request.status.toString('hex'), textChunk === protocol.request.status.toString('hex'))

      switch (textChunk) {
        case protocol.request.status.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.status");
          if (fakeGate.status === true) {
            console.log(fakeGate.id, "> protocol.response.statusOn");
            socket.write(Buffer.from(protocol.response.statusOn, 'hex'));
          } else {
            console.log(fakeGate.id, "> protocol.response.statusOff");
            socket.write(Buffer.from(protocol.response.statusOff, 'hex'));
          }

          break;
        case protocol.request.alarmOff.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.alarmOff");
          console.log(fakeGate.id, "> protocol.response.alarmChangeOk");
          fakeGate.status = false;
          socket.write(Buffer.from(protocol.response.alarmChangeOk, 'hex'));
          break;
        case protocol.request.alarmOn.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.alarmOn");
          console.log(fakeGate.id, "> protocol.response.alarmChangeOk");
          fakeGate.status = true;
          socket.write(Buffer.from(protocol.response.alarmChangeOk, 'hex'));
          break;
        case protocol.request.cpureset.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.cpureset");
          console.log(fakeGate.id, "> protocol.response.cpuResetOk");
          socket.write(Buffer.from(protocol.response.cpuResetOk, 'hex'));
          break;
        case protocol.request.peopleCounterValues.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.peopleCounterValues");
          let inVal = Math.floor(Math.random() * Math.floor(200));
          let outVal = Math.abs(inVal - Math.floor(Math.random() * Math.floor(20)));
          let response = "020020009F000200180177000000000000000000" + ("00000000" + inVal.toString(16)).slice(-8) + ("00000000" + outVal.toString(16)).slice(-8) + "ffffffff";
          console.log(fakeGate.id, "> IN: ",inVal," OUT: ",outVal + " ", response);
          socket.write(response, 'hex');
          break;
        case protocol.request.resetPeopleCounterValues.toString('hex'):
          console.log(fakeGate.id, "< protocol.request.resetPeopleCounterValues");
          socket.write(Buffer.from(protocol.response.resetPeopleCounterValuesOK, 'hex'));
          break;
        default:
          console.log(fakeGate.id, "< " + textChunk);
          console.log(fakeGate.id, "> echoing");
          socket.write(textChunk);
      }

    });

  });

  server.listen(fakeGate.port, fakeGate.ip);
  console.log(fakeGate.id, "Server listening on " + fakeGate.ip + ":" + fakeGate.port);

}



// Sunday - Saturday : 0 - 6
