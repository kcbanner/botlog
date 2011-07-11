#!/bin/sh
NODE=node
BOT=bot.js
PROJDIR=`pwd`
PIDFILE="$PROJDIR/pids/bot.pid"
LOGFILE="$PROJDIR/logs/bot.log"

cd $PROJDIR
if [ -f $PIDFILE ]; then
    kill `cat -- $PIDFILE`
    rm -f -- $PIDFILE
fi

$NODE $BOT 2>&1 >> $LOGFILE &
PID=$!
echo "Bot started, pid: $PID"
echo $PID > $PIDFILE