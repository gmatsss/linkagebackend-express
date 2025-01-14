# Use Node.js v18-alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
