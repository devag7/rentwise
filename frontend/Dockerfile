# Base image for building
FROM node:18-alpine AS build

WORKDIR /app

# Clean install to optimize space
COPY package*.json ./
RUN npm ci

COPY . .

# Build the React/Vite app
RUN npm run build

# Use Nginx alpine to serve static files for ultra-low memory usage
FROM nginx:alpine

# Copy custom minimal nginx config if needed (we'll rely on default for now but copy build)
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 (to be mapped in docker-compose)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
