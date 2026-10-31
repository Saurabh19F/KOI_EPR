#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${SSH_ORIGINAL_COMMAND:-}" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  exec /home/koi-erp/shared/deploy-production.sh "${BASH_REMATCH[1]}"
fi

echo "This key may only deploy an exact KOI ERP commit." >&2
exit 126
