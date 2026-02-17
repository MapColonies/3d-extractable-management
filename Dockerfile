# --- Build Stage ---
FROM node:24-slim AS build
WORKDIR /tmp/buildApp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git openssh-client ca-certificates && rm -rf /var/lib/apt/lists/*

# Bypass Git hurdles
RUN git config --global http.sslVerify false && \
    git config --global url."https://github.com/".insteadOf ssh://git@github.com/

COPY package*.json ./
RUN HUSKY=0 npm install --legacy-peer-deps --ignore-scripts && \
    npm install openapi-typescript --no-save

COPY . .
RUN npm run build && npm prune --production

# --- Production Stage ---
FROM node:24-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init gdal-bin && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --chown=node:node --from=build /tmp/buildApp/node_modules ./node_modules
COPY --chown=node:node --from=build /tmp/buildApp/dist .
COPY --chown=node:node --from=build /tmp/buildApp/package.json .

USER node
EXPOSE 8080
CMD ["dumb-init", "node", "--require", "./common/tracing.js", "./index.js"]
