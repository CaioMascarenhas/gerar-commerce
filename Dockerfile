FROM node:24-alpine AS build
WORKDIR /workspace
COPY . .
RUN npm ci --no-fund --no-audit && npm run build

FROM node:24-alpine AS service
WORKDIR /workspace
COPY --from=build /workspace /workspace
ENV HOST=0.0.0.0
ARG SERVICE=gateway
ENV SERVICE=${SERVICE}
CMD ["sh", "-c", "exec node apps/$SERVICE/dist/main.js"]

FROM nginx:stable-alpine AS storefront
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/storefront/browser /usr/share/nginx/html
EXPOSE 80
