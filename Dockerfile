FROM harbor.haiberg.cn/cids/node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com/
RUN npm install --legacy-peer-deps --include=optional && npm install @rollup/rollup-linux-x64-gnu
COPY . .
RUN npm run build

FROM harbor.haiberg.cn/cids/nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html/mf/portal
COPY env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-env-config.sh
RUN chmod +x /docker-entrypoint.d/40-env-config.sh
