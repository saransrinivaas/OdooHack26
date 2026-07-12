#!/usr/bin/env bash
# TransitOps — one-command launcher.
# Usage:  ./run.sh            (installs deps if needed, then starts on :8010)
#         PORT=9000 ./run.sh  (use a different port)
set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/backend"
PORT="${PORT:-8010}"

echo "TransitOps — installing backend dependencies (first run only)…"
python3 -m pip install -q -r requirements.txt

echo ""
echo "Starting TransitOps on http://127.0.0.1:${PORT}"
echo "   Open that URL in your browser. Demo logins (password: transitops123):"
echo "     manager@transitops.com   (Fleet Manager)"
echo "     driver@transitops.com    (Driver)"
echo "     safety@transitops.com    (Safety Officer)"
echo "     finance@transitops.com   (Financial Analyst)"
echo "     admin@transitops.com     (Admin — full access)"
echo ""
exec python3 -m uvicorn app.main:app --host 127.0.0.1 --port "${PORT}"
