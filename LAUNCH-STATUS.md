# Converty launch status

## Current release: cloud YouTube at 128 kbps

Updated 11 October 2026. Live: https://converty-tump3.web.app/

YouTube links now use Jaky API on the hosted Render server when JAKY_API_KEY is configured. This path takes priority over the older owner-PC worker, so the owner PC is not required. The credential is stored only in Render environment configuration; it is absent from frontend and repository code. Public YouTube URL processing is disclosed in Privacy.

Sintel was downloaded through the hosted API: HTTP 200, 14,209,580 bytes, 26.12 seconds total transfer, mode cloud-provider, actual 128 kbps stereo, 888.07 seconds. Full-file decode passed. This single warm-service measurement is not a speed or uptime guarantee.

The free provider advertises 100 API requests per day shared across the site. Failed requests may consume allowance. Render Free sleeps when idle and may add 50 seconds or more on wake-up. No paid plan was enabled. YouTube MP3 remains 128 kbps; file uploads and other supported platforms retain their existing quality options. A 320 kbps selection does not upscale YouTube audio, and the result reports actual quality.

Direct 320 kbps provider requests failed on two test videos with quality_too_high. This release uses the user-approved 128 kbps path. A 720p video request also returned a download URL, but is not used in production.

Existing SEO pages, canonical URLs, sitemap and Search Console setup remain. Indexing, growing traffic and revenue need continued measurement; no ranking or income guarantee is made.

## Previous release records

# Converty launch status

Verified 10 October 2026. Published beta: https://converty-tump3.web.app/

## Current release: four-platform repair

The supported link targets are now only YouTube, Facebook, TikTok and Instagram. All four passed through the published service after the repair. YouTube uses the explicitly approved owner-PC worker; Facebook uses a public watch-URL fallback for the same video ID. No personal login cookies were added.

| Source | Audio length | Server processing | Full API transfer | Parsed bitrate |
| --- | --- | --- | --- | --- |
| YouTube, Me at the zoo | 19.03 s | 5.69 s | Browser download completed | 320 kbps |
| YouTube, Big Buck Bunny | 634.61 s | 26.63 s | 115.26 s, 25.4 MB | 320 kbps |
| Facebook | 131.06 s | 19.85 s | 30.84 s | 320 kbps |
| TikTok | 12.70 s | 9.43 s | 11.34 s | 320 kbps |
| Instagram | 13.54 s | 9.99 s | 10.96 s | 320 kbps |

These are individual warm-service samples, not universal compatibility or typical-speed guarantees. The YouTube browser flow downloaded the correctly named file. See LIVE-WORKER-VERIFICATION.json for URLs, sizes and parsed durations. The second YouTube source and a second public Facebook source supplemented earlier regression cases.

The PC must stay awake, connected and running Start-Worker.ps1 for new YouTube jobs. Stop-Worker.ps1 was tested: it shut down the worker, closed the loopback converter port and changed public status to offline. The worker was then restarted. No public PC port, Windows service or automatic startup was added. The random worker key is DPAPI-encrypted outside the app and privately configured in Render; the temporary plaintext transfer file was removed. Native worker capacity is currently at most 12 starts/hour. See WORKER-SETUP.md for controls and resource costs.

Google live inspection now successfully fetches both the homepage and sitemap.xml. The sitemap fetch explicitly passed at 11:23 PM on 10 October. There are four platform guides and eight-URL XML/text sitemaps. Google sitemap ingestion still needs confirmation, and request indexing reached the daily quota. Indexing and rankings are not verified. Privacy copy discloses operator-managed YouTube processing.

Worker authentication, wrong leases, replay, size bounds and cancellation tests passed. A research startup probe briefly caused service restarts during development; it was removed before the final release. The hosted broker release is commit 9f3c4e8bc9466197adb22dc3bb8090d241c54eb9, deployment dep-db55l8fg0jfs73b66660. Documentation-only releases may follow.

Remaining before broad promotion: Google ingestion/indexing confirmation, complete sole-owner IAM review, a public support contact, representative long-video load testing and sustained availability. The older platform failures below are historical and superseded by the measurements above; Vimeo and Dailymotion are outside the current scope.

## Historical first-release record

## Ownership and cost

