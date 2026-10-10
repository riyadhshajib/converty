# Optional private YouTube worker

Status: activated on 10 October 2026 after the owner explicitly approved using this PC. The published browser converted and downloaded the YouTube video Me at the zoo in 5.69 seconds. The downloaded file was independently parsed as 19.032 seconds of MP3 at 320,000 bits/second.

## What the free alternative does

The published site stays on Firebase and Render. An owner-run worker on this computer requests queued YouTube conversions through outbound HTTPS, processes one public video at a time with the existing native converter, and returns MP3 data to Render. No inbound port, router forwarding, browser cookies or account passwords are required. The worker's key is separate from the owner's Google, GitHub and Render credentials.

Facebook, TikTok, Instagram and original uploads continue to use the hosted converter. A 32-byte random worker secret must be configured privately in Render and the local process, never in GitHub or frontend code. Without a configured secret, worker endpoints return 404 and public YouTube conversion remains unavailable.

## Owner tradeoffs

- This computer and the worker must remain running and connected for YouTube conversions. Closing the worker, sleep or shutdown removes that capacity.
- Public visitors' jobs consume this computer's CPU, temporary disk and Internet upload/download data. No extra hosting fee does not mean no resource usage.
- Existing limits remain: one job, bounded size/time and rate limits. This is a small beta setup, not a guarantee of unlimited visitors or permanent platform availability.
- No Windows service, login startup task or persistent public listener is installed. The worker runs only through an explicit foreground command and stops with Ctrl+C.

## Start and stop on this owner PC

Run `Start-Worker.ps1` with PowerShell from this folder. It starts a private converter on 127.0.0.1:5175 and a foreground worker. Keep the terminal and PC running. Run `Stop-Worker.ps1` in another PowerShell window, or press Ctrl+C in the worker terminal. No startup task, Windows service or public listening port is installed.

The encrypted worker key is stored outside the application, in this workspace's `work/private/converty-worker.secret`, protected by Windows DPAPI for this Windows account. The temporary plaintext transfer file was removed after Render saved the key. Do not commit the private directory, copy the key into the frontend, or share it. Copying this launcher to another PC does not copy authorization.

This setup currently permits at most 12 native YouTube jobs per hour because all worker calls share one local client limit, in addition to the hosted limits. The status endpoint reports whether a worker has contacted the service within 30 seconds. Cached results may remain available briefly after it stops.

## Deployment configuration

1. Deploy api.js, worker-broker.js and the Dockerfile which copies the broker. Clearing CONVERTY_WORKER_TOKEN disables the worker endpoints.
2. Generate a cryptographically random 32-byte secret. Save it using Windows DPAPI for the owner; exclude it from source control. Configure the same secret in Render's private environment settings.
3. Start the native API bound to 127.0.0.1, with no broker secret in its environment, so jobs cannot route recursively. Start owner-worker.mjs with CONVERTY_PUBLIC_API, CONVERTY_LOCAL_API and CONVERTY_WORKER_TOKEN in the worker process environment only.
4. Test YouTube from the published browser, verify the downloaded MP3 and its filename, then update availability copy only when the public end-to-end flow passes.

## Evidence

Local full-chain tests used the broker, its bearer authentication, the worker, native video conversion, streamed result upload and the public-style API response. The two outputs were Me at the zoo (9.61 seconds) and Big Buck Bunny (39.75 seconds). These timings are local prototype measurements, not hosted customer benchmarks. Authentication, wrong leases, result replay, size limits and cancellation were separately exercised. See worker test evidence alongside the launch report.

Cloud-only options include a provider with permitted, reliable source access and paid dedicated capacity. Neither a payment nor switching libraries guarantees that YouTube accepts a datacenter's requests. Cobalt's own documentation says it has no pre-hosted public API; it requires an instance and platform-specific handling. We did not attach a random third-party converter or a personal login cookie to the public app.
