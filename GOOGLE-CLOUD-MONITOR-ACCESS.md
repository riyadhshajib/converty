# Converty Google cloud monitor: active and verified

The owner approved this limited access on 11 October 2026. A real GitHub-hosted run succeeded in 29 seconds:
https://github.com/riyadhshajib/converty/actions/runs/38075946162

Reports and owner mentions: https://github.com/riyadhshajib/converty/issues/1
The owner is subscribed. Email delivery depends on GitHub notification settings.

Runs every six hours at minute 23 UTC, independently of the owner PC. Free GitHub Actions minutes and Google API quotas apply; scheduled jobs may be delayed.

## Exact access

- Project my-concept-riyad, billing disabled.
- Dedicated account converty-index-monitor@my-concept-riyad.iam.gserviceaccount.com.
- Restricted Search Console access to https://getconverty.web.app/ and the previously approved legacy https://converty-tump3.web.app/ property. Current monitoring targets the new property only.
- OAuth webmasters.readonly; no project/deployment roles or permanent keys.
- Workload federation only numeric repository 1413290783, owner 107061854, main branch, exact .github/workflows/cloud-seo-monitor.yml workflow, schedule or workflow_dispatch events.
- Tokens expire after 600 seconds. Auth action is pinned to official v3 commit.
- Revoke by removing the Search Console user or the dedicated account federation binding.

## First real results

All eight public pages passed. Google reports homepage Crawled - currently not indexed; YouTube and Facebook guides URL is unknown to Google. Sitemap processing is pending, no last download, zero reported errors/warnings. These are real API results with Restricted access, not a simulated test.

The issue stores index-state history. A new PASS verdict produces an explicit indexed alert and owner mention. Transition logic was tested locally; no actual indexed transition has occurred yet. API/auth errors are reported separately from an unindexed page.

Read-only cloud checks cannot submit manual indexing requests. The local follow-up retains manual request work when the signed-in browser and quota are available. Do not widen permissions without owner approval.
