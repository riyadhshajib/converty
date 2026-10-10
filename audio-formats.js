export const AUDIO_FORMATS={
 mp3:{label:'MP3',mime:'audio/mpeg',lossless:false},
 m4a:{label:'M4A',mime:'audio/mp4',lossless:false},
 wav:{label:'WAV',mime:'audio/wav',lossless:true},
 flac:{label:'FLAC',mime:'audio/flac',lossless:true},
 ogg:{label:'OGG',mime:'audio/ogg',lossless:false},
};
export function encoderOptions(format,quality){
 switch(format){
  case 'mp3':return ['-c:a','libmp3lame','-b:a',`${quality}k`];
  case 'm4a':return ['-c:a','aac','-b:a',`${quality}k`,'-movflags','+faststart'];
  case 'wav':return ['-c:a','pcm_s24le'];
  case 'flac':return ['-c:a','flac','-compression_level','5'];
  case 'ogg':return ['-c:a','libvorbis','-q:a',String({'128':4,'192':6,'256':8,'320':9}[quality]||9)];
  default:throw new Error('Unsupported audio format.');
 }
}
export function qualityLabel(format,quality){return AUDIO_FORMATS[format].lossless?'Lossless encoding':format==='ogg'?'Vorbis VBR':`${quality} kbps`;}
