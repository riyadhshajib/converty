import './style.css';
import './cream.css';
import './mixed.css';
import './contrast.css';
import './processing.css';
import {audioDownloadName,audioDisplayName} from './naming.js';
import {AUDIO_FORMATS,qualityLabel} from './audio-formats.js';


const API=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
import {headphoneMark} from './logo.js';
document.querySelector('#app').innerHTML = `
<header><a class="logo" href="/" aria-label="converty home">Conver<span class="logo-t">t${headphoneMark("header-headphones")}</span>y</a><div class="header-note"><span class="live-dot"></span> ANY VIDEO TO AUDIO</div><button class="help" id="help">How it works ${arrow}</button></header>
<main><section class="intro"><div class="eyebrow"><span></span> VIDEO TO AUDIO, BEAUTIFULLY SIMPLE</div><h1>Keep the feeling<br><span>Just the sound</span></h1><p>Your favorite moments, without the screen.<br>Turn a video into audio worth keeping.</p></section>
<section class="converter" aria-label="Video converter"><div class="panel-head"><div><span class="step">01 / </span> MAKE IT AUDIO</div><span class="format">VIDEO <span>→</span> <b id="format-badge">MP3</b></span></div>
<input id="file" type="file" accept="video/*,.mkv,.avi,.mov,.webm,.mp4,.m4v,.mpeg,.ts" hidden>
<div class="source-tabs"><button class="source-tab active" id="link-tab">Paste a link</button><button class="source-tab" id="upload-tab">Upload a video</button></div>
<div id="link-panel"><label for="video-url">VIDEO LINK</label><div class="url-row"><input id="video-url" type="url" placeholder="Paste a video link here"><button id="load-url">Convert ${arrow}</button></div><p id="link-availability">Public beta · YouTube links are temporarily unavailable. Paste a public Facebook, TikTok or Instagram link, or upload your original video.</p></div>
<button class="drop" id="drop" hidden><span class="upload-icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 22V6m-6 6 6-6 6 6M6 21v6h20v-6"/></svg></span><strong id="file-title">Drop your video here</strong><span id="file-sub">or click to browse your files</span><small>MP4, MOV, WEBM, MKV & MORE · UP TO 500 MB</small></button>
<div class="output-format"><label for="audio-format">Audio format</label><select id="audio-format"><option value="mp3">MP3 · Most compatible</option><option value="m4a">M4A · Compact AAC audio</option><option value="wav">WAV · Uncompressed audio</option><option value="flac">FLAC · Lossless encoding</option><option value="ogg">OGG · Vorbis audio</option></select><p id="format-note">MP3 works on almost every device.</p></div><div class="options"><div class="option"><label for="quality">Audio quality</label><div class="select-wrap"><select id="quality"><option value="320">Maximum · 320 kbps</option><option value="256">High · 256 kbps</option><option value="192">Balanced · 192 kbps</option><option value="128">Compact · 128 kbps</option></select></div></div><div class="option enhancement"><label for="enhance">Audio cleanup <span class="optional">OPTIONAL</span></label><div class="toggle-row"><span>Less noise. Balanced volume.</span><input id="enhance" type="checkbox" role="switch" aria-label="Enable audio cleanup"></div></div></div>
<button class="convert" id="convert" disabled hidden><span>Convert to MP3</span>${arrow}</button><div id="status" role="status" aria-live="polite" class="status">Paste a link or choose a video to get started.</div><div id="progress-wrap" hidden><progress id="progress" max="100" value="0"></progress></div>
<div id="result" hidden><div class="ready"><span class="live-dot"></span> YOUR AUDIO IS READY</div><div id="result-filename" class="status"></div><audio id="audio" controls></audio><a class="download" id="download">Download MP3 ${arrow}</a><button id="again" class="again">Convert another video</button></div>
<div class="privacy"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><rect x="4" y="7" width="8" height="7" rx="2"/><path d="M5.5 7V4a2.5 2.5 0 0 1 5 0v3"/></svg> Temporary files are deleted after processing. Link results may be cached for five minutes.</div></section>
<section class="benefits"><div><span>01</span><h3>All sound. No fuss.</h3><p>One file in. Your audio out.<br>That’s the whole idea.</p></div><div><span>02</span><h3>Give it the good treatment.</h3><p>Up to 320 kbps, with optional<br>noise and volume cleanup.</p></div><div><span>03</span><h3>Keep it yours.</h3><p>Your files stay yours.<br>No account required.</p></div></section>
<p class="honest">Great audio starts with a great source. Cleanup can improve listening comfort, but cannot recover missing detail. Up to 500 MB per source. Public links support videos up to two hours. Availability and speed depend on the source and service capacity.</p></main><footer><span class="logo">Conver<span class="logo-t">t${headphoneMark("footer-headphones")}</span>y</span><span>LESS SCREEN. MORE SOUND.</span><span>Made for the moments you keep.</span><nav aria-label="Conversion guides"><a href="/youtube-to-mp3/">YouTube to MP3</a> · <a href="/facebook-video-to-mp3/">Facebook Video to MP3</a></nav><nav aria-label="Site information"><a href="/about/">About</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></nav></footer>
<dialog id="guide"><button id="close" aria-label="Close instructions">✕</button><div class="eyebrow">THREE SIMPLE STEPS</div><h2>From video to<br>on repeat.</h2><ol><li>Paste a video link or choose a file.</li><li>Select an audio format, quality and optional cleanup.</li><li>Convert, listen, and download your audio.</li></ol><p>Paste a public video link or choose a file. Links request the best available audio. Larger sources and cleanup take longer. Keep this tab open during conversion.</p></dialog>`;
const $ = id => document.getElementById(id);
function syncFormat(){
 const format=$('audio-format').value,selected=AUDIO_FORMATS[format];
 $('format-badge').textContent=selected.label;
 $('convert').innerHTML=`<span>Convert to ${selected.label}</span>${arrow}`;
 $('quality').disabled=selected.lossless;
 for(const option of $('quality').options){const labels={'320':'Maximum','256':'High','192':'Balanced','128':'Compact'};option.textContent=labels[option.value]+(format==='ogg'?' · Vorbis VBR':` · ${option.value} kbps`);}
 $('quality').hidden=selected.lossless;
 $('quality').parentElement.querySelector('.lossless-label')?.remove();
 if(selected.lossless){const label=document.createElement('span');label.className='lossless-label';label.textContent='Source quality · Lossless encoding';$('quality').after(label);}
 $('format-note').textContent={mp3:'MP3 works on almost every device.',m4a:'AAC audio in an M4A file. Compact and widely supported.',wav:'Uncompressed audio. Larger files; the 500 MB output limit still applies.',flac:'Lossless compression. Keeps available source detail with smaller files than WAV.',ogg:'Vorbis uses variable bitrate. Quality levels control detail rather than an exact bitrate.'}[format]+' YouTube sources start at 128 kbps MP3; changing formats cannot restore lost detail.';
}
$('audio-format').onchange=syncFormat;

