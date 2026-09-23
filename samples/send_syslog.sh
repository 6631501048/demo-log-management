#!/usr/bin/env bash
# samples/send_syslog.sh
# Sends sample syslog lines to the running syslogListener.js for testing.
#
# Usage:
#   ./send_syslog.sh              # sends both firewall.log and network.log via UDP to localhost:5514
#   ./send_syslog.sh tcp          # same, but over TCP
#   ./send_syslog.sh udp 10.0.0.5 514   # custom host/port

set -euo pipefail

PROTO="${1:-udp}"
HOST="${2:-127.0.0.1}"
PORT="${3:-5514}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/syslog"

send_line() {
  local line="$1"
  if [ "$PROTO" = "tcp" ]; then
    printf '%s\n' "$line" | nc -w1 "$HOST" "$PORT"
  else
    printf '%s\n' "$line" | nc -u -w1 "$HOST" "$PORT"
  fi
}

echo "Sending sample syslog lines via $PROTO to $HOST:$PORT ..."

while IFS= read -r line; do
  [ -z "$line" ] && continue
  send_line "$line"
  echo "  sent: $line"
  sleep 0.2
done < "$DIR/firewall.log"

while IFS= read -r line; do
  [ -z "$line" ] && continue
  send_line "$line"
  echo "  sent: $line"
  sleep 0.2
done < "$DIR/network.log"

echo "Done. Check the syslogListener.js console output and the dashboard/DB."
