import {validateSource} from './network-guard.js';
import {writeFile,access} from 'node:fs/promises';

// Explicit foreground command only. No Windows service or automatic startup.
const remote=new URL(process.env.CONVERTY_PUBLIC_API||'https://converty-tump3-api.onrender.com');
const local=new URL(process.env.CONVERTY_LOCAL_API||'http://127.0.0.1:5174');
const token=process.env.CONVERTY_WORKER_TOKEN||'';
if((remote.protocol!=='https:'&&remote.hostname!=='127.0.0.1')||remote.username||remote.password)throw Error('Worker endpoint must use HTTPS.');
if(local.protocol!=='http:'||local.hostname!=='127.0.0.1')throw Error('The conversion API must be on IPv4 loopback.');
if(token.length<32)throw Error('Set an owner-only worker token of at least 32 characters.');
const headers={Authorization:'Bearer '+token};
const stop=new AbortController();for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>stop.abort());
const stopCheck=process.env.CONVERTY_WORKER_STOP_FILE?setInterval(()=>access(process.env.CONVERTY_WORKER_STOP_FILE).then(()=>stop.abort()).catch(()=>{}),1000):null;
let jobs=0;
async function next(){return fetch(new URL('/internal/worker/next',remote),{headers,signal:AbortSignal.any([stop.signal,AbortSignal.timeout(20000)])});}
console.log('Converty private worker started. Only public YouTube links are processed. Ctrl+C stops it.');
while(!stop.signal.aborted){
 try{
  const poll=await next();if(poll.status===401||poll.status===404)throw Error('Worker authorization is not configured on the website.');
  if(poll.status!==200){await new Promise(r=>setTimeout(r,3000));continue;}
  const job=await poll.json();
  const url=validateSource(job.url);
  if(!/(^|\.)(youtube\.com|youtu\.be)$/.test(url.hostname)||!['128','192','256','320'].includes(String(job.quality))||!/^[-a-f0-9]{36}$/.test(job.id)||!/^[-a-f0-9]{36}$/.test(job.lease))throw Error('Invalid worker job.');
  const deadline=Math.min(Number(job.deadline)||0,Date.now()+600000)-Date.now();if(deadline<=0)continue;
  const signal=AbortSignal.any([stop.signal,AbortSignal.timeout(deadline)]);
  const heartbeat=setInterval(()=>next().then(r=>r.body?.cancel()).catch(()=>{}),10000);
  try{
   const converted=await fetch(new URL('/api/link',local),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href,quality:job.quality,enhance:job.enhance===true}),signal});
   if(!converted.ok)throw Error('Source conversion failed.');
   const result=await fetch(new URL('/internal/worker/result/'+job.id,remote),{method:'POST',headers:{...headers,'X-Worker-Lease':job.lease,'Content-Type':'audio/mpeg','X-Converty-Filename':converted.headers.get('X-Converty-Filename')||'Untitled audio'},body:converted.body,duplex:'half',signal});
   if(!result.ok)throw Error('Website rejected the result.');
   jobs++;console.log('Completed private worker job',jobs);
   if(process.env.CONVERTY_WORKER_ONCE==='1')stop.abort();
  }catch(error){if(!stop.signal.aborted)await fetch(new URL('/internal/worker/error/'+job.id,remote),{method:'POST',headers:{...headers,'X-Worker-Lease':job.lease,'Content-Type':'application/json'},body:'{"error":"conversion_failed"}',signal:AbortSignal.timeout(15000)}).catch(()=>{});console.error(error.message);}
  finally{clearInterval(heartbeat);}
 }catch(error){if(!stop.signal.aborted){console.error(error.message);await new Promise(r=>setTimeout(r,5000));}}
}
if(stopCheck)clearInterval(stopCheck);
if(process.env.CONVERTY_WORKER_REPORT)await writeFile(process.env.CONVERTY_WORKER_REPORT,JSON.stringify({completed:jobs,stoppedAt:new Date().toISOString()}));