const processing = document.createElement('div');
processing.className='processing'; processing.hidden=true;
processing.innerHTML='<div class="processing-heading"><span class="processing-spinner" aria-hidden="true"></span><strong>Making your audio</strong><span class="processing-time" aria-hidden="true">0:00</span></div><div class="processing-numbers"><b class="processing-percent">0%</b><span class="processing-remaining">Waiting for measured progress</span></div><progress class="processing-bar" aria-label="Conversion progress" max="100" value="0"></progress><p class="processing-note">Keep this tab open while your video is processed.</p>';
$('status').before(processing);
$('again').addEventListener('click',()=>{processing.hidden=true;});
let processingTimer,progressPoll,progressAbort,progressJob,receivingAudio=false,uploadInProgress=false;
function showProgress(percent,complete=false,stage='Converting audio'){
 const measured=typeof percent==='number'&&Number.isFinite(percent);
 processing.classList.toggle('is-indeterminate',!measured);
 processing.querySelector('strong').textContent=complete?'Conversion complete':stage;
 processing.querySelector('.processing-percent').textContent=measured?`${percent}%`:'Working';
 processing.querySelector('.processing-remaining').textContent=complete?'Complete · Your audio is ready':measured?`${100-percent}% of this stage remaining`:'Waiting for measured progress';
 const bar=processing.querySelector('.processing-bar');bar.setAttribute('aria-label',`${stage} progress`);
 if(measured)bar.value=percent;else bar.removeAttribute('value');
 processing.querySelector('.processing-note').textContent=complete?'Your audio is ready to listen to and download.':measured?'Measured progress for the current stage. Each stage starts at 0%.':'This stage does not report a percentage. Keep this tab open; the timer shows how long it has been running.';
}
async function receiveAudio(response){
 receivingAudio=true;const total=Number(response.headers.get('Content-Length'));let loaded=0;const parts=[];
 showProgress(total>0?0:null,false,'Downloading your audio');
 const reader=response.body.getReader();
 while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);loaded+=value.byteLength;showProgress(total>0?Math.min(99,Math.floor(loaded/total*100)):null,false,'Downloading your audio');}
 return new Blob(parts,{type:response.headers.get('Content-Type')||'audio/mpeg'});
}
function setProcessing(active, buttonId){
 processing.hidden=!active && $('result').hidden;
 document.querySelector('.converter').setAttribute('aria-busy',String(active));
 for(const id of ['load-url','convert','drop','quality','audio-format','enhance','link-tab','upload-tab','video-url','again'])$(id).disabled=active || (id==='convert'&&!file);
 if(active){
  processing.classList.remove('is-complete');receivingAudio=false;uploadInProgress=buttonId==='convert';progressJob=crypto.randomUUID();progressAbort=new AbortController();
  showProgress(buttonId==='convert'?0:null,false,buttonId==='convert'?'Uploading your video':'Preparing source audio');
  const button=$(buttonId); button.dataset.idleHtml=button.innerHTML;
  button.innerHTML='<span class="processing-spinner" aria-hidden="true"></span><span>Converting…</span>';
  button.classList.add('is-processing');
  const started=Date.now(); processing.querySelector('.processing-time').textContent='0:00';
  processingTimer=setInterval(()=>{const seconds=Math.floor((Date.now()-started)/1000);processing.querySelector('.processing-time').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;},1000);
  const job=progressJob,signal=progressAbort.signal;let polling=false;
  progressPoll=setInterval(async()=>{if(polling||receivingAudio||uploadInProgress||signal.aborted)return;polling=true;try{const response=await fetch(`${API}/api/progress?job=${job}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(4000)])});if(response.ok){const state=await response.json();if(!signal.aborted&&!receivingAudio&&!uploadInProgress&&!['MP3 ready','Audio ready'].includes(state.stage))showProgress(state.percent,false,state.stage);}}catch{}finally{polling=false;}},800);
 }else{
  clearInterval(processingTimer);clearInterval(progressPoll);progressAbort?.abort(); $('progress-wrap').hidden=true;
  if(!$('result').hidden){showProgress(100,true);processing.classList.add('is-complete');processing.querySelector('strong').textContent='Conversion complete';processing.querySelector('.processing-note').textContent='Your audio is ready to listen to and download.';}
  for(const button of document.querySelectorAll('.is-processing')){button.innerHTML=button.dataset.idleHtml;button.classList.remove('is-processing');delete button.dataset.idleHtml;}syncFormat();
 }
}
fetch(API+'/api/status',{signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():null).then(state=>{if(state?.youtubeCloudAvailable)$('link-availability').textContent='YouTube links convert in the cloud at 128 kbps. No app or account needed. Other public links depend on platform availability.';else if(state?.youtubeWorkerOnline)$('link-availability').textContent='Paste a public YouTube, Facebook, TikTok or Instagram video link. We request the best available source audio. Private and protected videos may be unavailable.';}).catch(()=>{});
for(const type of ['upload','link']) $(type+'-tab').onclick=()=>{if(busy)return; $('link-panel').hidden=type!=='link'; $('drop').hidden=type!=='upload'; $('convert').hidden=type!=='upload'; $('upload-tab').classList.toggle('active',type==='upload'); $('link-tab').classList.toggle('active',type==='link');};
$('load-url').onclick=async()=>{
 if(busy)return;
 let url; try{url=new URL($('video-url').value); if(url.protocol!=='https:')throw 0;}catch{$('status').textContent='Paste a valid HTTPS video link.';return;}
 busy=true; setProcessing(true,'load-url'); $('result').hidden=true; $('status').textContent='Getting the best available source audio and converting…';
 try{const response=await fetch(`${API}/api/link?job=${progressJob}&format=${$('audio-format').value}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url.href,quality:$('quality').value,enhance:$('enhance').checked}),signal:AbortSignal.timeout(1260000)}); if(!response.ok)throw new Error((await response.text()).slice(0,300));const blob=await receiveAudio(response);if(outputURL)URL.revokeObjectURL(outputURL);outputURL=URL.createObjectURL(blob);$('audio').src=outputURL;$('download').href=outputURL;$('download').download=decodeURIComponent(response.headers.get('X-Converty-Filename')||encodeURIComponent(audioDownloadName('Untitled audio',response.headers.get('X-Converty-Format')||'mp3')));$('result-filename').textContent=audioDisplayName($('download').download);$('download').innerHTML=`Download ${($('download').download.split('.').pop()||'mp3').toUpperCase()} ${arrow}`;$('result').hidden=false;$('status').textContent=`Done · ${response.headers.get('X-Converty-Quality-Label')||((response.headers.get('X-Converty-Quality')||$('quality').value)+' kbps')} · ${(blob.size/1024/1024).toFixed(1)} MB · ${response.headers.get('X-Converty-Seconds')||'?'} seconds${$('enhance').checked?' · Cleanup applied':''}`;}
 catch(error){$('status').textContent=error.message||'Could not convert this source. Try uploading the original video.';}
 finally{busy=false;setProcessing(false);}
};
let file, outputURL, busy = false;
function choose(f) {
 if (!f || busy) return;
 if(f.size > 500 * 1024 * 1024) { $('status').textContent = 'This file exceeds 500 MB. Choose a smaller video.'; return; }
 file=f; $('file-title').textContent=f.name; $('file-sub').textContent=`${(f.size/1024/1024).toFixed(1)} MB · Ready to convert`; $('convert').disabled=false; $('status').textContent='Ready. Choose your quality and make it audio.'; $('result').hidden=true;
 processing.hidden=true;
}
$('drop').onclick=()=>$('file').click(); $('file').onchange=e=>choose(e.target.files[0]);
for (const event of ['dragenter','dragover']) $('drop').addEventListener(event,e=>{e.preventDefault(); $('drop').classList.add('dragging');});
$('drop').addEventListener('dragleave',()=>$('drop').classList.remove('dragging'));
$('drop').addEventListener('drop',e=>{e.preventDefault(); $('drop').classList.remove('dragging'); choose(e.dataTransfer.files[0]);});
$('help').onclick=()=>$('guide').showModal(); $('close').onclick=()=>$('guide').close();
$('again').onclick=()=>{file=null; $('file').value=''; $('file-title').textContent='Drop your video here'; $('file-sub').textContent='or click to browse your files'; $('result').hidden=true; $('convert').disabled=true; $('status').textContent='Choose a video to get started.'; if(outputURL) URL.revokeObjectURL(outputURL); $('audio').removeAttribute('src');};
$('convert').onclick=async()=>{
 if(!file||busy)return;busy=true;setProcessing(true,'convert');$('result').hidden=true;
 $('status').textContent=$('enhance').checked?'Cleaning up audio and creating your audio…':'Creating your audio…';
 try{
  const blob=await uploadVideo(file,`${API}/api/file?quality=${$('quality').value}&enhance=${$('enhance').checked}&job=${progressJob}&format=${$('audio-format').value}`);if(outputURL)URL.revokeObjectURL(outputURL);outputURL=URL.createObjectURL(blob);
  $('audio').src=outputURL;$('download').href=outputURL;$('download').download=audioDownloadName(file.name,$('audio-format').value);$('result-filename').textContent=audioDisplayName($('download').download);$('download').innerHTML=`Download ${($('download').download.split('.').pop()||'mp3').toUpperCase()} ${arrow}`;$('result').hidden=false;
  $('status').textContent=`Done · ${qualityLabel($('audio-format').value,$('quality').value)} · ${(blob.size/1024/1024).toFixed(1)} MB${$('enhance').checked?' · Cleanup applied':''}`;
 }catch(error){$('status').textContent=error.message||'Could not convert this video. Check that it has audio and is under 500 MB, then retry.';}
 finally{busy=false;setProcessing(false);}
};
function uploadVideo(file,url){return new Promise((resolve,reject)=>{
 const xhr=new XMLHttpRequest();xhr.open('POST',url);xhr.responseType='blob';xhr.timeout=660000;
 xhr.upload.onprogress=event=>{if(event.lengthComputable){const percent=Math.floor(event.loaded/event.total*100);showProgress(percent,false,'Uploading your video');$('status').textContent=`Uploading video · ${percent}%`;}};
 xhr.upload.onload=()=>{uploadInProgress=false;showProgress(null,false,'Converting audio');$('status').textContent=$('enhance').checked?'Cleaning up audio and creating your audio…':'Creating your audio…';};
 xhr.onprogress=event=>{receivingAudio=true;showProgress(event.lengthComputable?Math.min(99,Math.floor(event.loaded/event.total*100)):null,false,'Downloading your audio');};
 const fail=()=>reject(new Error('Could not reach the converter. Please retry shortly.'));
 xhr.onload=async()=>{if(xhr.status===200)resolve(xhr.response);else{const detail=await xhr.response.text().catch(()=>'');reject(new Error(detail.slice(0,300)||'Could not convert this video. Please retry shortly.'));}};
 xhr.onerror=fail;xhr.ontimeout=fail;xhr.send(file);
});}

