import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Transform} from 'node:stream';
import {isPublicAddress} from './network-guard.js';
const failure=(message,status=502)=>Object.assign(new Error(message),{status});
async function request(value,{signal,headers={},redirects=0}={}){
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.port)throw failure('Unsafe audio source.');
 const addresses=await lookup(url.hostname,{all:true});
 if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw failure('Unsafe audio host.');
 const address=addresses.find(a=>a.family===4)||addresses[0];
 const response=await new Promise((resolve,reject)=>{
  const req=https.get(url,{headers,signal,lookup:(host,options,callback)=>options.all?callback(null,[address]):callback(null,address.address,address.family)},resolve);
  req.setTimeout(120000,()=>req.destroy(failure('Audio provider timed out.',408)));req.on('error',reject);
 });
 if([301,302,303,307,308].includes(response.statusCode)){
  response.resume();if(redirects>=4||!response.headers.location||Object.keys(headers).length)throw failure('Unexpected provider redirect.');
  return request(new URL(response.headers.location,url),{signal,redirects:redirects+1});
 }
 if(response.statusCode!==200){response.resume();throw failure(response.statusCode===429?'Daily cloud conversion allowance reached. Please try later.':'Cloud audio provider is unavailable.',response.statusCode===429?429:502);}
 return response;
}
export async function cloudAudio({url,output,signal,maxBytes,timeoutMs,key}){
 const abort=new AbortController();const cancelled=()=>abort.abort();signal?.addEventListener('abort',cancelled,{once:true});if(signal?.aborted)cancelled();
 const timer=setTimeout(cancelled,timeoutMs);
 try{
  const endpoint=new URL('https://api.jaky.dev/v1/download/youtube');endpoint.searchParams.set('url',url);endpoint.searchParams.set('format','mp3');endpoint.searchParams.set('quality','128');
  const response=await request(endpoint,{signal:abort.signal,headers:{'x-jaky-key':key}});
  let raw='';for await(const chunk of response){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw failure('Invalid provider response.');}
  let data;try{data=JSON.parse(raw);}catch{throw failure('Invalid provider response.');}
  if(data.status!==true||data.result?.format!=='mp3'||Number(data.result?.quality)!==128||typeof data.result?.downloadUrl!=='string')throw failure('No complete cloud audio was found.');
  const media=await request(data.result.downloadUrl,{signal:abort.signal});
  if(Number(media.headers['content-length'])>maxBytes){media.destroy();throw failure('Audio exceeds 500 MB.',413);}
  let bytes=0;const bounded=new Transform({transform(chunk,encoding,callback){bytes+=chunk.length;callback(bytes>maxBytes?failure('Audio exceeds 500 MB.',413):null,chunk);}});
  await pipeline(media,bounded,createWriteStream(output),{signal:abort.signal});
  if(bytes<1024)throw failure('Incomplete audio received.');
  return {title:String(data.result.title||'Audio'),quality:128};
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancelled);}
}

