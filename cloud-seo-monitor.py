"""Bounded public SEO checks. No Google credentials or conversion requests."""
import os, json, urllib.request, urllib.error, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

BASE = 'https://converty-tump3.web.app'
MARKER = '<!-- converty-cloud-seo-monitor -->'
LIMIT = 1024 * 1024

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonicals=[]; self.noindex=False; self.h1=0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='link' and a.get('rel')=='canonical': self.canonicals.append(a.get('href'))
        if tag=='meta' and a.get('name','').lower() in ('robots','googlebot'):
            self.noindex |= 'noindex' in a.get('content','').lower()
        if tag=='h1': self.h1+=1

def fetch(url):
    if not url.startswith(BASE+'/'): raise ValueError('Outside monitored site')
    request=urllib.request.Request(url,headers={'User-Agent':'Converty-Public-SEO-Monitor/1.0'})
    with urllib.request.urlopen(request,timeout=12) as response:
        if not response.url.startswith(BASE+'/'): raise ValueError('Unexpected redirect')
        body=response.read(LIMIT+1)
        if len(body)>LIMIT: raise ValueError('Response too large')
        return response.status, body.decode('utf-8'), response.headers

def page(url):
    for attempt in range(2):
        try:
            status,html,headers=fetch(url); parsed=Metadata();parsed.feed(html)
            noindex=parsed.noindex or 'noindex' in headers.get('X-Robots-Tag','').lower()
            return {'url':url,'status':status,'canonical_ok':parsed.canonicals==[url],
                    'indexing_blocked':noindex,'h1_count':parsed.h1}
        except Exception as error:
            if attempt: return {'url':url,'error':type(error).__name__}

def github(path,method='GET',data=None):
    token=os.environ['GH_TOKEN'];repo=os.environ['GITHUB_REPOSITORY']
    if repo!='riyadhshajib/converty': raise ValueError('Unexpected repository')
    request=urllib.request.Request('https://api.github.com/repos/'+repo+'/'+path,
        data=None if data is None else json.dumps(data).encode(),method=method,
        headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json',
                 'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'})
    with urllib.request.urlopen(request,timeout=20) as response: return json.load(response)

def main():
    results={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'site':BASE,
             'google_index_status':'Not checked: no Search Console access authorized'}
    problems=[]
    try:
        status,robots,_=fetch(BASE+'/robots.txt');results['robots_status']=status
        results['sitemap_declared']=('Sitemap: '+BASE+'/sitemap.xml') in robots
        if not results['sitemap_declared']: problems.append('robots.txt sitemap declaration missing')
        if any(line.strip().lower()=='disallow: /' for line in robots.splitlines()): problems.append('robots.txt has a site-wide crawl block')
    except Exception as e: results['robots_error']=type(e).__name__;problems.append('robots.txt unavailable')
    try:
        status,xml,_=fetch(BASE+'/sitemap.xml');root=ET.fromstring(xml)
        if root.tag!='{http://www.sitemaps.org/schemas/sitemap/0.9}urlset': raise ValueError('Invalid sitemap root')
        urls=[e.text for e in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        if not urls or len(urls)>20 or any(not u or not u.startswith(BASE+'/') for u in urls): raise ValueError('Invalid sitemap URLs')
        results['sitemap_status']=status;results['sitemap_urls']=len(urls)
    except Exception as e: results['sitemap_error']=type(e).__name__;problems.append('Sitemap unavailable or invalid');urls=[BASE+'/']
    with ThreadPoolExecutor(max_workers=3) as pool: results['pages']=list(pool.map(page,urls))
    for item in results['pages']:
        if 'error' in item or item.get('status')!=200 or not item.get('canonical_ok') or item.get('indexing_blocked') or item.get('h1_count')!=1:
            problems.append('Page check failed: '+item['url'])
    results['problems']=problems
    Path('cloud-seo-latest.json').write_text(json.dumps(results,indent=2))
    lines=[MARKER,'## Converty cloud SEO check',f"সময় (UTC): {results['checked_at_utc']}",
           '[Converty খুলুন]('+BASE+'/)',
           ('Public checks: সব ঠিক আছে।' if not problems else 'Public checks: সমস্যা পাওয়া গেছে।'),
           f"Sitemap URLs: {results.get('sitemap_urls','unavailable')}; checked pages: {len(results['pages'])}.",
           'Google indexing/quota পরীক্ষা করা হয়নি; আপনার নির্দেশ অনুযায়ী Google access যোগ করা হয়নি।',
           'এই run-এ শুধু পরীক্ষা করা হয়েছে, site code বা settings পরিবর্তন করা হয়নি।',
           'পরে আবার public checks হবে। সমস্যা থাকলে এই report অনুযায়ী তদন্ত প্রয়োজন।']
    lines.extend('- '+p for p in problems)
    report='\n\n'.join(lines)
    summary=os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary,'a',encoding='utf-8') as f:f.write(report+'\n')
    print(json.dumps(results,indent=2))
    if os.environ.get('GH_TOKEN'):
        issues=github('issues?state=all&per_page=100')
        existing=next((i for i in issues if not i.get('pull_request') and MARKER in (i.get('body') or '')),None)
        if existing and existing['state']=='closed': print('Report issue is closed; no comments added.')
        elif existing:
            github(f"issues/{existing['number']}",'PATCH',{'body':report})
            github(f"issues/{existing['number']}/comments",'POST',{'body':'@riyadhshajib\n\n'+report})
        else: github('issues','POST',{'title':'Converty cloud SEO updates','body':'@riyadhshajib\n\n'+report})
    if problems: raise SystemExit(1)

if __name__=='__main__':main()
