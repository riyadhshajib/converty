import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,readdir,readFile,rm,open,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {audioDownloadName} from './naming.js';
import {streamConvert} from './stream-safe.js';
import {validateSource,startNetworkGuard,facebookPublicAlternative} from './network-guard.js';
import {FFMPEG,PYTHON,MAX_BYTES,MAX_TIME,CLEANUP,INPUT_OPTIONS,downloadArgs,isPlatformRestricted} from './conversion-config.js';
import {createWorkerBroker} from './worker-broker.js';
import {cloudAudio} from './cloud-audio.js';
import {createProgressReader,durationFromLog} from './conversion-progress.js';
import {AUDIO_FORMATS,encoderOptions,qualityLabel} from './audio-formats.js';

const origins=new Set((process.env.ALLOWED_ORIGINS||'http://127.0.0.1:5173,http://localhost:5173,https://converty-tump3.web.app,https://converty-tump3.firebaseapp.com').split(','));
const guard=await startNetworkGuard();
const broker=createWorkerBroker({token:process.env.CONVERTY_WORKER_TOKEN,maxBytes:MAX_BYTES,timeoutMs:MAX_TIME});
let active=0;const clients=new Map(),cache=new Map();let globalStarts=[];
const progressJobs=new Map();
function updateProgress(id,state){if(id)progressJobs.set(id,{...state,updatedAt:Date.now()});}
const MAX_CACHE=16*1024*1024;const TTL=300000;
function fail(message,status=400){return Object.assign(new Error(message),{status});}
function respond(res,status,text){if(res.destroyed||res.headersSent)return;res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8'});res.end(text);}
function rateLimit(req){
 const now=Date.now();for(const [key,times]of clients)if(!times.some(t=>t>now-3600000))clients.delete(key);
 // Rate limits are supplemental; the global budget and concurrency bound do not trust client headers.
 const key=process.env.RENDER?String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
 const times=(clients.get(key)||[]).filter(t=>t>now-3600000);globalStarts=globalStarts.filter(t=>t>now-3600000);
 if(times.length>=12||times.filter(t=>t>now-60000).length>=3||globalStarts.length>=60||clients.size>5000)throw fail('Conversion limit reached. Please try again later.',429);
 times.push(now);clients.set(key,times);globalStarts.push(now);
}
async function run(command,args,{signal,dir,onProgress}={}){
 await new Promise((resolve,reject)=>{
  const proc=spawn(command,args,{windowsHide:true,stdio:['ignore',onProgress?'pipe':'ignore','pipe']});let error,diagnostic='',duration=null;
  if(onProgress)proc.stdout.on('data',createProgressReader({duration:()=>duration,report:onProgress}));
  const stop=e=>{error??=e;proc.kill('SIGKILL');};const aborted=()=>stop(fail('Conversion cancelled.'));
  const timer=setTimeout(()=>stop(fail('Conversion timed out. Try a shorter video.',408)),MAX_TIME);
  const diskTimer=dir?setInterval(async()=>{try{for(const entry of await readdir(dir)){if((await stat(path.join(dir,entry))).size>MAX_BYTES)stop(fail('The source or audio exceeds 500 MB.',413));}}catch{}},500):undefined;
  proc.stderr.on('data',b=>{diagnostic=(diagnostic+b).slice(-1800);duration??=durationFromLog(diagnostic);});proc.on('error',e=>{error=e;});signal?.addEventListener('abort',aborted,{once:true});if(signal?.aborted)aborted();
  proc.on('close',code=>{clearTimeout(timer);clearInterval(diskTimer);signal?.removeEventListener('abort',aborted);if(code===0&&!error){resolve();return;}const detail=diagnostic.replace(/https?:\/\/\S+/g,'[source URL]').slice(-1200);console.error('Conversion tool failure:',error?.code||code,detail);const blocked=isPlatformRestricted(diagnostic);reject(error||fail(blocked?'The platform is restricting access from our server. Please upload your original video instead.':'This source is unavailable or has no supported audio. Try uploading your original video.'));});
 });
}
async function encode(input,output,quality,enhance,context,format='mp3'){
 context.onProgress?.({stage:enhance?'Cleaning up and converting audio':'Converting audio',percent:null});
 const args=['-hide_banner','-loglevel',context.onProgress?'info':'error','-nostdin','-y',...INPUT_OPTIONS,'-i',input,'-map','0:a:0','-vn'];if(enhance)args.push('-af',CLEANUP);
 if(context.onProgress)args.push('-progress','pipe:1','-nostats');
 args.push('-threads','1',...encoderOptions(format,quality),'-fs',String(MAX_BYTES),output);await run(FFMPEG,args,context);
 if((await stat(output)).size>=MAX_BYTES)throw fail('The audio exceeds 500 MB.',413);
}
function saveCache(key,data,headers){
 if(data.length>MAX_CACHE)return;const now=Date.now();for(const [k,v]of cache)if(v.expires<now)cache.delete(k);
 let bytes=[...cache.values()].reduce((n,v)=>n+v.data.length,0);while(bytes+data.length>MAX_CACHE&&cache.size){const key=cache.keys().next().value;bytes-=cache.get(key).data.length;cache.delete(key);}cache.set(key,{data,headers,expires:now+TTL});
}
const server=http.createServer({maxHeaderSize:16384,requestTimeout:MAX_TIME,headersTimeout:20000},async(req,res)=>{
 const started=performance.now(),origin=req.headers.origin;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
 if(origin&&!origins.has(origin)){respond(res,403,'This origin is not allowed.');return;}
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Expose-Headers','Content-Length,X-Converty-Filename,X-Converty-Seconds,X-Converty-Mode,X-Converty-Quality,X-Converty-Format,X-Converty-Quality-Label');}
 let route;try{route=new URL(req.url,'http://localhost');}catch{respond(res,400,'Invalid request.');return;}
 if(route.pathname==='/api/health'&&req.method==='GET'){respond(res,200,'ready');return;}
 if(route.pathname==='/api/status'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({youtubeWorkerOnline:broker.isOnline(),youtubeCloudAvailable:!!process.env.JAKY_API_KEY,audioFormats:Object.keys(AUDIO_FORMATS)}));return;}
 if(route.pathname==='/api/progress'&&req.method==='GET'){
  const id=route.searchParams.get('job');const state=progressJobs.get(id);
  if(!state||Date.now()-state.updatedAt>MAX_TIME+300000){respond(res,404,'Progress not available.');return;}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(state));return;
 }
 if(await broker.handle(req,res,route))return;
 if(!['/api/link','/api/file'].includes(route.pathname)){respond(res,404,'Not found.');return;}
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});res.end();return;}
 if(req.method!=='POST'){respond(res,405,'Use POST.');return;}
 let dir,claimed=false,jobId;const abort=new AbortController();res.on('close',()=>{if(!res.writableFinished)abort.abort();});
 try{
  rateLimit(req);
  if(active>=Number(process.env.MAX_CONCURRENT||1))throw fail('The converter is busy. Please try again shortly.',429);
  active++;claimed=true;
  const format=route.searchParams.get('format')||'mp3';if(!Object.hasOwn(AUDIO_FORMATS,format))throw fail('Choose MP3, M4A, WAV, FLAC or OGG.');
  const proposedId=route.searchParams.get('job');
  if(proposedId&&/^[a-f0-9-]{36}$/.test(proposedId)&&!progressJobs.has(proposedId)){
   for(const [id,state]of progressJobs)if(Date.now()-state.updatedAt>MAX_TIME+300000)progressJobs.delete(id);
   if(progressJobs.size<1024){jobId=proposedId;updateProgress(jobId,{stage:'Preparing source audio',percent:null});}
  }
  let source,cacheKey,quality,enhance;
  if(route.pathname==='/api/link'){
   if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail('Send a JSON video link.',415);
   if(Number(req.headers['content-length'])>4096)throw fail('Request too large.',413);
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)throw fail('Request too large.',413);}
   let data;try{data=JSON.parse(body);}catch{throw fail('Invalid video request.');}
   if(!data||typeof data.url!=='string')throw fail('Paste a video link.');
   try{source=validateSource(data.url);}catch(e){throw fail(e.message);}
   quality=['128','192','256','320'].includes(String(data.quality))?String(data.quality):'320';enhance=data.enhance===true;
   cacheKey=JSON.stringify([source.href,quality,enhance,format]);const cached=cache.get(cacheKey);
   if(cached&&cached.expires>Date.now()){res.writeHead(200,{...cached.headers,'X-Converty-Seconds':((performance.now()-started)/1000).toFixed(2),'X-Converty-Mode':'cache'});res.end(cached.data);return;}
  }else{
   if(Number(req.headers['content-length'])>MAX_BYTES)throw fail('This video exceeds 500 MB.',413);
   quality=['128','192','256','320'].includes(route.searchParams.get('quality'))?route.searchParams.get('quality'):'320';enhance=route.searchParams.get('enhance')==='true';
  }
  dir=await mkdtemp(path.join(tmpdir(),'converty-'));const output=path.join(dir,`audio.${format}`);const context={signal:abort.signal,dir,onProgress:state=>updateProgress(jobId,state)};let metadata={},mode='file';
  if(!source){
   const input=path.join(dir,'source');const handle=await open(input,'w');let size=0;
   try{for await(const chunk of req){size+=chunk.length;if(size>MAX_BYTES)throw fail('This video exceeds 500 MB.',413);await handle.write(chunk);}}finally{await handle.close();}
   if(!size)throw fail('Choose a video file.');await encode(input,output,quality,enhance,context,format);
  }else if(process.env.JAKY_API_KEY&&/(^|\.)(youtube\.com|youtu\.be)$/.test(source.hostname)){
   metadata=await cloudAudio({url:source.href,output,signal:abort.signal,maxBytes:MAX_BYTES,timeoutMs:MAX_TIME,key:process.env.JAKY_API_KEY,onProgress:context.onProgress});quality='128';mode='cloud-provider';
   if(enhance||format!=='mp3'){const input=path.join(dir,'cloud.mp3');await (await import('node:fs/promises')).rename(output,input);await encode(input,output,quality,enhance,context,format);}
  }else if(broker.isOnline()&&/(^|\.)(youtube\.com|youtu\.be)$/.test(source.hostname)){
   const result=await broker.dispatch({url:source.href,quality,enhance,output,signal:abort.signal});metadata.title=result.filename;mode='private-worker';
   if(format!=='mp3'){const input=path.join(dir,'worker.mp3');await (await import('node:fs/promises')).rename(output,input);await encode(input,output,quality,false,context,format);}
  }else{
   const streamSource=url=>streamConvert({url,proxy:guard.url,metadataPath:path.join(dir,'stream.info.json'),outputPath:output,quality,enhance,format,signal:abort.signal,onProgress:context.onProgress});
   try{
    try{await streamSource(source.href);}
    catch(e){const alternative=facebookPublicAlternative(source.href);if(e.code!=='PLATFORM_RESTRICTED'||!alternative||abort.signal.aborted)throw e;source=alternative;await streamSource(source.href);}
    mode='stream';
   }
   catch(e){
    if(abort.signal.aborted||e.code==='PLATFORM_RESTRICTED')throw e;
    if(/exceeds|timed out/.test(e.message))throw fail(e.message,/exceeds/.test(e.message)?413:408);
    await run(PYTHON,[...downloadArgs(guard.url),'--write-info-json','-o',path.join(dir,'source.%(ext)s'),'--',source.href],context);
    const files=await readdir(dir);const input=files.find(f=>f.startsWith('source.')&&!/\.(json|part|ytdl)$/.test(f));if(!input)throw fail('No downloadable audio was found.');
    if((await stat(path.join(dir,input))).size>MAX_BYTES)throw fail('This video exceeds 500 MB.',413);
    await encode(path.join(dir,input),output,quality,enhance,context,format);
   }
   const files=await readdir(dir);const info=mode==='stream'?'stream.info.json':files.find(f=>f.startsWith('source.')&&f.endsWith('.info.json'));
   if(info)metadata=JSON.parse((await readFile(path.join(dir,info),'utf8')).trim());
  }
  const size=(await stat(output)).size;if(!size||size>=MAX_BYTES)throw fail('No complete MP3 was produced.');
  updateProgress(jobId,{stage:'Audio ready',percent:100});
  const filename=audioDownloadName(metadata.title,format);const headers={'Content-Type':AUDIO_FORMATS[format].mime,'Content-Length':size,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,'X-Converty-Filename':encodeURIComponent(filename),'X-Converty-Seconds':((performance.now()-started)/1000).toFixed(2),'X-Converty-Mode':mode,'X-Converty-Quality':quality,'X-Converty-Format':format,'X-Converty-Quality-Label':qualityLabel(format,quality)};
  if(cacheKey&&size<=MAX_CACHE){const data=await readFile(output);saveCache(cacheKey,data,headers);res.writeHead(200,headers);res.end(data);}else{res.writeHead(200,headers);await pipeline(createReadStream(output),res);}
 }catch(e){updateProgress(jobId,{stage:'Conversion stopped',percent:null});respond(res,e.status||400,e.status?e.message:'Unable to convert this source. Try uploading your original video.');}
 finally{if(claimed)active--;if(dir)await rm(dir,{recursive:true,force:true,maxRetries:3}).catch(()=>{});}
});
server.listen(Number(process.env.PORT||5174),process.env.HOST||'127.0.0.1',()=>console.log('Converty API ready'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close();guard.close();setTimeout(()=>process.exit(0),1000).unref();});
