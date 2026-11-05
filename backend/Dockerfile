FROM node:24-alpine AS build
WORKDIR /backend
COPY . .
RUN npm ci --no-fund --no-audit && npm run build

FROM node:24-alpine
WORKDIR /backend
COPY --from=build /backend /backend
ENV HOST=0.0.0.0
CMD ["node", "services/gateway/dist/main.js"]
