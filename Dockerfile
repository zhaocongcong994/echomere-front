FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 生成 Prisma Client（前端类型需要）
RUN npx prisma generate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=""
ENV PORT=3000

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
