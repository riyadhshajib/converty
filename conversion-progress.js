// Percentages describe one measured stage, never a guessed overall job duration.
export function createProgressReader({duration=()=>null,report}){
 let pending='',seconds=0;
 return chunk=>{
  pending+=chunk.toString();
  const lines=pending.split(/\r?\n/);pending=lines.pop().slice(-4096);
  for(const line of lines){
   const match=line.match(/^out_time_us=(\d+)$/);
   if(match)seconds=Number(match[1])/1e6;
   if(line.startsWith('progress=')){
    const total=Number(duration());
    report({stage:'Converting audio',percent:total>0?Math.min(99,Math.floor(seconds/total*100)):null});
   }
  }
 };
}
export function durationFromLog(text){
 const match=text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
 return match?Number(match[1])*3600+Number(match[2])*60+Number(match[3]):null;
}
