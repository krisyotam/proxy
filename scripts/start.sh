#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
if [ ! -f config.yaml ]; then
  proxy_management_key=$(openssl rand -hex 32)
  proxy_client_key=$(openssl rand -hex 32)
  cat > config.yaml <<CONFIG
host: "127.0.0.1"
port: 8317
remote-management:
  allow-remote: false
  secret-key: "$proxy_management_key"
  disable-control-panel: false
  disable-auto-update-panel: true
auth-dir: "./auths"
api-keys:
  - "$proxy_client_key"
logging-to-file: true
usage-statistics-enabled: true
routing:
  strategy: "round-robin"
CONFIG
  printf 'Management key: %s\nClient API key: %s\n' "$proxy_management_key" "$proxy_client_key" > .proxy-local-credentials
  unset proxy_management_key proxy_client_key
  printf '%s\n' 'Created config.yaml. Your local keys are in .proxy-local-credentials.'
fi
printf '%s\n' 'Building proxy…'
go build -o proxy ./cmd/server
printf '%s\n' 'Open http://127.0.0.1:8317/management.html and connect with your management key.'
exec ./proxy --config config.yaml "$@"
