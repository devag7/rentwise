# FROM node:18-alpine is lightweight and optimized for low memory
FROM node:18-alpine

WORKDIR /app

# Install dependencies only when package.json changes
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose non-conflicting port (default is usually 3000, but we can map it via docker-compose)
EXPOSE 3000

# Start server
CMD ["node", "index.js"]
