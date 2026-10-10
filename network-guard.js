import http from 'node:http';
import net from 'node:net';
import {lookup} from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
export function isPublicAddress(value){
 try{let ip=ipaddr.parse(value);if(ip.kind()==='ipv6'&&ip.isIPv4MappedAddress())ip=ip.toIPv4Address();return ip.range()==='unicast'&&(ip.kind()==='ipv4'||ip.match(ipaddr.parse('2000::'),3));}catch{return false;}
}
const hosts=['youtube.com','youtu.be','facebook.com','fb.watch','instagram.com','tiktok.com'];
export function validateSource(value){
 let u;try{u=new URL(value);}catch{throw new Error('Paste a valid video link.');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new Error('Use a public YouTube, Facebook, TikTok or Instagram HTTPS link, or upload your video.');
 u.hash='';return u;
}
// Resolve each HTTPS tunnel once, then connect to that exact public address.
// Redirects and extractor media requests go through this same proxy.
export async function startNetworkGuard(){
 const sockets=new Set();
 const proxy=http.createServer((req,res)=>{res.writeHead(403);res.end('HTTPS is required');});
 proxy.on('connect',async(req,client,head)=>{
  let upstream;const fail=()=>{client.destroy();upstream?.destroy();};
  client.on('error',fail);client.setTimeout(120000,fail);
  try{
   const target=new URL('https://'+req.url);
   if(target.port&&target.port!=='443'||target.username||target.password||target.pathname!=='/')throw Error();
   const host=target.hostname.replace(/^\[|\]$/g,'');const addresses=await lookup(host,{all:true});
   if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw Error();
   const address=addresses.find(a=>a.family===4)||addresses[0];
   upstream=net.connect({host:address.address,port:443,family:address.family});
   sockets.add(upstream);upstream.on('close',()=>sockets.delete(upstream));upstream.on('error',fail);upstream.setTimeout(120000,fail);
   client.on('close',()=>upstream.destroy());
   upstream.on('connect',()=>{client.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);upstream.pipe(client);client.pipe(upstream);});
  }catch{fail();}
 });
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
 return {url:`http://127.0.0.1:${proxy.address().port}`,close:()=>{for(const s of sockets)s.destroy();proxy.close();}};
}