The separate Firebase project is My Concept (`my-concept-riyad`), with Hosting site `converty-tump3`. AaloPro was not used. Source is in the owner's private GitHub repository `riyadhshajib/converty`. The Render GitHub App is restricted to this single repository, as explicitly authorized. Render runs the API on its Free instance in Singapore. Firebase billing is disabled. No paid plan, custom domain purchase, ads or analytics were enabled.

The free address is a Firebase subdomain, not an independently registered custom domain. Account ownership was used for creation and Search Console verification. A complete sole-owner IAM/collaborator audit remains unfinished because the Firebase browser console failed to load its terms status. No collaborators were added by this work. Strong Google/GitHub account protection remains owner-controlled.

## Hosted conversion evidence

Warm-service samples; these are individual tests, not platform-wide guarantees or typical-speed benchmarks.

| Source | Result | Observed time | Detail |
| --- | --- | --- | --- |
| Original small MP4 upload | Passed | 0.68 s | Valid stereo 320 kbps MP3, about 2.06 s audio |
| Exact 500 MiB upload | Passed | Not recorded | Valid short MP4 with a padding atom; HTTP 200 and valid MP3. Does not benchmark a long video. |
| Instagram reel | Passed | 10.29 s | 13.536 s stereo MP3 at 320 kbps; downloaded through the published browser UI |
| TikTok video | Passed | 9.45 s | 12.7 s stereo MP3 at 320 kbps |
| YouTube video | Failed | 26.44 s before fast-failure fix | Platform asked for sign-in / bot verification from the hosted server |
| Facebook video | Failed | 9.70 s before fast-failure fix | Platform said video was available only to registered users |
| Vimeo video | Failed | 12.75 s before fast-failure fix | HTTP 401 Unauthorized |
| Dailymotion video | Failed | 12.79 s | No downloadable formats returned |

All six platforms had local successes earlier, but these do not establish hosted success. The most recent API change stops retrying the same source after an explicit access restriction, so users receive useful errors sooner. It does not unlock restricted videos. Public copy discloses the beta's YouTube/Facebook limitation.

Downloads use a cleaned source title and suffix ` - converty- tump3.mp3`. The visible title omits the .mp3 extension. Default quality is 320 kbps; optional cleanup reduces noise and balances volume. MP3 encoding is lossy and cannot recreate missing source information.

## Security and limits

Implemented and sampled: HTTPS, restrictive frontend security headers, allowed frontend origins, HTTPS platform-host allowlist, public-IP-only egress checks, playlist/protocol restrictions in FFmpeg, one active conversion, global/per-client rate limits, 500 MiB source/output bounds and processing timeouts. Uploads stream to temporary disk instead of buffering 500 MiB in RAM. Temporary jobs are cleaned up; small link results can be cached in memory for five minutes, bounded at 16 MiB.

Local tests rejected private/loopback destinations, host spoofing, unwanted origins, over-limit file declarations and a malicious playlist. The hosted exact-500 MiB upload passed. A subsequent hosted oversized-header-only probe ended with the provider closing the connection, so an explicit hosted HTTP 413 result is not proven. These checks are not a penetration test or a guarantee that a site cannot be hacked.

## SEO and unfinished work

The site has crawlable HTML, three platform guides, titles/descriptions, canonical URLs, robots.txt, sitemap.xml, About, Privacy, Terms and a true 404. Search Console ownership is verified and the sitemap submitted. Google currently reports it could not read the sitemap despite direct HTTP 200 / valid XML; successful ingestion and indexing are not verified. No ranking, traffic or revenue result is claimed.

Unfinished: reliable hosted YouTube/Facebook conversion, hosted Vimeo/Dailymotion success, complete owner-only IAM verification, a chosen public support contact, representative long-video load testing, and Google sitemap ingestion/indexing. The primary YouTube requirement is therefore not complete.

Render Free can sleep after inactivity and add roughly 50 seconds or more to the next request; free resources are limited. The beta is not an always-fast production capacity promise. See GROWTH.md for practical options and next priorities.

## Final deployed verification

Commit `0baae8970df5327991f89a41d1e89b9c3d5f9f45` is live on Render; Firebase Hosting version `7b81f22c12cb3d96` is deployed. After the fast-failure change, the YouTube sample returned its access restriction in 13.68 seconds. Instagram still converted successfully in 11.23 seconds at 320 kbps. A fresh original-file conversion was downloaded through the published browser UI and parsed as a valid 320 kbps MP3. The valid seven-entry sitemap was resubmitted; Search Console ingestion remains unverified. See FINAL-VERIFICATION.json.
