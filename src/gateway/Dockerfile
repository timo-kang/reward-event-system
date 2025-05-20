# Use a suitable Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (if needed, e.g., for TypeScript)
RUN npm run build gateway

# Expose the port the application listens on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "run", "start" ]
