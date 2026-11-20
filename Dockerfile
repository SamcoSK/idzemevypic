# Multi-stage Dockerfile for IdzemeVypic
FROM node:18-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run build
ENV NODE_ENV=production
RUN npm run build
RUN npm run seed

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["npm", "run", "start"]
