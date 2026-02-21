FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the Vite React application
RUN npm run build

EXPOSE 3000

# Start Express Server
CMD ["npm", "start"]