#!/usr/bin/env bash
# run.sh — one-command bootstrap for Appliance mode.
# Equivalent to `make up && make seed-users`, spelled out for anyone without
# `make` installed. See docs/setup_appliance.md for the full walkthrough
# and docs/setup_saas.md for SaaS mode.

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -f .env ]; then
  echo "No .env found — copying from .env.example (edit it if you want non-default passwords)."
  cp .env.example .env
fi

echo "Starting services (postgres, api, syslog listener, web)..."
docker compose up -d --build

echo "Waiting for postgres to be healthy..."
until docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-logmgmt_user}" > /dev/null 2>&1; do
  sleep 1
done

echo "Creating demo users (admin/viewer)..."
docker compose exec -T api node scripts/create_user.js --email admin@demoA.local --password secret123 --role admin --tenant demoA
docker compose exec -T api node scripts/create_user.js --email viewer@demoA.local --password secret123 --role viewer --tenant demoA
docker compose exec -T api node scripts/create_user.js --email admin@demoB.local --password secret123 --role admin --tenant demoB

cat <<EOF

Done. Open http://localhost in your browser.
Login: admin@demoA.local / secret123  (or viewer@demoA.local / secret123)

Try the ingest layer:
  ./samples/send_syslog.sh udp 127.0.0.1 514
  python3 ./samples/post_logs.py --url http://localhost:3000/ingest
EOF
