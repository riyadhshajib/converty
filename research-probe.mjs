// Owner-triggered, bounded diagnostic. No public route, cookies or credentials.
import {spawn} from 'node:child_process';
import {startNetworkGuard} from './network-guard.js';
import {PYTHON,downloadArgs} from './conversion-config.js';
const guard=await startNetworkGuard();
const samples=[
 ['youtube-web-safari','https://www.youtube.com/watch?v=jNQXAC9IVRw',['--extractor-args','youtube:player_client=web_safari']],
 ['youtube-ios','https://www.youtube.com/watch?v=jNQXAC9IVRw',['--extractor-args','youtube:player_client=ios']],
 ['youtube-embedded','https://www.youtube.com/watch?v=jNQXAC9IVRw',['--extractor-args','youtube:player_client=web_embedded']],
 ['facebook-reel','https://www.facebook.com/reel/274175099429670',[]],
 ['facebook-browser','https://www.facebook.com/video.php?v=274175099429670',['--impersonate','chrome']],
 ['facebook-public-government','https://www.facebook.com/gov.sg/videos/10154383743583686/',[]]
];
try{for(const [name,url,extra]of samples){await new Promise(resolve=>{
 const started=Date.now();let output='',error='';
 const p=spawn(PYTHON,[...downloadArgs(guard.url),'--skip-download','-J',...extra,'--',url],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 const timer=setTimeout(()=>p.kill('SIGKILL'),45000);
 p.stdout.on('data',b=>{output=(output+b).slice(-2500000);});p.stderr.on('data',b=>{error=(error+b).slice(-1200);});
 p.on('error',e=>{error=e.message;});p.on('close',code=>{clearTimeout(timer);let data={};try{data=JSON.parse(output)||{};}catch{}
 console.log('CONVERTY_PROBE',JSON.stringify({name,code,seconds:(Date.now()-started)/1000,title:data.title?.slice(0,90),formats:data.formats?.length,audio:data.acodec,error:error.replace(/https?:\/\/\S+/g,'[source URL]')}));resolve();});
 });}}finally{guard.close();console.log('CONVERTY_PROBE complete');}
