FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY src ./src
RUN mkdir -p uploads/properties uploads/agreements uploads/documents
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "src/app.js"]


