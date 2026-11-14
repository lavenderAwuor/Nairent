# Builds the production API image and bundles the client assets.
FROM node:22-bookworm-slim AS client-build
WORKDIR /workspace/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /workspace/client/dist ./public
EXPOSE 4000
USER node
CMD ["node", "src/server.js"]
