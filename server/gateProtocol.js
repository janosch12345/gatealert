/*
 * these are the messages sent to abd received from the rfid-reader in the gate
 * reader is a feig lrb25000
 */
var protocol = { request : {}, response : {} };

////02 00 08 FF 80 89 08 B6 
//02 00 0D FF 8A 02 01 01 00 09 01 80 12 NEU
//cfg9
protocol.request.status = new Buffer(13);
protocol.request.status[0] = 0x02;
protocol.request.status[1] = 0x00;
protocol.request.status[2] = 0x0D;
protocol.request.status[3] = 0xFF;
protocol.request.status[4] = 0x8A;
protocol.request.status[5] = 0x02;
protocol.request.status[6] = 0x01;
protocol.request.status[7] = 0x01;
protocol.request.status[8] = 0x00;
protocol.request.status[9] = 0x09;
protocol.request.status[10] = 0x01;
protocol.request.status[11] = 0x80;
protocol.request.status[12] = 0x12;

//protocol.request.status = new Buffer(0x02, 0x00, 0x0D, 0xFF, 0x8A, 0x02, 0x01, 0x01, 0x00, 0x09, 0x01, 0x80, 0x12);
//answer:
protocol.response.statusOn  = '02002A008A00011E00090F0F00000000000000000000000000000000000000000000000000000000121E';
protocol.response.statusOff = '02002A008A00011E00090F00000000000000000000000000000000000000000000000000000000005810';

//CPU-Reset: 02 00 07 FF 63 58 04
protocol.request.cpureset = new Buffer(7);
protocol.request.cpureset[0] = 0x02;
protocol.request.cpureset[1] = 0x00;
protocol.request.cpureset[2] = 0x07;
protocol.request.cpureset[3] = 0xFF;
protocol.request.cpureset[4] = 0x63;
protocol.request.cpureset[5] = 0x58;
protocol.request.cpureset[6] = 0x04;

//var cpuResetOk = '060063008607';
protocol.response.cpuResetOk   = '020008006300C3AA';   

//alarm ON: 02 00 16 FF 81 89 00 00 00 00 00 00 00 03 00 00 00 00 00 00 91 F6
//NEU 1 loop  ON: 02 00 2C FF 8B 02 01 01 01 1E 00 09 03 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 70 D6 
//NEU 2 loop  ON: 02 00 2C FF 8B 02 01 01 01 1E 00 09 0F 0F 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 3D 57 
protocol.request.alarmOn = new Buffer(44);
protocol.request.alarmOn[0] = 0x02;
protocol.request.alarmOn[1] = 0x00;
protocol.request.alarmOn[2] = 0x2C;
protocol.request.alarmOn[3] = 0xFF;
protocol.request.alarmOn[4] = 0x8B;
protocol.request.alarmOn[5] = 0x02;
protocol.request.alarmOn[6] = 0x01;
protocol.request.alarmOn[7] = 0x01;
protocol.request.alarmOn[8] = 0x01;
protocol.request.alarmOn[9] = 0x1E;
protocol.request.alarmOn[10] = 0x00;
protocol.request.alarmOn[11] = 0x09;
protocol.request.alarmOn[12] = 0x0F;
protocol.request.alarmOn[13] = 0x0F;
protocol.request.alarmOn[14] = 0x00;
protocol.request.alarmOn[15] = 0x00;
protocol.request.alarmOn[16] = 0x00;
protocol.request.alarmOn[17] = 0x00;
protocol.request.alarmOn[18] = 0x00;
protocol.request.alarmOn[19] = 0x00;
protocol.request.alarmOn[20] = 0x00;
protocol.request.alarmOn[21] = 0x00;
protocol.request.alarmOn[22] = 0x00;
protocol.request.alarmOn[23] = 0x00;
protocol.request.alarmOn[24] = 0x00;
protocol.request.alarmOn[25] = 0x00;
protocol.request.alarmOn[26] = 0x00;
protocol.request.alarmOn[27] = 0x00;
protocol.request.alarmOn[28] = 0x00;
protocol.request.alarmOn[29] = 0x00;
protocol.request.alarmOn[30] = 0x00;
protocol.request.alarmOn[31] = 0x00;
protocol.request.alarmOn[32] = 0x00;
protocol.request.alarmOn[33] = 0x00;
protocol.request.alarmOn[34] = 0x00;
protocol.request.alarmOn[35] = 0x00;
protocol.request.alarmOn[36] = 0x00;
protocol.request.alarmOn[37] = 0x00;
protocol.request.alarmOn[38] = 0x00;
protocol.request.alarmOn[39] = 0x00;
protocol.request.alarmOn[40] = 0x00;
protocol.request.alarmOn[41] = 0x00;
protocol.request.alarmOn[42] = 0x3D;
protocol.request.alarmOn[43] = 0x57;

