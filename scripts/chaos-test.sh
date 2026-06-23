#!/usr/bin/env bash
# ponytail: chaos test. pings /api/v1/health, restarts one docker-compose service, checks recovery.
# Usage: CHAOS_SERVICE=redpanda ./scripts/chaos-test.sh
set -euo pipefail

SERVICE="${CHAOS_SERVICE:-redpanda}"
TARGET="${TARGET:-http://localhost:4000/api/v1/health}"
DOWNSEC="${DOWNSEC:-10}"
LOG="${LOG:-/tmp/chaos.log}"

echo "[chaos] target=$TARGET service=$SERVICE downtime=${DOWNSEC}s log=$LOG" | tee -a "$LOG"

probe() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$TARGET" || echo "000")
  echo "$(date +%H:%M:%S) probe=$code"
}

probe
echo "[chaos] stopping $SERVICE" | tee -a "$LOG"
(cd infra && docker-compose stop "$SERVICE") >>"$LOG" 2>&1

START=$SECONDS
while (( SECONDS - START < DOWNSEC )); do
  probe
  sleep 1
done

echo "[chaos] restarting $SERVICE" | tee -a "$LOG"
(cd infra && docker-compose start "$SERVICE") >>"$LOG" 2>&1

# Wait for recovery
START=$SECONDS
while (( SECONDS - START < 60 )); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$TARGET" || echo "000")
  probe
  if [[ "$code" == "200" ]]; then
    echo "[chaos] recovered after $((SECONDS - START))s" | tee -a "$LOG"
    exit 0
  fi
  sleep 2
done

echo "[chaos] FAILED to recover in 60s" | tee -a "$LOG"
exit 1
