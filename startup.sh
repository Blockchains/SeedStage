#!/bin/sh
set -e
cd /workspace
sh /workspace/scripts/local-services.sh > /tmp/local-services.log 2>&1 &
if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev > /tmp/seedstage-dev.log 2>&1 &
