import {spawn} from 'node:child_process';
const processes=[spawn(process.execPath,['api.js'],{stdio:'inherit',windowsHide:true}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{stdio:'inherit',windowsHide:true})];
process.on('SIGINT',()=>{for(const child of processes)child.kill();process.exit()});
