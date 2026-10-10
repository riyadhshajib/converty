FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && node node_modules/ffmpeg-static/install.js && node_modules/ffmpeg-static/ffmpeg -version
COPY requirements.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt
COPY api.js network-guard.js conversion-config.js stream-safe.js naming.js research-probe.mjs ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000 PYTHON_PATH=/opt/venv/bin/python MAX_CONCURRENT=1 CONVERTY_DIAGNOSTICS=1
USER node
EXPOSE 10000
CMD ["node","api.js"]
