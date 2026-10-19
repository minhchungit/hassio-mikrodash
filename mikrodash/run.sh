#!/bin/sh
O=/data/options.json
gv(){ grep -o "\"$1\"[ ]*:[ ]*\"[^\"]*\"" "$O" 2>/dev/null | head -1 | sed "s/^[^:]*:[ ]*\"//;s/\"$//"; }
gn(){ grep -o "\"$1\"[ ]*:[ ]*[0-9]*" "$O" 2>/dev/null | head -1 | sed "s/.*:[ ]*//"; }
gb(){ grep -o "\"$1\"[ ]*:[ ]*[a-z]*" "$O" 2>/dev/null | head -1 | sed "s/.*:[ ]*//"; }
RH=$(gv router_host);    [ -z "$RH" ]  && RH=192.168.88.1
RP=$(gn router_port);    [ -z "$RP" ]  && RP=8728
RT=$(gb router_tls);     [ -z "$RT" ]  && RT=false
RU=$(gv router_username);[ -z "$RU" ]  && RU=admin
RPW=$(gv router_password)
DU=$(gv dash_username);  [ -z "$DU" ]  && DU=admin
DP=$(gv dash_password)

/usr/local/bin/mikrodash -listen=:3082 -data=/data -web=/app/web/dist -static=/app/web/public -history -backup-scheduler -retention -alert-dispatch 2>&1 | tee /data/app.log &
APP=$!
/proxy &

i=0; while [ $i -lt 90 ]; do wget -qO- http://127.0.0.1:3082/healthz >/dev/null 2>&1 && break; sleep 1; i=$((i+1)); done

B=http://127.0.0.1:3082
ST=$(wget -qO- $B/api/auth/status 2>/dev/null)
if echo "$ST" | grep -q '"firstRun":true'; then
  CODE=$(grep -o 'Setup code: [A-Z0-9-]*' /data/app.log | tail -1 | awk '{print $3}')
  if [ -n "$CODE" ]; then
    wget -qO /dev/null --post-data "{\"code\":\"$CODE\",\"username\":\"$DU\",\"password\":\"$DP\"}" --header='Content-Type: application/json' $B/api/users/setup 2>/dev/null
    echo "[init] dashboard account: $DU (setup bypassed)"
  fi
fi
wget -qO /dev/null --post-data "{\"username\":\"$DU\",\"password\":\"$DP\"}" --header='Content-Type: application/json' --save-cookies /tmp/cj --keep-session-cookies $B/api/auth/login 2>/dev/null
RID=$(wget -qO- --load-cookies /tmp/cj $B/api/routers 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$RID" ]; then
  wget -qO /dev/null --load-cookies /tmp/cj --method=PUT --body-data "{\"host\":\"$RH\",\"port\":$RP,\"tls\":$RT,\"tlsInsecure\":false,\"username\":\"$RU\",\"password\":\"$RPW\"}" --header='Content-Type: application/json' "$B/api/routers/$RID" 2>/dev/null
  echo "[init] router applied: $RU@$RH:$RP tls=$RT"
fi
wait $APP
