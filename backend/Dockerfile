# Build from the repository root: docker build -f backend/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend
COPY shared shared
COPY backend backend
RUN npm run build --workspace backend

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace backend --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
COPY backend/drizzle backend/drizzle
RUN mkdir -p /data/uploads && chown node:node /data/uploads
USER node
WORKDIR /app/backend
ENV UPLOAD_DIR=/data/uploads PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/index.js"]
