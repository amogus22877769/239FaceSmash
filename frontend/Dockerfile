FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:alpine
WORKDIR /usr/share/caddy
COPY --from=build /app/dist ./
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443