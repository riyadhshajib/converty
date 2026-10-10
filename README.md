# Converty · Any video to MP3

Run `node start.mjs` from this folder, then open http://127.0.0.1:5173.

Requires Node.js and Python with `yt-dlp` installed (`python -m pip install "yt-dlp[default,curl-cffi]"`). Dependencies are already installed on this computer. For a fresh setup run `npm install` and `node node_modules/ffmpeg-static/install.js`.

Paste a supported public video link or upload an original file (up to 500 MB). Choose 128–320 kbps MP3 and optional noise reduction/loudness normalization. The API requests the best available audio for links, uses native FFmpeg, and deletes temporary job files. Link results may be cached in bounded memory for five minutes.

Local samples from YouTube, Facebook, Instagram, TikTok, Vimeo and Dailymotion have converted successfully. This is sample coverage, not a guarantee for every video. The new guarded API has separately passed a real upload and YouTube conversion. Protected or authenticated sources may fail. Cleanup cannot recreate lost source detail. Speed depends on source downloads, duration, processing and hardware.

The Dockerfile packages the native API for Render. Firebase Hosting serves the Vite frontend. Set VITE_API_URL to the deployed API origin when building the frontend. See OWNER-OPERATIONS.md for limits and deployment steps. Public deployment and production verification are still pending.
