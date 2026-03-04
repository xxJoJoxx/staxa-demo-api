FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/
RUN npm ci --production
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY prisma/ ./prisma/
COPY package.json ./
USER app
EXPOSE 3000
CMD ["node", "src/index.js"]
