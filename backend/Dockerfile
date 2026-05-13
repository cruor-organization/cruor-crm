# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-backend,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm exec prisma generate \
 && pnpm exec tsc -p tsconfig.build.json

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-backend-prod,target=/pnpm/store pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3001
USER node
CMD ["node", "dist/index.js"]
