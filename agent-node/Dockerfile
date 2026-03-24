FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application code
COPY index.js .

# Command to run the application (expects MASTER_URL and AGENT_TOKEN env vars)
CMD ["node", "index.js"]
