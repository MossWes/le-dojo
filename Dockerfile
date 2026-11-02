# --- Build -------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
# Tools to compile better-sqlite3 if no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# --- Runtime -----------------------------------------------------------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
	PORT=3000 \
	TZ=Europe/Paris \
	DATABASE_PATH=/app/data/dojo.sqlite
WORKDIR /app
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/seed ./seed
COPY --from=build --chown=node:node /app/assets/reference ./assets/reference
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir -p /app/data && chown node:node /app/data && chmod 700 /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "build"]
