FROM node:19-alpine as base

RUN npm i -g pnpm
WORKDIR /app

COPY ./pnpm-lock.yaml ./
RUN pnpm fetch

ADD . ./
RUN pnpm install -r

# Development Target
FROM base as dev
EXPOSE 3000
CMD [ "pnpm", "--filter=astro", "dev" ]

# Production Target
FROM base as prod
EXPOSE 3000
RUN pnpm --filter=astro build
CMD [ "pnpm", "--filter=astro", "start:server" ]