//alarm OFF: 02 00 16 FF 81 89 00 00 00 00 00 00 00 00 00 00 00 00 00 00 FF 5E
//NEU 1 loop  OFF: 02 00 2C FF 8B 02 01 01 01 1E 00 09 03 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 32 D5 
//NEU 2 loop  OFF: 02 00 2C FF 8B 02 01 01 01 1E 00 09 0F 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 77 59 
protocol.request.alarmOff = new Buffer(44);
protocol.request.alarmOff[0] = 0x02;
protocol.request.alarmOff[1] = 0x00;
protocol.request.alarmOff[2] = 0x2C;
protocol.request.alarmOff[3] = 0xFF;
protocol.request.alarmOff[4] = 0x8B;
protocol.request.alarmOff[5] = 0x02;
protocol.request.alarmOff[6] = 0x01;
protocol.request.alarmOff[7] = 0x01;
protocol.request.alarmOff[8] = 0x01;
protocol.request.alarmOff[9] = 0x1E;
protocol.request.alarmOff[10] = 0x00;
protocol.request.alarmOff[11] = 0x09;
protocol.request.alarmOff[12] = 0x0F;
protocol.request.alarmOff[13] = 0x00;
protocol.request.alarmOff[14] = 0x00;
protocol.request.alarmOff[15] = 0x00;
protocol.request.alarmOff[16] = 0x00;
protocol.request.alarmOff[17] = 0x00;
protocol.request.alarmOff[18] = 0x00;
protocol.request.alarmOff[19] = 0x00;
protocol.request.alarmOff[20] = 0x00;
protocol.request.alarmOff[21] = 0x00;
protocol.request.alarmOff[22] = 0x00;
protocol.request.alarmOff[23] = 0x00;
protocol.request.alarmOff[24] = 0x00;
protocol.request.alarmOff[25] = 0x00;
protocol.request.alarmOff[26] = 0x00;
protocol.request.alarmOff[27] = 0x00;
protocol.request.alarmOff[28] = 0x00;
protocol.request.alarmOff[29] = 0x00;
protocol.request.alarmOff[30] = 0x00;
protocol.request.alarmOff[31] = 0x00;
protocol.request.alarmOff[32] = 0x00;
protocol.request.alarmOff[33] = 0x00;
protocol.request.alarmOff[34] = 0x00;
protocol.request.alarmOff[35] = 0x00;
protocol.request.alarmOff[36] = 0x00;
protocol.request.alarmOff[37] = 0x00;
protocol.request.alarmOff[38] = 0x00;
protocol.request.alarmOff[39] = 0x00;
protocol.request.alarmOff[40] = 0x00;
protocol.request.alarmOff[41] = 0x00;
protocol.request.alarmOff[42] = 0x77;
protocol.request.alarmOff[43] = 0x59;

//var alarmChangeOk = '06008100AFDD';
protocol.response.alarmChangeOk   = '020008008B009A8D';

