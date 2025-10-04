# Volt Models Service - Local AI models for SweatBot
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create directories for models
RUN mkdir -p /app/models/whisper /app/models/ollama

# Expose port
EXPOSE 8006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8006/health', (r) => {if(r.statusCode !== 200) throw new Error()})"

# Start server
CMD ["npm", "start"]