var config = {
  useXHRForMetadata : true,
  XHREndpoint : "http://kobz22.bib-bvb.de/cgi-bin/btw-cgi/gatealarm/gatealarm.pl?medianumber=",
  medianumberRegex : /^[FDZ0-9]\d{7}[X0-9]$/,
  notificationRegex : /(E004[0-9A-F]{12})(\d{6})(3\d|44|5A)([0-9]{6})(3\d)(3\d)(3\d)(3\d)(3\d|58)(3\d)(3\d)(3\d)/g,
  specialRegex1 : /(31)([0-9]{6})(0000)(33)(32)(00000000)/,
  specialRegex2 : /(30)([0-9]{6})(30)(30)(30)(30)(000000)/,
  minStatusRequestDelta : 30000,
  alarmDB : {
    saveAlarms : true,
    host     : process.env.ALARMDBHOST,
    user     : process.env.ALARMDBUSER,
    password : process.env.ALARMDBPASS,
    database : process.env.ALARMDBNAME
  },
  lmsDB : {
    host : process.env.LMSDBHOST,
    port : process.env.LMSDBPORT,
    name : process.env.LMSDBNAME,
    user : process.env.LMSDBUSER,
    pass : process.env.LMSDBPASS
  },
  mainServer : {
    port : 1337,
  },
  notificationServer : {
    port : 65000,
  },
  gates : [
    { id: "Eingang Nord", host : "localhost", port : 10003 },
    { id: "Eingang Süd", host : "localhost", port : 10004 },
    { id :"some name for identification", host : "111.222.111.111", port : 10000 },
    { id :"some name for identification", host : "111.222.111.222", port : 10000 }
  ],
  
  permittedClients : {
    pattern : {
      active : true,
      pattern : '::ffff:192.168.1.'
    },
    list : {
      active : true,
      list : ["::ffff:192.168.1.10","::ffff:192.168.1.11", "::ffff:192.168.1.12","::ffff:127.0.0.1"]
    }
  }
}

module.exports = config;
