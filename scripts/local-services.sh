#!/bin/sh
ROOT=/workspace/.local-svc
mkdir -p "$ROOT"
if [ ! -x "$ROOT/bao" ] && [ -x /opt/seedstage-svc/bao ]; then
  cp /opt/seedstage-svc/bao /opt/seedstage-svc/temporal "$ROOT/"
fi
if [ ! -x "$ROOT/keycloak/bin/kc.sh" ] && [ -x /opt/seedstage-svc/keycloak-26.8.2/bin/kc.sh ]; then
  cp -a /opt/seedstage-svc/keycloak-26.8.2 "$ROOT/keycloak"
fi

if [ -x "$ROOT/bao" ] && ! curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8200/v1/sys/health; then
  "$ROOT/bao" server -dev -dev-root-token-id=seedstage-dev -dev-listen-address=127.0.0.1:8200 > /tmp/openbao.log 2>&1 &
fi
if [ -x "$ROOT/temporal" ] && ! curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8233/; then
  "$ROOT/temporal" server start-dev --port 7233 --ui-port 8233 --db-filename /tmp/temporal.db > /tmp/temporal.log 2>&1 &
fi
if [ -x "$ROOT/keycloak/bin/kc.sh" ] && ! curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8180/; then
  "$ROOT/keycloak/bin/kc.sh" start-dev --http-port=8180 --http-host=127.0.0.1 --hostname-strict=false > /tmp/keycloak.log 2>&1 &
fi

i=0
while [ "$i" -lt 20 ]; do
  if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8200/v1/sys/health; then
    BAO_ADDR=http://127.0.0.1:8200 BAO_TOKEN=seedstage-dev "$ROOT/bao" kv put secret/seedstage firm=MMC company=Ravical >/dev/null 2>&1 || true
    break
  fi
  i=$((i + 1))
  sleep 0.5
done
