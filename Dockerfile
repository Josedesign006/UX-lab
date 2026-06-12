# UXLab — self-hosted UX research platform
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
# studies & responses live in /app/data — mount a volume to persist them
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm", "run", "start:lan"]
