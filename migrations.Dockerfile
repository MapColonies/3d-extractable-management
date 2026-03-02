FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ cmake pkg-config libgdal-dev gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/app

COPY ./package*.json ./
RUN npm install
COPY . .

ENTRYPOINT ["node", "--require", "ts-node/register", "./node_modules/typeorm/cli.js"]
CMD ["migration:run"]
