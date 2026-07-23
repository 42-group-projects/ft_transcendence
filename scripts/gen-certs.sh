#!/bin/sh
# Generate a self-signed TLS certificate for local development (dev-only).
# The same cert/key pair is shared by the frontend (next dev --experimental-https)
# and the socket server (https.createServer). CN/SAN cover localhost + 127.0.0.1.
set -e

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "Certificates already exist in $CERT_DIR — skipping."
    exit 0
fi

mkdir -p "$CERT_DIR"

echo "Generating self-signed TLS certificate in $CERT_DIR ..."
openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=JP/ST=Tokyo/L=Tokyo/O=42Tokyo/OU=ft_transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Done."
