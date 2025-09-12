# syntax=docker/dockerfile:1

FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps --silent
COPY . .
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 5174
CMD ["npm", "run", "preview", "--", "--host", "--port", "5174"]
