FROM node:lts-alpine AS builder

WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm ci --silent
RUN npm run build

FROM builder AS dev

FROM builder AS production-deps
RUN npm prune --omit=dev

FROM node:lts-alpine AS runner
WORKDIR /usr/src/app
COPY --from=production-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 3000
ENTRYPOINT ["node", "./dist/server.js"]