import {randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {audioDownloadName} from './naming.js';

// Disabled unless the owner explicitly configures a private worker token.
// Workers make outbound HTTPS requests; no port on the owner's PC is exposed.
export function createWorkerBroker({token='',maxBytes=500*1024*1024,timeoutMs=600000}={}){
 const enabled=token.length>=32,jobs=new Map();let lastSeen=0;
 const digest=value=>createHash('sha256').update(value).digest();
 const authorized=req=>enabled&&timingSafeEqual(digest(String(req.headers.authorization||'')),digest('Bearer '+token));
 const send=(res,status,body='')=>{if(!res.destroyed&&!res.headersSent){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(body);}};
 const failure=message=>Object.assign(new Error(message),{status:503});
 async function handle(req,res,url){
  if(!url.pathname.startsWith('/internal/worker/'))return false;
  if(!enabled){send(res,404);return true;}
  if(!authorized(req)){send(res,401);return true;}
  lastSeen=Date.now();
  if(url.pathname==='/internal/worker/next'&&req.method==='GET'){
   const job=[...jobs.values()].find(j=>!j.claimed&&!j.done);
   if(!job){send(res,204);return true;}
   job.claimed=true;
   send(res,200,JSON.stringify({id:job.id,lease:job.lease,url:job.url,quality:job.quality,enhance:job.enhance,deadline:job.deadline}));return true;
  }
  const match=url.pathname.match(/^\/internal\/worker\/(result|error)\/([a-f0-9-]+)$/);
  if(!match||req.method!=='POST'){send(res,404);return true;}
  const job=jobs.get(match[2]);
  if(!job||job.done||!job.claimed||job.writer||req.headers['x-worker-lease']!==job.lease){send(res,409);return true;}
  if(match[1]==='error'){
   let size=0;try{for await(const b of req){size+=b.length;if(size>4096)throw Error('Too large');}job.settle(failure('The processing worker could not access this video. Please try your original file.'));send(res,200,'{}');}catch{send(res,400);}
   return true;
  }
  if(req.headers['content-type']!=='audio/mpeg'||Number(req.headers['content-length'])>maxBytes){send(res,413);job.settle(failure('The processing result exceeded the allowed size.'));return true;}
  let filename;try{filename=audioDownloadName(decodeURIComponent(String(req.headers['x-converty-filename']||'Untitled audio').slice(0,1800)));}catch{send(res,400);job.settle(failure('Invalid audio filename.'));return true;}
  let size=0;
  const limit=new Transform({transform(chunk,encoding,done){size+=chunk.length;done(size>maxBytes?Error('Audio exceeds size limit'):null,chunk);}});
  job.writer=pipeline(req,limit,createWriteStream(job.output,{flags:'wx'}),{signal:job.abort.signal});
  try{await job.writer;if(!size)throw Error('Empty result');if(!job.cancelled){job.settle(null,{filename});send(res,200,'{}');}}
  catch{job.settle(failure('The processing connection ended before the MP3 was complete.'));send(res,400);}
  return true;
 }
 function dispatch({url,quality,enhance,output,signal}){
  if(!enabled||Date.now()-lastSeen>30000)return Promise.reject(failure('The private processing worker is offline.'));
  if(jobs.size)return Promise.reject(failure('The private processing worker is busy.'));
  return new Promise((resolve,reject)=>{
   const id=randomUUID(),job={id,lease:randomUUID(),url,quality,enhance,output,deadline:Date.now()+timeoutMs,abort:new AbortController()};
   const cancel=()=>{if(job.done)return;job.cancelled=true;job.abort.abort();const finish=()=>job.settle(failure('The processing request was cancelled or timed out.'));if(job.writer)job.writer.then(finish,finish);else finish();};
   const timer=setTimeout(cancel,timeoutMs);
   job.settle=(error,result)=>{if(job.done)return;job.done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);jobs.delete(id);error?reject(error):resolve(result);};
   jobs.set(id,job);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  });
 }
 return {handle,dispatch,isOnline:()=>enabled&&Date.now()-lastSeen<30000};
}
