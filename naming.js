export function audioDisplayName(filename){return String(filename).replace(/\.mp3$/i,'');}
export function audioDownloadName(value) {
 let name=String(value||'').normalize('NFKC').replace(/\.[a-z0-9]{2,5}$/i,'').replace(/https?:\/\/\S+/gi,' ').replace(/\s*-?\s*converty\s*-\s*tump3\s*$/i,'').replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g,' ').replace(/[#_]+/g,' ').replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').replace(/([!.,-])\1+/g,'$1').replace(/\s+/g,' ').replace(/^[\s.\-–—!]+|[\s.\-–—!]+$/g,'').trim();
 name=name.replace(/\b[\d.,]+\s*[kmb]?\s+(?:reactions?|shares?|views?|likes?|comments?)\b\s*[·•|,]?\s*/gi,'').replace(/\s+on\s+Reels\s*$/i,'').replace(/^[\s·•|]+|[\s·•|]+$/g,'').replace(/\s+/g,' ').trim();
 const chars=Array.from(name);if(chars.length>70){let short=chars.slice(0,70).join('');const boundary=short.lastIndexOf(' ');if(boundary>40)short=short.slice(0,boundary);name=short.replace(/[\s.,!\-–—]+$/g,'');}
 if(!name)name='Untitled audio';
 if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))name='Audio '+name;
 return name+' - converty- tump3.mp3';
}
