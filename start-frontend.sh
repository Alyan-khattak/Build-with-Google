#!/usr/bin/env bash
# Run from project root: ./start-frontend.sh
set -e
cd "$(dirname "$0")/frontend"
exec npm run dev
