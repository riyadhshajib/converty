YouTube cloud update (11 October 2026): set JAKY_API_KEY privately on Render to enable hosted 128 kbps YouTube MP3 conversion without the owner PC. The free provider advertises 100 requests/day. Actual quality is shown after conversion. See LAUNCH-STATUS.md and CLOUD-YOUTUBE-VERIFICATION.json. Earlier worker notes below describe the fallback setup.

# Converty · Any video to MP3

Public beta: https://converty-tump3.web.app/

Native API: https://converty-tump3-api.onrender.com

Firebase project: `my-concept-riyad` (My Concept). Private source: `riyadhshajib/converty`. Render is authorized for this repository only. Both hosting services use free plans; Google Cloud billing is disabled.

The published service has converted real YouTube, Facebook, Instagram and TikTok samples to 320 kbps MP3. These four platforms are the supported link targets. YouTube uses the explicitly approved owner-PC worker; this PC must stay awake, online and running the worker. The other platforms and original-file uploads use the hosted converter. A 500 MiB upload boundary test also passed. See LAUNCH-STATUS.md for measured results and limits, and WORKER-SETUP.md for start/stop controls.

## Run locally

Run `npm install`, `node node_modules/ffmpeg-static/install.js`, and `python -m pip install "yt-dlp[default,curl-cffi]"`. Then run `node start.mjs` and open http://127.0.0.1:5173. Node.js 22+ and Python are required. The production service starts with `npm start`.

Paste a supported public video link or upload your original video, up to 500 MiB. Choose 128–320 kbps MP3 and optional noise reduction/loudness normalization. MP3 is lossy; cleanup cannot restore missing source detail. Downloads append ` - converty- tump3.mp3`; the displayed title omits the file extension.

## Deploy

Render builds Docker from the private repository's main branch. Its free instance runs one conversion at a time. Firebase serves the static frontend. Build with `VITE_API_URL=https://converty-tump3-api.onrender.com`, then deploy Hosting explicitly to project `my-concept-riyad`. Do not deploy to AaloPro.

Read OWNER-OPERATIONS.md for configuration and security limits, LAUNCH-STATUS.md for observed results, and GROWTH.md for search and monetization priorities.
