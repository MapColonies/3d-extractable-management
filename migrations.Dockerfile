# --- Build Stage ---
FROM node:24 AS build



WORKDIR /tmp/buildApp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git openssh-client ca-certificates && rm -rf /var/lib/apt/lists/*

COPY ./package*.json ./
COPY .husky/ .husky/

RUN npm install
COPY . .
RUN npm run build

FROM node:24-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
COPY .husky/ .husky/

RUN npm ci --only=production

COPY --chown=node:node --from=build /tmp/buildApp/dist .
COPY --chown=node:node ./config ./config

ENTRYPOINT ["node", "--require", "ts-node/register", "./node_modules/typeorm/cli.js"]
CMD ["migration:run"]
