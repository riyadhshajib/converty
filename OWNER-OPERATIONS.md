# Converty operations

Owner accounts: Firebase project `my-concept-riyad`, Hosting site `converty-tump3`, private GitHub repository `riyadhshajib/converty`, and the owner's Render workspace. Do not add collaborators or enable billing without owner instruction.

The frontend is a static Vite build. Set `VITE_API_URL` to the verified Render HTTPS URL before `npm run build`, and update the `connect-src` host in firebase.json. Deploy only Hosting with explicit project `my-concept-riyad`. Do not target AaloPro.

Render: Docker runtime, Free instance, one conversion at a time, health endpoint `/api/health`. No database or persistent disk is needed. Use `HOST=0.0.0.0`, `PORT=10000`, and set `ALLOWED_ORIGINS` to the two Converty Firebase hosts. The Docker image runs as a non-root user. Its only copied application files are the conversion service modules.

The API accepts allowlisted HTTPS platform hosts. A local egress proxy resolves and blocks private, loopback, multicast, reserved and link-local destinations before connecting, including redirects and media requests made through yt-dlp. FFmpeg allows local file/pipe protocols and a restricted set of media demuxers. This reduces SSRF and malicious playlist risk. It is not a guarantee against every vulnerability in third-party codecs or platforms.

Limits: 500 MiB source, 500 MiB MP3 maximum, two-hour link duration, ten-minute individual processing deadline, one active job, 60 starts/hour globally and 12/hour per observed client. Per-client limits supplement the global limit; forwarded IP headers must not be treated as authentication. The MP3 cache is memory-only, at most 16 MiB for five minutes, and has no browse/list endpoint. Jobs use temporary folders and remove them after processing. Unexpected process termination relies on ephemeral host storage; verify restart cleanup and provider retention before promising stronger deletion guarantees.

Security headers are configured for the Firebase frontend. CORS permits the configured frontend hosts; CORS alone is not authentication or bot protection. Public APIs may be abused within the global budget. Review metrics and suspend the service if abuse consumes the free quota.

Owner actions later: enable strong Google/GitHub account protection; inspect collaborator/IAM lists; verify Search Console; set a public support contact; review privacy requirements before enabling advertising or analytics. No analytics or ads are installed today. Routine runtime access logs are controlled by the hosting providers.
