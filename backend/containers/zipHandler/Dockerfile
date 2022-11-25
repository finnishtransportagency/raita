FROM --platform=linux/amd64 node:18-alpine3.15 AS build
WORKDIR /builddir
COPY ./package-lock.json ./package.json ./tsconfig.json ./
RUN npm ci
COPY ./src ./src/
RUN npm run build

FROM --platform=linux/amd64 node:18-alpine3.15
USER node
RUN mkdir -p /home/node/code
WORKDIR /home/node/code
COPY --from=build /builddir .
CMD ["node", "dist/index.js"]