// Gate counter module new since 0.5
//Anfrage Peoplecounter Values
//02 00 12 FF 9F 00 0D 02 02 00 08 01 77 00 EE 02 44 31
protocol.request.peopleCounterValues = new Buffer(18);
protocol.request.peopleCounterValues[0] = 0x02;
protocol.request.peopleCounterValues[1] = 0x00;
protocol.request.peopleCounterValues[2] = 0x12;
protocol.request.peopleCounterValues[3] = 0xFF;
protocol.request.peopleCounterValues[4] = 0x9F;
protocol.request.peopleCounterValues[5] = 0x00;
protocol.request.peopleCounterValues[6] = 0x0D;
protocol.request.peopleCounterValues[7] = 0x02;
protocol.request.peopleCounterValues[8] = 0x02;
protocol.request.peopleCounterValues[9] = 0x00;
protocol.request.peopleCounterValues[10] = 0x08;
protocol.request.peopleCounterValues[11] = 0x01;
protocol.request.peopleCounterValues[12] = 0x77;
protocol.request.peopleCounterValues[13] = 0x00;
protocol.request.peopleCounterValues[14] = 0xEE;
protocol.request.peopleCounterValues[15] = 0x02;
protocol.request.peopleCounterValues[16] = 0x44;
protocol.request.peopleCounterValues[17] = 0x31;

// setzen des peoplecounter value auf 0
// 02 00 22 FF 9F 00 0D 02 02 00 18 01 78 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 B0 9D 41 38
protocol.request.resetPeopleCounterValues = new Buffer(34);
protocol.request.resetPeopleCounterValues[0] = 0x02;
protocol.request.resetPeopleCounterValues[1] = 0x00;
protocol.request.resetPeopleCounterValues[2] = 0x22;
protocol.request.resetPeopleCounterValues[3] = 0xFF;
protocol.request.resetPeopleCounterValues[4] = 0x9F;
protocol.request.resetPeopleCounterValues[5] = 0x00;
protocol.request.resetPeopleCounterValues[6] = 0x0D;
protocol.request.resetPeopleCounterValues[7] = 0x02;
protocol.request.resetPeopleCounterValues[8] = 0x02;
protocol.request.resetPeopleCounterValues[9] = 0x00;
protocol.request.resetPeopleCounterValues[10] = 0x18;
protocol.request.resetPeopleCounterValues[11] = 0x01;
protocol.request.resetPeopleCounterValues[12] = 0x078;
protocol.request.resetPeopleCounterValues[13] = 0x00;
protocol.request.resetPeopleCounterValues[14] = 0x00;
protocol.request.resetPeopleCounterValues[15] = 0x00;
protocol.request.resetPeopleCounterValues[16] = 0x00;
protocol.request.resetPeopleCounterValues[17] = 0x00;
protocol.request.resetPeopleCounterValues[18] = 0x00;
protocol.request.resetPeopleCounterValues[19] = 0x00;
protocol.request.resetPeopleCounterValues[20] = 0x00;
protocol.request.resetPeopleCounterValues[21] = 0x00;
protocol.request.resetPeopleCounterValues[22] = 0x00;
protocol.request.resetPeopleCounterValues[23] = 0x00;
protocol.request.resetPeopleCounterValues[24] = 0x00;
protocol.request.resetPeopleCounterValues[25] = 0x00;
protocol.request.resetPeopleCounterValues[26] = 0x00;
protocol.request.resetPeopleCounterValues[27] = 0x00;
protocol.request.resetPeopleCounterValues[28] = 0x00;
protocol.request.resetPeopleCounterValues[29] = 0x00;
protocol.request.resetPeopleCounterValues[30] = 0xB0;
protocol.request.resetPeopleCounterValues[31] = 0x9D;
protocol.request.resetPeopleCounterValues[32] = 0x41;
protocol.request.resetPeopleCounterValues[33] = 0x38;

// reset response
// 02 00 10 00 9F 00 02 00 08 01 78 00 26 81 6D 1F
// fuer Status OK
protocol.response.resetPeopleCounterValuesOK = "020010009F0002000801780026816D1F";

module.exports = protocol;