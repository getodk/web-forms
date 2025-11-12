# ---------- Build stage ----------
FROM node:20.19.3 AS builder
WORKDIR /app

# Install ONLY OpenJDK (ignore GPG for this trusted repo)
RUN apt-get update --allow-insecure-repositories && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production
COPY . .
RUN yarn install --frozen-lockfile

# Emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
    cd /emsdk && ./emsdk install latest && ./emsdk activate latest

RUN cd /emsdk && . ./emsdk_env.sh && cd /app && yarn build --force

# ---------- Runtime stage ----------
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.48.0-focal

# Install Node 20.19.3 from .deb file (no apt-get update)
RUN curl -fsSL https://deb.nodesource.com/node_20.x/pool/main/n/nodejs/nodejs_20.19.3-1nodesource1_amd64.deb -o /tmp/nodejs.deb && \
    dpkg -i /tmp/nodejs.deb && rm /tmp/nodejs.deb && \
    npm i -g yarn@1.22.22

WORKDIR /app
COPY --from=builder /app /app

# Install Playwright browsers only
RUN yarn playwright install

# Run visual-chromium (headed) with GPU-enabled Xvfb
CMD ["bash", "-c", "\
  Xvfb :99 -ac +extension GLX +render -screen 0 1280x720x24 -nolisten tcp > /dev/null 2>&1 & \
  sleep 3; \
  export DISPLAY=:99; \
  PWDEBUG=1 yarn workspace @getodk/web-forms test:e2e:visual-chromium --reporter=html \
"]
