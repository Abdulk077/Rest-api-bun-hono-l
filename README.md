To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000
#
# Video Streaming API

## Prerequisites
- Bun
- FFmpeg

## Setup

### Install FFmpeg
```bash
sudo apt install ffmpeg
```

## FFmpeg Commands

### Segment original video (no re-encoding)
```bash
ffmpeg -i input.mp4 \
  -c copy \
  -sn \
  -hls_time 4 \
  -hls_playlist_type vod \
  -hls_segment_filename 'hls/segment%d.ts' \
  hls/playlist.m3u8
```

### Generate 720p segments
```bash
mkdir -p hls/720p

ffmpeg -i input.mp4 \
  -c:v libx264 -b:v 2800k \
  -vf scale=-2:720 \
  -c:a aac -b:a 128k \
  -sn \
  -hls_time 4 \
  -hls_playlist_type vod \
  -hls_segment_filename 'hls/720p/segment%d.ts' \
  hls/720p/playlist.m3u8
```

### Generate 360p segments
```bash
mkdir -p hls/360p

ffmpeg -i input.mp4 \
  -c:v libx264 -b:v 800k \
  -vf scale=-2:360 \
  -c:a aac -b:a 96k \
  -sn \
  -hls_time 4 \
  -hls_playlist_type vod \
  -hls_segment_filename 'hls/360p/segment%d.ts' \
  hls/360p/playlist.m3u8
```

## Run API
```bash
bun run index.js
```

## API Endpoints

| Endpoint | Description |
|---|---|
| GET /videos | List all videos |
| GET /video/:filename | Stream video file |
| GET /hls/playlist.m3u8 | HLS playlist |
| GET /hls/:segment | HLS segment |
| GET /hls/master.m3u8 | ABR master playlist |
| GET /hls/720p/playlist.m3u8 | 720p playlist |
| GET /hls/360p/playlist.m3u8 | 360p playlist |
| GET /player | Test player |

## HLS Folder Structure
```
hls/
  master.m3u8
  playlist.m3u8
  segment0.ts
  segment1.ts
  720p/
    playlist.m3u8
    segment0.ts
    segment1.ts
  360p/
    playlist.m3u8
    segment0.ts
    segment1.ts
```