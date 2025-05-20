# Use a suitable Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json from root
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build the application
RUN npm run build

# Expose the port the application listens on
EXPOSE 3001

# Command to run the application
CMD [ "npm", "run", "start:auth" ]
