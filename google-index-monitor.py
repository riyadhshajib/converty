"""Read-only Google index/sitemap monitor; needs a short-lived OAuth token.

Prepared for cloud execution. No credentials are embedded or printed.
This API cannot submit manual indexing requests.
"""
import json
import os
import urllib.request
import urllib.error
from urllib.parse import quote
from datetime import datetime, timezone
from pathlib import Path

SITE = 'https://converty-tump3.web.app/'
URLS = [SITE, SITE+'youtube-to-mp3/', SITE+'facebook-video-to-mp3/']


def request(url, token, body=None):
    req = urllib.request.Request(url,
        data=None if body is None else json.dumps(body).encode(),
        headers={'Authorization': 'Bearer '+token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read(1024*1024+1)
            if len(raw)>1024*1024: raise ValueError('Response too large')
            return json.loads(raw)
    except urllib.error.HTTPError as error:
        # Do not include response bodies, request headers or tokens in reports.
        raise RuntimeError('Google API HTTP '+str(error.code)) from None


def summarize(url, data):
    result = data.get('inspectionResult', {})
    state = result.get('indexStatusResult', {})
    # PASS is Google's index verdict, not a successful live fetch or submission.
    verdict = state.get('verdict', 'VERDICT_UNSPECIFIED')
    return {'url': url, 'indexed': verdict == 'PASS', 'verdict': verdict,
            'coverage_state': state.get('coverageState', 'Unknown'),
            'last_crawl': state.get('lastCrawlTime'),
            'google_canonical': state.get('googleCanonical'),
            'inspection_link': result.get('inspectionResultLink')}


def collect(token):
    if not token: return {'pages': [], 'errors': [{'error': 'Short-lived Google authorization unavailable'}]}
    report = {'checked_at_utc': datetime.now(timezone.utc).isoformat(),
              'site': SITE, 'pages': [], 'errors': []}
    for url in URLS:
        try:
            data = request('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
                           token, {'inspectionUrl': url, 'siteUrl': SITE, 'languageCode': 'en-US'})
            report['pages'].append(summarize(url, data))
        except Exception as error:
            report['errors'].append({'url': url, 'error': str(error) if isinstance(error, RuntimeError) else type(error).__name__})
            # Stop on authentication, permission or quota errors, never retry blindly.
            break
    try:
        data = request('https://www.googleapis.com/webmasters/v3/sites/'+quote(SITE,safe='')+
                       '/sitemaps/'+quote(SITE+'sitemap.xml',safe=''), token)
        report['sitemap'] = {key:data.get(key) for key in
                             ('path','lastSubmitted','lastDownloaded','isPending','errors','warnings')}
    except Exception as error:
        report['errors'].append({'resource':'sitemap', 'error':str(error) if isinstance(error,RuntimeError) else type(error).__name__})
    return report


def main():
    report = collect(os.environ.get('GSC_ACCESS_TOKEN'))
    Path('google-index-latest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))
    if report['errors']: raise SystemExit(1)


if __name__ == '__main__': main()
