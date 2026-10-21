# Build from the repository root: docker build -f frontend/Dockerfile .
# The resulting image is Caddy serving the built SPA and proxying the API.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend
COPY shared shared
COPY frontend frontend
RUN npm run build --workspace frontend

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist /srv
