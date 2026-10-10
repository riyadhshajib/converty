# Converty · Any video to MP3

Public beta: https://converty-tump3.web.app/

Native API: https://converty-tump3-api.onrender.com

Firebase project: `my-concept-riyad` (My Concept). Private source: `riyadhshajib/converty`. Render is authorized for this repository only. Both hosting services use free plans; Google Cloud billing is disabled.

The published service has converted real uploads, an Instagram sample and a TikTok sample to 320 kbps MP3. A 500 MiB upload boundary test also passed. Hosted YouTube, Facebook, Vimeo and Dailymotion samples failed; see LAUNCH-STATUS.md. Local success does not establish hosted availability. The UI discloses the YouTube/Facebook limitation.

## Run locally

Run `npm install`, `node node_modules/ffmpeg-static/install.js`, and `python -m pip install "yt-dlp[default,curl-cffi]"`. Then run `node start.mjs` and open http://127.0.0.1:5173. Node.js 22+ and Python are required. The production service starts with `npm start`.

Paste a supported public video link or upload your original video, up to 500 MiB. Choose 128–320 kbps MP3 and optional noise reduction/loudness normalization. MP3 is lossy; cleanup cannot restore missing source detail. Downloads append ` - converty- tump3.mp3`; the displayed title omits the file extension.

## Deploy

Render builds Docker from the private repository's main branch. Its free instance runs one conversion at a time. Firebase serves the static frontend. Build with `VITE_API_URL=https://converty-tump3-api.onrender.com`, then deploy Hosting explicitly to project `my-concept-riyad`. Do not deploy to AaloPro.

Read OWNER-OPERATIONS.md for configuration and security limits, LAUNCH-STATUS.md for observed results, and GROWTH.md for search and monetization priorities.
