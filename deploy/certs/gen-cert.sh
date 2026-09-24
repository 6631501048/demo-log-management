#!/usr/bin/env bash
# deploy/certs/gen-cert.sh
# Generates a self-signed TLS certificate for SaaS mode (docs/setup_saas.md).
# For a real domain, prefer Let's Encrypt/certbot instead — this is the
# "self-signed รับได้ถ้าอธิบายขั้นตอนชัดเจน" option the assignment allows.
#
# Usage: ./gen-cert.sh [common-name]
#   ./gen-cert.sh                  # CN=localhost
#   ./gen-cert.sh 1.2.3.4          # CN=<your VM's public IP>

set -euo pipefail
CN="${1:-localhost}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$DIR/key.pem" \
  -out "$DIR/cert.pem" \
  -subj "/C=TH/ST=Chiang Rai/L=Demo/O=LogManagementDemo/CN=${CN}"

echo "Generated $DIR/cert.pem and $DIR/key.pem (CN=${CN}, valid 365 days)."
echo "Browsers will show a security warning for self-signed certs — expected for this demo."
