# Live stream backend deployment guide

## 1. Deploy MediaMTX on the VPS

1. Copy the repository files to the VPS.
2. Create a production environment file from [.env.media.example](../.env.media.example).
3. Ensure the following ports are open:
   - TCP 1935 for RTMP ingest
   - TCP 8554 for RTSP ingest
   - TCP 8888 for HLS playback
   - TCP/UDP 8555 for WebRTC playback
   - TCP 9997 for health and metrics
4. Start the container:

```bash
docker compose -f docker-compose.media.yml up -d
```

The resulting endpoints are:
- RTMP publish: `rtmp://<vps-ip>:1935/live`
- RTSP publish/playback: `rtsp://<vps-ip>:8554/live`
- HLS playback: `http://<vps-ip>:8888/live/index.m3u8`
- WebRTC playback: `http://<vps-ip>:8555/live`
- Health: `http://<vps-ip>:9997/metrics`

## 2. Configure Supabase

1. Deploy the new edge functions from [supabase/functions/live-stream-admin](../supabase/functions/live-stream-admin) and [supabase/functions/stream-health](../supabase/functions/stream-health).
2. Add the environment values from [.env.media.example](../.env.media.example) to the Supabase edge-function environment.
3. Apply the migration in [supabase/migrations](../supabase/migrations).

## 3. Test the backend

### RTMP ingest
- Configure OBS or another encoder to publish to `rtmp://<vps-ip>:1935/live` with the stream key `live`.
- Confirm MediaMTX advertises the HLS manifest at `http://<vps-ip>:8888/live/index.m3u8`.

### RTSP ingest
- Point an RTSP camera or ffmpeg to `rtsp://<vps-ip>:8554/live`.
- Confirm the stream appears in the browser through the HLS or WebRTC endpoint.

### Mobile browser publishing
- Use the browser-based publisher in the admin flow with the configured MediaMTX URL and the `live` path.
- Confirm the public page switches to the live source without manual refresh.

### Health check
- Call the edge function `/functions/v1/live-stream-admin` with an `action` of `health` to confirm the server is reachable.
- Call `/functions/v1/stream-health` to read the latest backend health payload.

## 4. Production notes

- Put the MediaMTX service behind a reverse proxy if you want TLS-enabled endpoints.
- Use strong credentials for MediaMTX if you expose it outside the private network.
- Mount the recordings directory on persistent storage for archiving.
