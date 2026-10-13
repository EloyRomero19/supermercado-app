# --- Etapa 1: compilar la web ---
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci: instala exactamente lo del package-lock (builds reproducibles)
RUN npm ci
COPY . .
RUN npm run build

# --- Etapa 2: Caddy sirve la web y hace de proxy hacia el backend (con HTTPS automático) ---
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
