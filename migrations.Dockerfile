FROM node:20-slim

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .

ENTRYPOINT ["node","--require","ts-node/register","./node_modules/typeorm/cli.js","-d","src/DAL/db.data-source.ts"]
CMD ["migration:run"]
