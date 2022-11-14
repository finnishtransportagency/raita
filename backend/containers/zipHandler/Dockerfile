FROM --platform=linux/amd64 node:18-alpine3.15 AS build

WORKDIR /builddir
COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci
COPY ./src/ ./src
COPY ./tsconfig.json ./tsconfig.json
RUN npm run build

FROM --platform=linux/amd64 node:18-alpine3.15
USER node
RUN mkdir -p /home/node/code
WORKDIR /home/node/code

COPY --from=build /builddir .

CMD ["node", "dist/index.js"]
