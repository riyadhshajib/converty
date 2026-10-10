import {defineConfig} from 'vite';
export default defineConfig({optimizeDeps:{exclude:['@ffmpeg/ffmpeg','@ffmpeg/util']},server:{proxy:{'/api':'http://127.0.0.1:5174'}}});
