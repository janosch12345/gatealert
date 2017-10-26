#!/bin/bash
WORKDIR=/path/to/gatealert/server
SCRIPTNAME=$WORKDIR/main.js
NODE=/usr/bin/node 

PID=-1

process_running() { 
  if [ -f $WORKDIR/pid ] ; then
    # the lock file exists, check for process
    if [ "$(ps -p `cat $WORKDIR/pid` | wc -l)" -gt 1 ]; then
      # process is running
      PID=$(cat $WORKDIR/pid)
    else
      # process not running, but lock file not deleted?
      echo "process not running but pid found - removing"
      $(rm $WORKDIR/pid)
      PID=-1
    fi
  else
    TMP=$(ps -ef | grep -E "(node)*($SCRIPTNAME)" | grep -v grep | awk '{print $2}')
    if [ -n "$TMP" ] ; then
      PID=$TMP
      $(echo $PID > $WORKDIR/pid)
      echo "missing pidfile - created one";
    fi
  fi
}


start() { 
  LMSDBHOST=111.222.111.222 LMSDBPORT=1234 LMSDBNAME=name LMSDBUSER=user LMSDBPASS=pass ALARMDBHOST=111.222.111.222 ALARMDBNAME=name ALARMDBUSER=user ALARMDBPASS=pass $NODE $SCRIPTNAME > $WORKDIR/log & 
  PID=$!
  $(echo $PID > $WORKDIR/pid)
  echo "process started with PID $PID"
}

stop() {
  $(kill `cat $WORKDIR/pid`)
    if [ "$?" -eq "0" ]; 
      then 
        $(rm $WORKDIR/pid)
        echo "killed - removed pidfile"
      else 
        echo "not killed"
    fi  
}


process_running

case $1 in
  start)
    if [ "$PID" -gt 0 ] ; then
      echo "already running with PID $PID"
    else
      start
    fi
  ;;
  stop)
    if [ "$PID" -gt 0 ] ; then
      stop
    else
      echo "NOT running"
    fi
  ;;
  restart)
    if [ "$PID" -gt 0 ] ; then
      stop
      start
    else
      start
    fi
  ;;
  status)
    if [ "$PID" -gt 0 ] ; then
      echo "running with PID $PID"
    else
      echo "NOT running"
    fi
  ;;
  check)
    if [ "$PID" == -1 ] ; then
      start      
    fi
  ;;
  *)  echo "not existing '$1'; try start|stop|restart|status";;
esac

