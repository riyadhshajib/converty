# Converty launch status

Verified 10 October 2026. Published beta: https://converty-tump3.web.app/

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
