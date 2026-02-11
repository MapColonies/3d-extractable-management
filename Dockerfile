FROM node:24-slim AS build

WORKDIR /tmp/buildApp

COPY ./package*.json ./
COPY .husky/ .husky/

RUN apt-get update && apt-get install -y python3 make g++

RUN npm install
COPY . .
RUN npm run build

FROM node:24-slim AS production

RUN apt-get update && apt-get install -y dumb-init --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV SERVER_PORT=8080

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY .husky/ .husky/

RUN apt-get update && apt-get install -y python3 make g++ --no-install-recommends \
    && npm ci --only=production \
    && apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY --chown=node:node --from=build /tmp/buildApp/dist .
COPY --chown=node:node ./config ./config

USER node
EXPOSE 8080
CMD ["dumb-init", "node", "--import", "./instrumentation.mjs", "./index.js"]
