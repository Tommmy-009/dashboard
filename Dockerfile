# ---- build React ----
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- run Express ----
FROM node:20
WORKDIR /app
COPY --from=build /app /app
RUN npm install --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
