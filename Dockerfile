# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY package.json ./
COPY bun.lock* ./
RUN npm install --no-audit --no-fund

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/

# --- Run stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7860
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./

EXPOSE 7860
CMD ["node", "server.js"]
