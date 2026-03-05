FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/
RUN npm ci --production
RUN npx prisma generate

FROM node:20-alpine
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app src/ ./src/
COPY --chown=app:app prisma/ ./prisma/
COPY --chown=app:app package.json ./
COPY --chown=app:app entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q -O - http://localhost:3000/health || exit 1

USER app
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "src/index.js"]
