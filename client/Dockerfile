# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Angular app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to serve the built Angular app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist/client/browser ./dist

# Expose port
EXPOSE 4200

# Serve the app
CMD ["serve", "-s", "dist", "-l", "4200"]