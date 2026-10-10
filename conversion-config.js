import ffmpegStatic from 'ffmpeg-static';
export const FFMPEG=process.env.FFMPEG_PATH||ffmpegStatic;
export const PYTHON=process.env.PYTHON_PATH||'python';
export const MAX_BYTES=500*1024*1024;
export const MAX_TIME=10*60*1000;
export const CLEANUP='highpass=f=40,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11';
export const INPUT_OPTIONS=['-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm,avi,mpegts,mpeg,mpegvideo,asf,flv,ogg,wav,mp3,aac,flac,amr'];
export function downloadArgs(proxy){return ['-m','yt_dlp','--ignore-config','--proxy',proxy,'--js-runtimes',`node:${process.execPath}`,'--no-playlist','--no-progress','--no-cache-dir','--no-warnings','--concurrent-fragments',process.env.RENDER?'4':'16','--max-filesize','500M','--socket-timeout','20','--retries','1','--fragment-retries','1','--abort-on-unavailable-fragments','--match-filter','!is_live & duration <=? 7200','-f','bestaudio/best'];}
