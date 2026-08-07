#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to deploy MediaMTX." >&2
  exit 1
fi

docker compose -f docker-compose.media.yml up -d

echo "MediaMTX is running."
echo "RTMP: rtmp://<your-vps-ip>:1935/live"
echo "RTSP: rtsp://<your-vps-ip>:8554/live"
echo "HLS: http://<your-vps-ip>:8888/live/index.m3u8"
echo "WebRTC: http://<your-vps-ip>:8555/live"
