import {spawn} from 'node:child_process';
import {stat} from 'node:fs/promises';
import {FFMPEG,PYTHON,MAX_BYTES,MAX_TIME,CLEANUP,INPUT_OPTIONS,downloadArgs,isPlatformRestricted} from './conversion-config.js';
export async function streamConvert({url,proxy,metadataPath,outputPath,quality,enhance,signal}){
 let bytes=0;
 await new Promise((resolve,reject)=>{
  let pending=2,failed,diagnostic='';
  const downloader=spawn(PYTHON,[...downloadArgs(proxy),'--quiet','--no-simulate','--print-to-file','before_dl:%()j',metadataPath,'-o','-','--',url],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const args=['-hide_banner','-loglevel','error','-nostdin','-y',...INPUT_OPTIONS,'-i','pipe:0','-map','0:a:0','-vn'];
  if(enhance)args.push('-af',CLEANUP);
  args.push('-threads','1','-c:a','libmp3lame','-b:a',`${quality}k`,'-fs',String(MAX_BYTES),outputPath);
  const encoder=spawn(FFMPEG,args,{windowsHide:true,stdio:['pipe','ignore','pipe']});
  const fail=e=>{failed??=e;downloader.kill('SIGKILL');encoder.kill('SIGKILL');};
  const aborted=()=>fail(new Error('Conversion cancelled.'));
  const timer=setTimeout(()=>fail(new Error('Conversion timed out.')),MAX_TIME);
  signal?.addEventListener('abort',aborted,{once:true});if(signal?.aborted)aborted();
  downloader.stderr.on('data',chunk=>{diagnostic=(diagnostic+chunk).slice(-1800);});
  for(const proc of [downloader,encoder]){
   proc.stderr.resume();proc.on('error',fail);
   proc.on('close',code=>{if(code!==0)fail(new Error('Source could not be streamed.'));if(--pending===0){clearTimeout(timer);signal?.removeEventListener('abort',aborted);if(isPlatformRestricted(diagnostic)&&!signal?.aborted){console.error('Platform access restricted:',diagnostic.replace(/https?:\/\/\S+/g,'[source URL]').slice(-1200));reject(Object.assign(new Error('The platform is restricting access from our server. Please upload your original video instead.'),{status:400,code:'PLATFORM_RESTRICTED'}));}else failed?reject(failed):resolve();}});
  }
  downloader.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>MAX_BYTES)fail(new Error('Source exceeds 500 MB.'));});
  encoder.stdin.on('error',()=>{});downloader.stdout.pipe(encoder.stdin);
 });
 const size=(await stat(outputPath)).size;if(size>=MAX_BYTES)throw new Error('Audio exceeds 500 MB.');
 return {downloadBytes:bytes};
}
